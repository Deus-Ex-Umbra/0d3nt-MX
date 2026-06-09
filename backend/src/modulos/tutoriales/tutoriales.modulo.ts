import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TutorialCompletado } from './entidades/tutorial-completado.entidad';
import { TutorialesServicio } from './tutoriales.servicio';
import { TutorialesControlador } from './tutoriales.controlador';
import { Paciente } from '../pacientes/entidades/paciente.entidad';
import { ArchivoAdjunto } from '../archivos-adjuntos/entidades/archivo-adjunto.entidad';

@Module({
  imports: [
    TypeOrmModule.forFeature([TutorialCompletado, Paciente, ArchivoAdjunto]),
  ],
  controllers: [TutorialesControlador],
  providers: [TutorialesServicio],
  exports: [TutorialesServicio],
})
export class TutorialesModulo {}
