import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { paraNumero } from '../common/decimal';
import { Prisma, StatusAgendamento } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AlterarStatusDto,
  AtualizarAgendamentoDto,
  CriarAgendamentoDto,
  FiltroAgendamentosDto,
  HorariosLivresDto,
} from './dto/agendamento.dto';

const MINUTO = 60_000;
const INICIO_EXPEDIENTE = 8 * 60;
const FIM_EXPEDIENTE = 18 * 60;
const INICIO_ALMOCO = 12 * 60;
const FIM_ALMOCO = 13 * 60;
const INTERVALO_GRADE = 15;

const incluir = {
  cliente: { select: { id: true, nome: true, telefone: true } },
  profissional: { select: { id: true, nome: true, cor: true, especialidade: true } },
  servico: { select: { id: true, nome: true, duracaoMinutos: true } },
} satisfies Prisma.AgendamentoInclude;

type AgendamentoCompleto = Prisma.AgendamentoGetPayload<{ include: typeof incluir }>;

function formatar(agendamento: AgendamentoCompleto) {
  return { ...agendamento, valor: paraNumero(agendamento.valor) };
}

@Injectable()
export class AgendamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar({ inicio, fim, profissionalId }: FiltroAgendamentosDto) {
    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        inicio: { lt: new Date(fim) },
        fim: { gt: new Date(inicio) },
        ...(profissionalId ? { profissionalId } : {}),
      },
      include: incluir,
      orderBy: { inicio: 'asc' },
    });
    return agendamentos.map(formatar);
  }

  async buscar(id: string) {
    const agendamento = await this.prisma.agendamento.findUnique({ where: { id }, include: incluir });
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado');
    return formatar(agendamento);
  }

  async criar(dto: CriarAgendamentoDto) {
    const inicio = new Date(dto.inicio);
    const servico = await this.validar(dto.clienteId, dto.profissionalId, dto.servicoId);
    const fim = new Date(inicio.getTime() + servico.duracaoMinutos * MINUTO);
    await this.verificarConflito(dto.profissionalId, inicio, fim);

    const agendamento = await this.prisma.agendamento.create({
      data: {
        inicio,
        fim,
        valor: servico.preco,
        observacoes: dto.observacoes || null,
        clienteId: dto.clienteId,
        profissionalId: dto.profissionalId,
        servicoId: dto.servicoId,
      },
      include: incluir,
    });
    return formatar(agendamento);
  }

  async atualizar(id: string, dto: AtualizarAgendamentoDto) {
    const atual = await this.prisma.agendamento.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Agendamento não encontrado');
    if (atual.status === 'CONCLUIDO' || atual.status === 'CANCELADO') {
      throw new BadRequestException('Agendamentos concluídos ou cancelados não podem ser alterados');
    }

    const clienteId = dto.clienteId ?? atual.clienteId;
    const profissionalId = dto.profissionalId ?? atual.profissionalId;
    const servicoId = dto.servicoId ?? atual.servicoId;
    const inicio = dto.inicio ? new Date(dto.inicio) : atual.inicio;

    const servico = await this.validar(clienteId, profissionalId, servicoId);
    const fim = new Date(inicio.getTime() + servico.duracaoMinutos * MINUTO);
    await this.verificarConflito(profissionalId, inicio, fim, id);

    const agendamento = await this.prisma.agendamento.update({
      where: { id },
      data: {
        clienteId,
        profissionalId,
        servicoId,
        inicio,
        fim,
        valor: servicoId !== atual.servicoId ? servico.preco : atual.valor,
        observacoes: dto.observacoes === undefined ? undefined : dto.observacoes || null,
      },
      include: incluir,
    });
    return formatar(agendamento);
  }

  async alterarStatus(id: string, { status }: AlterarStatusDto) {
    const atual = await this.prisma.agendamento.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Agendamento não encontrado');
    if (atual.status === 'CANCELADO' && status !== 'CANCELADO') {
      await this.verificarConflito(atual.profissionalId, atual.inicio, atual.fim, id);
    }
    const agendamento = await this.prisma.agendamento.update({ where: { id }, data: { status }, include: incluir });
    return formatar(agendamento);
  }

  async horariosLivres({ profissionalId, servicoId, inicioDia, ignorarId }: HorariosLivresDto) {
    const servico = await this.prisma.servico.findUnique({ where: { id: servicoId } });
    if (!servico) throw new NotFoundException('Serviço não encontrado');

    const base = new Date(inicioDia);
    const diaSemana = new Intl.DateTimeFormat('en-US', {
      timeZone: process.env.APP_TIMEZONE ?? 'America/Sao_Paulo',
      weekday: 'short',
    }).format(new Date(base.getTime() + 12 * 60 * MINUTO));
    if (diaSemana === 'Sun') return [];
    const fimExpediente = diaSemana === 'Sat' ? INICIO_ALMOCO : FIM_EXPEDIENTE;

    const ocupados = await this.prisma.agendamento.findMany({
      where: {
        profissionalId,
        status: { not: StatusAgendamento.CANCELADO },
        inicio: { lt: new Date(base.getTime() + 24 * 60 * MINUTO) },
        fim: { gt: base },
        ...(ignorarId ? { id: { not: ignorarId } } : {}),
      },
      select: { inicio: true, fim: true },
    });

    const agora = Date.now();
    const horarios: string[] = [];
    for (let minuto = INICIO_EXPEDIENTE; minuto + servico.duracaoMinutos <= fimExpediente; minuto += INTERVALO_GRADE) {
      const fimMinuto = minuto + servico.duracaoMinutos;
      if (minuto < FIM_ALMOCO && fimMinuto > INICIO_ALMOCO) continue;
      const inicio = base.getTime() + minuto * MINUTO;
      const fim = inicio + servico.duracaoMinutos * MINUTO;
      if (inicio < agora) continue;
      const conflita = ocupados.some((o) => o.inicio.getTime() < fim && o.fim.getTime() > inicio);
      if (!conflita) horarios.push(new Date(inicio).toISOString());
    }
    return horarios;
  }

  private async validar(clienteId: string, profissionalId: string, servicoId: string) {
    const [cliente, profissional] = await Promise.all([
      this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true } }),
      this.prisma.profissional.findUnique({ where: { id: profissionalId }, include: { servicos: true } }),
    ]);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    if (!profissional) throw new NotFoundException('Profissional não encontrado');
    if (!profissional.ativo) throw new BadRequestException('Este profissional está inativo');

    const servico = profissional.servicos.find((s) => s.id === servicoId);
    if (!servico) throw new BadRequestException('Este profissional não realiza o serviço selecionado');
    if (!servico.ativo) throw new BadRequestException('Este serviço está inativo');
    return servico;
  }

  private async verificarConflito(profissionalId: string, inicio: Date, fim: Date, ignorarId?: string) {
    const conflito = await this.prisma.agendamento.findFirst({
      where: {
        profissionalId,
        status: { not: StatusAgendamento.CANCELADO },
        inicio: { lt: fim },
        fim: { gt: inicio },
        ...(ignorarId ? { id: { not: ignorarId } } : {}),
      },
      include: { cliente: { select: { nome: true } } },
    });
    if (conflito) {
      const horario = conflito.inicio.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: process.env.APP_TIMEZONE ?? 'America/Sao_Paulo',
      });
      throw new ConflictException(`O profissional já tem um atendimento às ${horario} com ${conflito.cliente.nome}`);
    }
  }
}
