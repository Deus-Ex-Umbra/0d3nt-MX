import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MigracionControlador } from './migracion.controlador';
import { MigracionServicio } from './migracion.servicio';
import { MigracionEstadoServicio } from './migracion-estado.servicio';
import { BloqueoMigracionGuard } from './bloqueo-migracion.guard';

@Module({
  controllers: [MigracionControlador],
  providers: [
    MigracionServicio,
    MigracionEstadoServicio,
    {
      provide: APP_GUARD,
      useClass: BloqueoMigracionGuard,
    },
  ],
  exports: [MigracionEstadoServicio],
})
export class MigracionModulo {}
