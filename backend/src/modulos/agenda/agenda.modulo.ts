import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cita } from './entidades/cita.entidad';
import { Usuario } from '../usuarios/entidades/usuario.entidad';
import { AgendaControlador } from './agenda.controlador';
import { AgendaServicio } from './agenda.servicio';
import { FinanzasModule } from '../finanzas/finanzas.modulo';
import { InventarioModule } from '../inventario/inventario.modulo';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cita, Usuario]),
    forwardRef(() => FinanzasModule),
    forwardRef(() => InventarioModule),
  ],
  controllers: [AgendaControlador],
  providers: [AgendaServicio],
  exports: [AgendaServicio],
})
export class AgendaModule {}
