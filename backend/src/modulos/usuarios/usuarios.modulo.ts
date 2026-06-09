import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosControlador } from './usuarios.controlador';
import { UsuariosServicio } from './usuarios.servicio';
import { Usuario } from './entidades/usuario.entidad';
import { AlmacenamientoModule } from '../almacenamiento/almacenamiento.modulo';
import { OdontogramaModulo } from '../odontograma/odontograma.modulo';
import { CatalogoModule } from '../catalogo/catalogo.modulo';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    AlmacenamientoModule,
    OdontogramaModulo,
    CatalogoModule,
  ],
  controllers: [UsuariosControlador],
  providers: [UsuariosServicio],
  exports: [UsuariosServicio],
})
export class UsuariosModule {}
