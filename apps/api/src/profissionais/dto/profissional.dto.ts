import { PartialType } from '@nestjs/mapped-types';
import { ArrayUnique, IsArray, IsBoolean, IsHexColor, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CriarProfissionalDto {
  @IsString()
  @MinLength(3, { message: 'Informe o nome completo' })
  nome: string;

  @IsString()
  @MinLength(2, { message: 'Informe a especialidade' })
  especialidade: string;

  @IsOptional()
  @IsHexColor({ message: 'Cor inválida' })
  cor?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  servicoIds: string[];
}

export class AtualizarProfissionalDto extends PartialType(CriarProfissionalDto) {}
