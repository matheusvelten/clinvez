import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Perfil } from '../../generated/prisma/client';

export class CriarUsuarioDto {
  @IsString()
  @MinLength(3, { message: 'Informe o nome completo' })
  nome: string;

  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  senha: string;

  @IsEnum(Perfil)
  perfil: Perfil;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class AtualizarUsuarioDto extends PartialType(CriarUsuarioDto) {}
