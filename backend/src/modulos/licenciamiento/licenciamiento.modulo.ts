import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenciamientoControlador } from './licenciamiento.controlador';
import { LicenciamientoPublicoControlador } from './licenciamiento-publico.controlador';
import { LicenciamientoServicio } from './licenciamiento.servicio';
import { EulaAceptacion } from './entidades/eula-aceptacion.entidad';
import { VlCredencial } from './entidades/vl-credencial.entidad';
import { EulaAceptacionInstalacion } from './entidades/eula-aceptacion-instalacion.entidad';
import { VlCredencialInstalacion } from './entidades/vl-credencial-instalacion.entidad';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EulaAceptacion,
      VlCredencial,
      EulaAceptacionInstalacion,
      VlCredencialInstalacion,
    ]),
  ],
  controllers: [LicenciamientoControlador, LicenciamientoPublicoControlador],
  providers: [LicenciamientoServicio],
  exports: [LicenciamientoServicio],
})
export class LicenciamientoModule {}

