import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Perfil } from '../generated/prisma/client';
import { PERFIS, UsuarioAutenticado } from './decorators';

@Injectable()
export class PerfisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const perfis = this.reflector.getAllAndOverride<Perfil[]>(PERFIS, [contexto.getHandler(), contexto.getClass()]);
    if (!perfis?.length) return true;

    const usuario: UsuarioAutenticado | undefined = contexto.switchToHttp().getRequest().usuario;
    if (!usuario || !perfis.includes(usuario.perfil)) {
      throw new ForbiddenException('Você não tem permissão para esta ação');
    }
    return true;
  }
}
