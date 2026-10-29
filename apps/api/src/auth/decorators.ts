import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Perfil } from '../generated/prisma/client';

export const ROTA_PUBLICA = 'rotaPublica';
export const PERFIS = 'perfis';

export interface UsuarioAutenticado {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
}

export const Publica = () => SetMetadata(ROTA_PUBLICA, true);

export const Perfis = (...perfis: Perfil[]) => SetMetadata(PERFIS, perfis);

export const UsuarioAtual = createParamDecorator((_: unknown, contexto: ExecutionContext): UsuarioAutenticado => {
  return contexto.switchToHttp().getRequest().usuario;
});
