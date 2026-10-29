import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AtualizarUsuarioDto, CriarUsuarioDto } from './dto/usuario.dto';

const campos = { id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true };

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.usuario.findMany({ select: campos, orderBy: { nome: 'asc' } });
  }

  async criar({ senha, ...dto }: CriarUsuarioDto) {
    const email = dto.email.toLowerCase();
    if (await this.prisma.usuario.findUnique({ where: { email } })) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }
    return this.prisma.usuario.create({
      data: { ...dto, email, senhaHash: await bcrypt.hash(senha, 10) },
      select: campos,
    });
  }

  async atualizar(id: string, { senha, ...dto }: AtualizarUsuarioDto, idUsuarioAtual: string) {
    await this.buscar(id);
    if (id === idUsuarioAtual && (dto.ativo === false || (dto.perfil && dto.perfil !== 'ADMIN'))) {
      throw new BadRequestException('Você não pode desativar ou rebaixar o próprio usuário');
    }
    if (dto.email) {
      dto.email = dto.email.toLowerCase();
      const existente = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
      if (existente && existente.id !== id) throw new ConflictException('Já existe um usuário com este e-mail');
    }
    return this.prisma.usuario.update({
      where: { id },
      data: { ...dto, ...(senha ? { senhaHash: await bcrypt.hash(senha, 10) } : {}) },
      select: campos,
    });
  }

  private async buscar(id: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id }, select: campos });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }
}
