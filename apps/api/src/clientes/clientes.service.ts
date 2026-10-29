import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { paraNumero } from '../common/decimal';
import { paginar, PaginacaoDto } from '../common/paginacao.dto';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AtualizarClienteDto, CriarClienteDto } from './dto/cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar({ pagina, porPagina, busca }: PaginacaoDto) {
    const termo = busca?.trim();
    const where: Prisma.ClienteWhereInput = termo
      ? {
          OR: [
            { nome: { contains: termo, mode: 'insensitive' } },
            { telefone: { contains: termo } },
            { email: { contains: termo, mode: 'insensitive' } },
          ],
        }
      : {};

    const [itens, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: { _count: { select: { agendamentos: true } } },
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return paginar(
      itens.map(({ _count, ...cliente }) => ({ ...cliente, totalAgendamentos: _count.agendamentos })),
      total,
      pagina,
      porPagina,
    );
  }

  async buscar(id: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    const agora = new Date();
    const incluir = { servico: { select: { nome: true } }, profissional: { select: { nome: true, cor: true } } };

    const [proximos, historico, concluidos, faltas, ultima] = await Promise.all([
      this.prisma.agendamento.findMany({
        where: { clienteId: id, inicio: { gte: agora }, status: { in: ['AGENDADO', 'CONFIRMADO'] } },
        orderBy: { inicio: 'asc' },
        take: 10,
        include: incluir,
      }),
      this.prisma.agendamento.findMany({
        where: { clienteId: id, inicio: { lt: agora } },
        orderBy: { inicio: 'desc' },
        take: 30,
        include: incluir,
      }),
      this.prisma.agendamento.aggregate({
        where: { clienteId: id, status: 'CONCLUIDO' },
        _count: true,
        _sum: { valor: true },
      }),
      this.prisma.agendamento.count({ where: { clienteId: id, status: 'FALTOU' } }),
      this.prisma.agendamento.findFirst({
        where: { clienteId: id, status: 'CONCLUIDO' },
        orderBy: { inicio: 'desc' },
        select: { inicio: true },
      }),
    ]);

    const formatar = <T extends { valor: { toString(): string } }>(a: T) => ({ ...a, valor: paraNumero(a.valor) });

    return {
      ...cliente,
      resumo: {
        concluidos: concluidos._count,
        faltas,
        totalGasto: paraNumero(concluidos._sum.valor),
        ultimaVisita: ultima?.inicio ?? null,
      },
      proximos: proximos.map(formatar),
      historico: historico.map(formatar),
    };
  }

  criar(dto: CriarClienteDto) {
    return this.prisma.cliente.create({ data: this.normalizar(dto) as Prisma.ClienteCreateInput });
  }

  async atualizar(id: string, dto: AtualizarClienteDto) {
    await this.existe(id);
    return this.prisma.cliente.update({ where: { id }, data: this.normalizar(dto) });
  }

  async remover(id: string) {
    await this.existe(id);
    const agendamentos = await this.prisma.agendamento.count({ where: { clienteId: id } });
    if (agendamentos > 0) {
      throw new ConflictException('Este cliente possui agendamentos e não pode ser excluído');
    }
    await this.prisma.cliente.delete({ where: { id } });
  }

  private normalizar(dto: AtualizarClienteDto) {
    return {
      ...dto,
      email: dto.email === undefined ? undefined : dto.email || null,
      observacoes: dto.observacoes === undefined ? undefined : dto.observacoes || null,
      dataNascimento:
        dto.dataNascimento === undefined ? undefined : dto.dataNascimento ? new Date(dto.dataNascimento) : null,
    };
  }

  private async existe(id: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id }, select: { id: true } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
  }
}
