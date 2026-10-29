import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsEmail, IsOptional, IsString, Matches, MinLength, ValidateIf } from 'class-validator';

export class CriarClienteDto {
  @IsString()
  @MinLength(3, { message: 'Informe o nome completo' })
  nome: string;

  @IsString()
  @Matches(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, { message: 'Informe um telefone válido' })
  telefone: string;

  @ValidateIf((o) => !!o.email)
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email?: string | null;

  @ValidateIf((o) => !!o.dataNascimento)
  @IsDateString({}, { message: 'Data de nascimento inválida' })
  dataNascimento?: string | null;

  @IsOptional()
  @IsString()
  observacoes?: string | null;
}

export class AtualizarClienteDto extends PartialType(CriarClienteDto) {}
