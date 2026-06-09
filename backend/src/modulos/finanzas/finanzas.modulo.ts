import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Egreso } from './entidades/egreso.entidad';
import { Pago } from './entidades/pago.entidad';
import { Cita } from '../agenda/entidades/cita.entidad';
import { ConfiguracionClinica } from '../catalogo/entidades/configuracion-clinica.entidad';
import { PlanTratamiento } from '../tratamientos/entidades/plan-tratamiento.entidad';
import { FinanzasControlador } from './finanzas.controlador';
import { FinanzasServicio } from './finanzas.servicio';
import { DivisasServicio } from './divisas.servicio';
import { TratamientosModule } from '../tratamientos/tratamientos.modulo';
import { AgendaModule } from '../agenda/agenda.modulo';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Egreso,
      Pago,
      Cita,
      ConfiguracionClinica,
      PlanTratamiento,
    ]),
    forwardRef(() => TratamientosModule),
    forwardRef(() => AgendaModule),
  ],
  controllers: [FinanzasControlador],
  providers: [FinanzasServicio, DivisasServicio],
  exports: [FinanzasServicio, DivisasServicio],
})
export class FinanzasModule {}
