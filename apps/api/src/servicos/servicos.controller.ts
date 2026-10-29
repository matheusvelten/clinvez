import { Body, Controller, Get, Param, ParseBoolPipe, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Perfis } from '../auth/decorators';
import { AtualizarServicoDto, CriarServicoDto } from './dto/servico.dto';
import { ServicosService } from './servicos.service';

@Controller('servicos')
export class ServicosController {
  constructor(private readonly servicos: ServicosService) {}

  @Get()
  listar(@Query('ativos', new ParseBoolPipe({ optional: true })) ativos?: boolean) {
    return this.servicos.listar(ativos ?? false);
  }

  @Perfis('ADMIN')
  @Post()
  criar(@Body() dto: CriarServicoDto) {
    return this.servicos.criar(dto);
  }

  @Perfis('ADMIN')
  @Patch(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarServicoDto) {
    return this.servicos.atualizar(id, dto);
  }
}
