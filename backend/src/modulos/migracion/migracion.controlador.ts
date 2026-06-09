import { Body, Controller, Get, Post } from '@nestjs/common';
import { IniciarMigracionDto, FormatoMigracion } from './dto/iniciar-migracion.dto';
import { MigracionEstadoServicio } from './migracion-estado.servicio';
import { MigracionServicio } from './migracion.servicio';

@Controller('migracion')
export class MigracionControlador {
  constructor(
    private readonly migracionServicio: MigracionServicio,
    private readonly estadoServicio: MigracionEstadoServicio,
  ) {}

  @Get('estado')
  estado() {
    return this.estadoServicio.obtenerEstado();
  }

  @Post('iniciar')
  async iniciar(@Body() dto: IniciarMigracionDto) {
    const formato = (dto?.formato || 'zip') as FormatoMigracion;
    await this.migracionServicio.iniciar(formato);
    return { ok: true };
  }
}
