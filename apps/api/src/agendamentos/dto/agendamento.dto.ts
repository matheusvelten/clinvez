import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { StatusAgendamento } from '../../generated/prisma/client';

export class CriarAgendamentoDto {
  @IsUUID('all', { message: 'Selecione o cliente' })
  clienteId: string;

  @IsUUID('all', { message: 'Selecione o profissional' })
  profissionalId: string;

  @IsUUID('all', { message: 'Selecione o serviço' })
  servicoId: string;

  @IsDateString({}, { message: 'Data e hora inválidas' })
  inicio: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string | null;
}

export class AtualizarAgendamentoDto {
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsUUID()
  profissionalId?: string;

  @IsOptional()
  @IsUUID()
  servicoId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data e hora inválidas' })
  inicio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string | null;
}

export class AlterarStatusDto {
  @IsEnum(StatusAgendamento, { message: 'Status inválido' })
  status: StatusAgendamento;
}

export class FiltroAgendamentosDto {
  @IsDateString()
  inicio: string;

  @IsDateString()
  fim: string;

  @IsOptional()
  @IsUUID()
  profissionalId?: string;
}

export class HorariosLivresDto {
  @IsUUID()
  profissionalId: string;

  @IsUUID()
  servicoId: string;

  @IsDateString()
  inicioDia: string;

  @IsOptional()
  @IsUUID()
  ignorarId?: string;
}
