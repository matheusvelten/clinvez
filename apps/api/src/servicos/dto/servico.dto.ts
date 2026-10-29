import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CriarServicoDto {
  @IsString()
  @MinLength(3, { message: 'Informe o nome do serviço' })
  nome: string;

  @IsInt()
  @Min(5, { message: 'A duração mínima é de 5 minutos' })
  @Max(480, { message: 'A duração máxima é de 8 horas' })
  duracaoMinutos: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'O preço não pode ser negativo' })
  preco: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class AtualizarServicoDto extends PartialType(CriarServicoDto) {}
