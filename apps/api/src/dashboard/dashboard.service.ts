import { Injectable } from '@nestjs/common';
import { paraNumero } from '../common/decimal';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(inicio: Date, fim: Date) {
    const timeZone = process.env.APP_TIMEZONE ?? 'America/Sao_Paulo';
    const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });

    const [agendamentos, proximos, totalClientes] = await Promise.all([
      this.prisma.agendamento.findMany({
        where: { inicio: { gte: inicio, lt: fim } },
        select: {
          inicio: true,
          status: true,
          valor: true,
          servico: { select: { id: true, nome: true } },
          profissional: { select: { id: true, nome: true, cor: true } },
        },
      }),
      this.prisma.agendamento.findMany({
        where: { inicio: { gte: new Date() }, status: { in: ['AGENDADO', 'CONFIRMADO'] } },
        orderBy: { inicio: 'asc' },
        take: 6,
        include: {
          cliente: { select: { nome: true, telefone: true } },
          profissional: { select: { nome: true, cor: true } },
          servico: { select: { nome: true } },
        },
      }),
      this.prisma.cliente.count(),
    ]);

    const contagem = { AGENDADO: 0, CONFIRMADO: 0, CONCLUIDO: 0, CANCELADO: 0, FALTOU: 0 };
    const porDia = new Map<string, { atendimentos: number; faturamento: number }>();
    const porServico = new Map<string, { nome: string; quantidade: number; faturamento: number }>();
    const porProfissional = new Map<string, { nome: string; cor: string; quantidade: number; faturamento: number }>();
    let faturamento = 0;

    for (const a of agendamentos) {
      contagem[a.status]++;
      if (a.status === 'CANCELADO') continue;

      const valor = a.status === 'CONCLUIDO' ? paraNumero(a.valor) : 0;
      faturamento += valor;

      const dia = formatoDia.format(a.inicio);
      const d = porDia.get(dia) ?? { atendimentos: 0, faturamento: 0 };
      d.atendimentos++;
      d.faturamento += valor;
      porDia.set(dia, d);

      const s = porServico.get(a.servico.id) ?? { nome: a.servico.nome, quantidade: 0, faturamento: 0 };
      s.quantidade++;
      s.faturamento += valor;
      porServico.set(a.servico.id, s);

      const p = porProfissional.get(a.profissional.id) ?? { nome: a.profissional.nome, cor: a.profissional.cor, quantidade: 0, faturamento: 0 };
      p.quantidade++;
      p.faturamento += valor;
      porProfissional.set(a.profissional.id, p);
    }

    const realizados = contagem.CONCLUIDO + contagem.FALTOU;

    return {
      totais: {
        agendamentos: agendamentos.length - contagem.CANCELADO,
        ...contagem,
        faturamento,
        ticketMedio: contagem.CONCLUIDO ? faturamento / contagem.CONCLUIDO : 0,
        taxaComparecimento: realizados ? contagem.CONCLUIDO / realizados : 0,
        clientes: totalClientes,
      },
      porDia: [...porDia.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([data, v]) => ({ data, ...v })),
      porServico: [...porServico.values()].sort((a, b) => b.quantidade - a.quantidade),
      porProfissional: [...porProfissional.values()].sort((a, b) => b.quantidade - a.quantidade),
      proximos: proximos.map((a) => ({ ...a, valor: paraNumero(a.valor) })),
    };
  }
}
