import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Perfis, UsuarioAtual, type UsuarioAutenticado } from '../auth/decorators';
import { AtualizarUsuarioDto, CriarUsuarioDto } from './dto/usuario.dto';
import { UsuariosService } from './usuarios.service';

@Perfis('ADMIN')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  listar() {
    return this.usuarios.listar();
  }

  @Post()
  criar(@Body() dto: CriarUsuarioDto) {
    return this.usuarios.criar(dto);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarUsuarioDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.usuarios.atualizar(id, dto, usuario.id);
  }
}
