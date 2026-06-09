import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../autenticacion/guardias/jwt-auth.guardia';
import { OdontogramaServicio } from './odontograma.servicio';
import { CrearSimboloOdontogramaDto } from './dto/crear-simbolo-odontograma.dto';
import { ActualizarSimboloOdontogramaDto } from './dto/actualizar-simbolo-odontograma.dto';
import {
  CrearOdontogramaDto,
  AplicarSimboloDto,
  ActualizarAplicacionDto,
} from './dto/odontograma.dto';

import { CrearNuevaVersionDto } from './dto/crear-nueva-version.dto';

@Controller('odontograma')
@UseGuards(JwtAuthGuard)
export class OdontogramaControlador {
  constructor(private readonly odontograma_servicio: OdontogramaServicio) {}

  @Get('simbolos')
  async obtenerSimbolos(@Req() req: any) {
    return this.odontograma_servicio.obtenerSimbolos(req.user.id);
  }

  @Get('simbolos/:id')
  async obtenerSimboloPorId(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.odontograma_servicio.obtenerSimboloPorId(req.user.id, id);
  }

  @Post('simbolos')
  async crearSimbolo(@Req() req: any, @Body() dto: CrearSimboloOdontogramaDto) {
    return this.odontograma_servicio.crearSimbolo(req.user.id, dto);
  }

  @Put('simbolos/:id')
  async actualizarSimbolo(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarSimboloOdontogramaDto,
  ) {
    return this.odontograma_servicio.actualizarSimbolo(req.user.id, id, dto);
  }

  @Delete('simbolos/:id')
  async eliminarSimbolo(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.odontograma_servicio.eliminarSimbolo(req.user.id, id);
  }

  @Get('paciente/:paciente_id')
  async obtenerOdontogramasPorPaciente(
    @Req() req: any,
    @Param('paciente_id', ParseIntPipe) paciente_id: number,
  ) {
    return this.odontograma_servicio.obtenerOdontogramasPorPaciente(
      req.user.id,
      paciente_id,
    );
  }

  @Get('paciente/:paciente_id/principal')
  async obtenerOCrearOdontogramaPrincipal(
    @Req() req: any,
    @Param('paciente_id', ParseIntPipe) paciente_id: number,
  ) {
    return this.odontograma_servicio.obtenerOCrearOdontogramaPrincipal(
      req.user.id,
      paciente_id,
    );
  }

  @Get(':id')
  async obtenerOdontogramaPorId(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.odontograma_servicio.obtenerOdontogramaPorId(req.user.id, id);
  }

  @Post('paciente/:paciente_id')
  async crearOdontograma(
    @Req() req: any,
    @Param('paciente_id', ParseIntPipe) paciente_id: number,
    @Body() dto: CrearOdontogramaDto,
  ) {
    return this.odontograma_servicio.crearOdontograma(
      req.user.id,
      paciente_id,
      dto,
    );
  }

  @Post(':id/version')
  async crearNuevaVersion(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearNuevaVersionDto,
  ) {
    return this.odontograma_servicio.crearNuevaVersion(req.user.id, id, dto);
  }

  @Put(':id')
  async actualizarOdontograma(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearOdontogramaDto,
  ) {
    return this.odontograma_servicio.actualizarOdontograma(
      req.user.id,
      id,
      dto,
    );
  }

  @Delete(':id')
  async eliminarOdontograma(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.odontograma_servicio.eliminarOdontograma(req.user.id, id);
  }

  @Post(':id/aplicar')
  async aplicarSimbolo(
    @Req() req: any,
    @Param('id', ParseIntPipe) odontograma_id: number,
    @Body() dto: AplicarSimboloDto,
  ) {
    return this.odontograma_servicio.aplicarSimbolo(
      req.user.id,
      odontograma_id,
      dto,
    );
  }

  @Put('aplicacion/:id')
  async actualizarAplicacion(
    @Req() req: any,
    @Param('id', ParseIntPipe) aplicacion_id: number,
    @Body() dto: ActualizarAplicacionDto,
  ) {
    return this.odontograma_servicio.actualizarAplicacion(
      req.user.id,
      aplicacion_id,
      dto,
    );
  }

  @Delete('aplicacion/:id')
  async eliminarAplicacion(
    @Req() req: any,
    @Param('id', ParseIntPipe) aplicacion_id: number,
  ) {
    return this.odontograma_servicio.eliminarAplicacion(
      req.user.id,
      aplicacion_id,
    );
  }
}
