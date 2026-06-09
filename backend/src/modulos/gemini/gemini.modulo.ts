import { Module } from '@nestjs/common';
import { GeminiServicio } from './gemini.servicio';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionClinica } from '../catalogo/entidades/configuracion-clinica.entidad';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([ConfiguracionClinica])],
  providers: [GeminiServicio],
  exports: [GeminiServicio],
})
export class GeminiModule {}
