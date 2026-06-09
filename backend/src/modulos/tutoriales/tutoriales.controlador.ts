import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../autenticacion/guardias/jwt-auth.guardia';
import { TutorialesServicio } from './tutoriales.servicio';
import { ObtenerProgresoPaginaDto } from './dto/progreso-pagina.dto';

@Controller('tutoriales')
@UseGuards(JwtAuthGuard)
export class TutorialesControlador {
  constructor(private readonly tutoriales_servicio: TutorialesServicio) {}

  @Get()
  async obtenerTutorialesCompletados(@Request() req) {
    return this.tutoriales_servicio.obtenerTutorialesCompletados(req.user.id);
  }

  @Get(':nombre')
  async verificarTutorial(@Request() req, @Param('nombre') nombre: string) {
    const completado = await this.tutoriales_servicio.estaTutorialCompletado(
      req.user.id,
      nombre,
    );
    return { completado };
  }

  @Post(':nombre/completar')
  async marcarTutorialCompletado(
    @Request() req,
    @Param('nombre') nombre: string,
  ) {
    await this.tutoriales_servicio.marcarTutorialCompletado(
      req.user.id,
      nombre,
    );
    return { mensaje: 'Tutorial marcado como completado' };
  }

  @Post('progreso-pagina')
  async obtenerProgresoPagina(
    @Request() req,
    @Body() body: ObtenerProgresoPaginaDto,
  ) {
    return this.tutoriales_servicio.obtenerProgresoPorPagina(
      req.user.id,
      body.pagina,
      body.tutoriales,
      body.condiciones_bloqueo || {},
    );
  }

  @Get('prerequisitos/edicion-imagenes')
  async obtenerPrerequisitosEdicionImagenes(@Request() req) {
    return this.tutoriales_servicio.obtenerPrerequisitosEdicionImagenes(
      req.user.id,
    );
  }
}
