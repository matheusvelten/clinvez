import { Injectable, NotFoundException } from '@nestjs/common';
import { paraNumero } from '../common/decimal';
import { PrismaService } from '../prisma/prisma.service';
import { AtualizarProfissionalDto, CriarProfissionalDto } from './dto/profissional.dto';

const incluir = {
  servicos: { select: { id: true, nome: true, duracaoMinutos: true, preco: true, ativo: true }, orderBy: { nome: 'asc' as const } },
};

type ProfissionalComServicos = {
  servicos: { preco: { toString(): string } }[];
};

function formatar<T extends ProfissionalComServicos>(profissional: T) {
  return {
    ...profissional,
    servicos: profissional.servicos.map((s) => ({ ...s, preco: paraNumero(s.preco) })),
  };
}

@Injectable()
export class ProfissionaisService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(apenasAtivos: boolean) {
    const profissionais = await this.prisma.profissional.findMany({
      where: apenasAtivos ? { ativo: true } : {},
      include: incluir,
      orderBy: { nome: 'asc' },
    });
    return profissionais.map(formatar);
  }

  async criar({ servicoIds, ...dto }: CriarProfissionalDto) {
    const profissional = await this.prisma.profissional.create({
      data: { ...dto, servicos: { connect: servicoIds.map((id) => ({ id })) } },
      include: incluir,
    });
    return formatar(profissional);
  }

  async atualizar(id: string, { servicoIds, ...dto }: AtualizarProfissionalDto) {
    const existe = await this.prisma.profissional.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw new NotFoundException('Profissional não encontrado');
    const profissional = await this.prisma.profissional.update({
      where: { id },
      data: { ...dto, ...(servicoIds ? { servicos: { set: servicoIds.map((s) => ({ id: s })) } } : {}) },
      include: incluir,
    });
    return formatar(profissional);
  }
}
