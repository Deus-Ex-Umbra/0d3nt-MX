import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../autenticacion/guardias/jwt-auth.guardia';
import { LicenciamientoServicio } from './licenciamiento.servicio';
import { AceptarEulaDto } from './dto/aceptar-eula.dto';
import { GuardarCredencialDto } from './dto/guardar-credencial.dto';
import { ActivarLicenciaClienteDto } from './dto/activar-licencia.dto';

@ApiTags('Licenciamiento')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('licenciamiento')
export class LicenciamientoControlador {
  constructor(private readonly licenciamiento_servicio: LicenciamientoServicio) {}

  @Get('eula/estado')
  @ApiOperation({ summary: 'Consultar si el usuario ya aceptó el EULA' })
  obtenerEstadoEula(@Request() req) {
    return this.licenciamiento_servicio.obtenerEstadoEula(req.user.id);
  }

  @Post('eula/aceptar')
  @ApiOperation({ summary: 'Registrar aceptación del EULA' })
  @ApiResponse({ status: 201, description: 'EULA aceptado' })
  aceptarEula(@Request() req, @Body() dto: AceptarEulaDto) {
    return this.licenciamiento_servicio.aceptarEula(req.user.id, dto, req);
  }

  @Get('credencial/estado')
  @ApiOperation({ summary: 'Consultar si existe credencial para VL0d3ntApp' })
  obtenerEstadoCredencial(@Request() req) {
    return this.licenciamiento_servicio.obtenerEstadoCredencial(req.user.id);
  }

  @Put('credencial')
  @ApiOperation({ summary: 'Guardar/actualizar credencial para VL0d3ntApp (se almacena cifrada)' })
  guardarCredencial(@Request() req, @Body() dto: GuardarCredencialDto) {
    return this.licenciamiento_servicio.guardarCredencial(req.user.id, dto);
  }

  @Get('vl/llave-publica')
  @ApiOperation({ summary: 'Proxy: obtener llave pública Ed25519 desde VL0d3ntApp' })
  async obtenerLlavePublica(@Request() req) {
    return this.licenciamiento_servicio.obtenerLlavePublicaDesdeVl(req.user.id);
  }

  @Post('vl/activar')
  @ApiOperation({ summary: 'Proxy: activar licencia con VL0d3ntApp (requiere EULA aceptado)' })
  async activarLicencia(@Request() req, @Body() dto: ActivarLicenciaClienteDto) {
    return this.licenciamiento_servicio.activarLicenciaEnVl(req.user.id, dto);
  }
}
