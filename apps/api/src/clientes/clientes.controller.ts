import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Perfis } from '../auth/decorators';
import { PaginacaoDto } from '../common/paginacao.dto';
import { ClientesService } from './clientes.service';
import { AtualizarClienteDto, CriarClienteDto } from './dto/cliente.dto';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientes: ClientesService) {}

  @Get()
  listar(@Query() query: PaginacaoDto) {
    return this.clientes.listar(query);
  }

  @Get(':id')
  buscar(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientes.buscar(id);
  }

  @Post()
  criar(@Body() dto: CriarClienteDto) {
    return this.clientes.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarClienteDto) {
    return this.clientes.atualizar(id, dto);
  }

  @Perfis('ADMIN')
  @Delete(':id')
  @HttpCode(204)
  remover(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientes.remover(id);
  }
}
