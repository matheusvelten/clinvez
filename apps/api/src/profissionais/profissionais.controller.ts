import { Body, Controller, Get, Param, ParseBoolPipe, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Perfis } from '../auth/decorators';
import { AtualizarProfissionalDto, CriarProfissionalDto } from './dto/profissional.dto';
import { ProfissionaisService } from './profissionais.service';

@Controller('profissionais')
export class ProfissionaisController {
  constructor(private readonly profissionais: ProfissionaisService) {}

  @Get()
  listar(@Query('ativos', new ParseBoolPipe({ optional: true })) ativos?: boolean) {
    return this.profissionais.listar(ativos ?? false);
  }

  @Perfis('ADMIN')
  @Post()
  criar(@Body() dto: CriarProfissionalDto) {
    return this.profissionais.criar(dto);
  }

  @Perfis('ADMIN')
  @Patch(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarProfissionalDto) {
    return this.profissionais.atualizar(id, dto);
  }
}
