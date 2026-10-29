import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROTA_PUBLICA, UsuarioAutenticado } from './decorators';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, [contexto.getHandler(), contexto.getClass()]);
    if (publica) return true;

    const requisicao = contexto.switchToHttp().getRequest();
    const [tipo, token] = (requisicao.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) throw new UnauthorizedException('Token não informado');

    try {
      const payload = await this.jwt.verifyAsync<UsuarioAutenticado & { sub: string }>(token);
      requisicao.usuario = { id: payload.sub, nome: payload.nome, email: payload.email, perfil: payload.perfil };
      return true;
    } catch {
      throw new UnauthorizedException('Sessão expirada ou inválida');
    }
  }
}
