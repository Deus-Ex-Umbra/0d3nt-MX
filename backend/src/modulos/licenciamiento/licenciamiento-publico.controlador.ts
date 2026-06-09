import { Body, Controller, Get, Post, Put, Query, Request, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LicenciamientoServicio } from './licenciamiento.servicio';
import { AceptarEulaInstalacionDto } from './dto/aceptar-eula-instalacion.dto';
import { GuardarCredencialInstalacionDto } from './dto/guardar-credencial-instalacion.dto';
import { ActivarLicenciaClienteDto } from './dto/activar-licencia.dto';
import { CrearSugerenciaClienteDto } from './dto/crear-sugerencia-cliente.dto';
import { SolicitarLicenciaInstalacionDto } from './dto/solicitar-licencia.dto';

@ApiTags('Licenciamiento (Público)')
@Controller('licenciamiento-publico')
export class LicenciamientoPublicoControlador {
  constructor(private readonly licenciamiento_servicio: LicenciamientoServicio) {}

  @Get('estado')
  @ApiOperation({ summary: 'Estado de licenciamiento por instalación (HWID). Sin JWT.' })
  obtenerEstado(
    @Query('hwid_cliente') hwid_cliente: string,
    @Query('verificar') verificar?: string,
  ) {
    const verificarBool = String(verificar || '').toLowerCase();
    const forzar = verificarBool === '1' || verificarBool === 'true' || verificarBool === 'si';
    return this.licenciamiento_servicio.obtenerEstadoInstalacion(hwid_cliente, { forzar_validacion: forzar });
  }

  @Post('eula/aceptar')
  @ApiOperation({ summary: 'Registrar aceptación del EULA por instalación (HWID). Sin JWT.' })
  @ApiResponse({ status: 201, description: 'EULA aceptado' })
  aceptarEula(@Request() req: any, @Body() dto: AceptarEulaInstalacionDto) {
    return this.licenciamiento_servicio.aceptarEulaInstalacion(dto, req);
  }

  @Put('credencial')
  @ApiOperation({ summary: 'Guardar/actualizar llave de VL por instalación. Sin JWT.' })
  guardarCredencial(@Body() dto: GuardarCredencialInstalacionDto) {
    return this.licenciamiento_servicio.guardarCredencialInstalacion(dto);
  }

  @Post('vl/activar')
  @ApiOperation({ summary: 'Proxy: activar licencia con VL0d3ntApp por instalación (requiere EULA + llave). Sin JWT.' })
  activarLicencia(@Body() dto: ActivarLicenciaClienteDto) {
    return this.licenciamiento_servicio.activarLicenciaEnVlInstalacion(dto);
  }


  @Post('vl/sugerencias')
  @ApiOperation({ summary: 'Proxy: enviar sugerencia/comentario a VL0d3ntApp por instalación (requiere EULA + llave). Sin JWT.' })
  enviarSugerencia(@Body() dto: CrearSugerenciaClienteDto) {
    return this.licenciamiento_servicio.crearSugerenciaEnVlInstalacion(dto);
  }

  @Post('vl/licencias/solicitar')
  @ApiOperation({ summary: 'Proxy: solicitar licencia (crea solicitud PENDIENTE) en VL0d3ntApp por instalación (requiere EULA + llave). Sin JWT.' })
  solicitarLicencia(@Body() dto: SolicitarLicenciaInstalacionDto) {
    return this.licenciamiento_servicio.solicitarLicenciaEnVlInstalacion(dto);
  }

  @Get('vl/licencias/solicitud/:id')
  @ApiOperation({ summary: 'Proxy: obtener estado de una solicitud de licencia por instalación (requiere EULA + llave). Sin JWT.' })
  obtenerEstadoSolicitud(
    @Param('id') id: string,
    @Query('hwid_cliente') hwid_cliente: string,
  ) {
    return this.licenciamiento_servicio.obtenerEstadoSolicitudLicenciaEnVlInstalacion({
      hwid_cliente,
      id_licencia: id,
    });
  }
}
