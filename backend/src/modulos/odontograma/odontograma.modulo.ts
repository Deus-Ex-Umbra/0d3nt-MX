import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SimboloOdontograma } from './entidades/simbolo-odontograma.entidad';
import { Odontograma } from './entidades/odontograma.entidad';
import { OdontogramaAplicacion } from './entidades/odontograma-aplicacion.entidad';
import { OdontogramaServicio } from './odontograma.servicio';
import { OdontogramaControlador } from './odontograma.controlador';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SimboloOdontograma,
      Odontograma,
      OdontogramaAplicacion,
    ]),
  ],
  controllers: [OdontogramaControlador],
  providers: [OdontogramaServicio],
  exports: [OdontogramaServicio],
})
export class OdontogramaModulo {}
