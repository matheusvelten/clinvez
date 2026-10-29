import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AgendamentosModule } from './agendamentos/agendamentos.module';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { PerfisGuard } from './auth/perfis.guard';
import { ClientesModule } from './clientes/clientes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfissionaisModule } from './profissionais/profissionais.module';
import { ServicosModule } from './servicos/servicos.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ClientesModule,
    ProfissionaisModule,
    ServicosModule,
    AgendamentosModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PerfisGuard },
  ],
})
export class AppModule {}
