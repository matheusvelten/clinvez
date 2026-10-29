import { Controller, Get, Query } from '@nestjs/common';
import { IsDateString } from 'class-validator';
import { DashboardService } from './dashboard.service';

class PeriodoDto {
  @IsDateString()
  inicio: string;

  @IsDateString()
  fim: string;
}

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  resumo(@Query() { inicio, fim }: PeriodoDto) {
    return this.dashboard.resumo(new Date(inicio), new Date(fim));
  }
}
