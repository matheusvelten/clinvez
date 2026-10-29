import { Injectable, NotFoundException } from '@nestjs/common';
import { paraNumero } from '../common/decimal';
import { PrismaService } from '../prisma/prisma.service';
import { AtualizarServicoDto, CriarServicoDto } from './dto/servico.dto';

@Injectable()
export class ServicosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(apenasAtivos: boolean) {
    const servicos = await this.prisma.servico.findMany({
      where: apenasAtivos ? { ativo: true } : {},
      include: { _count: { select: { profissionais: true, agendamentos: true } } },
      orderBy: { nome: 'asc' },
    });
    return servicos.map(({ _count, ...s }) => ({
      ...s,
      preco: paraNumero(s.preco),
      totalProfissionais: _count.profissionais,
      totalAgendamentos: _count.agendamentos,
    }));
  }

  async criar(dto: CriarServicoDto) {
    const servico = await this.prisma.servico.create({ data: dto });
    return { ...servico, preco: paraNumero(servico.preco) };
  }

  async atualizar(id: string, dto: AtualizarServicoDto) {
    const existe = await this.prisma.servico.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw new NotFoundException('Serviço não encontrado');
    const servico = await this.prisma.servico.update({ where: { id }, data: dto });
    return { ...servico, preco: paraNumero(servico.preco) };
  }
}
