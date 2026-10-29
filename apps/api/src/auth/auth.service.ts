import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login({ email, senha }: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
    if (!usuario || !usuario.ativo || !(await bcrypt.compare(senha, usuario.senhaHash))) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const dados = { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };
    const token = await this.jwt.signAsync({ sub: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil });
    return { token, usuario: dados };
  }
}
