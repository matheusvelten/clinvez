import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { AgendamentosService } from './agendamentos.service';
import {
  AlterarStatusDto,
  AtualizarAgendamentoDto,
  CriarAgendamentoDto,
  FiltroAgendamentosDto,
  HorariosLivresDto,
} from './dto/agendamento.dto';

@Controller('agendamentos')
export class AgendamentosController {
  constructor(private readonly agendamentos: AgendamentosService) {}

  @Get()
  listar(@Query() filtro: FiltroAgendamentosDto) {
    return this.agendamentos.listar(filtro);
  }

  @Get('horarios-livres')
  horariosLivres(@Query() filtro: HorariosLivresDto) {
    return this.agendamentos.horariosLivres(filtro);
  }

  @Get(':id')
  buscar(@Param('id', ParseUUIDPipe) id: string) {
    return this.agendamentos.buscar(id);
  }

  @Post()
  criar(@Body() dto: CriarAgendamentoDto) {
    return this.agendamentos.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarAgendamentoDto) {
    return this.agendamentos.atualizar(id, dto);
  }

  @Patch(':id/status')
  alterarStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AlterarStatusDto) {
    return this.agendamentos.alterarStatus(id, dto);
  }
}
