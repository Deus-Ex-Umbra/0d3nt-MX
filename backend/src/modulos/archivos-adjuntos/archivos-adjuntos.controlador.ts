import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArchivosAdjuntosServicio } from './archivos-adjuntos.servicio';
import { SubirArchivoDto } from './dto/subir-archivo.dto';
import { ActualizarArchivoDto } from './dto/actualizar-archivo.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../autenticacion/guardias/jwt-auth.guardia';
import { ConfigService } from '@nestjs/config';
import {
  AlmacenamientoServicio,
  TipoDocumento,
} from '../almacenamiento/almacenamiento.servicio';

@ApiTags('Archivos Adjuntos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('archivos-adjuntos')
export class ArchivosAdjuntosControlador {
  constructor(
    private readonly archivos_servicio: ArchivosAdjuntosServicio,
    private readonly config_servicio: ConfigService,
    private readonly almacenamiento_servicio: AlmacenamientoServicio,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiOperation({ summary: 'Subir un nuevo archivo adjunto' })
  async subir(
    @Request() req,
    @Body() dto: SubirArchivoDto,
    @UploadedFile() archivo?: any,
  ) {
    const buffer = archivo ? archivo.buffer : undefined;
    const archivo_res = await this.archivos_servicio.subir(
      req.user.id,
      dto,
      buffer,
    );
    const url = await this.almacenamiento_servicio.obtenerUrlAcceso(
      archivo_res.ruta_archivo,
      TipoDocumento.ARCHIVO_ADJUNTO,
    );
    return {
      ...archivo_res,
      url,
    };
  }

  @Get('paciente/:id')
  @ApiOperation({ summary: 'Obtener archivos por ID de paciente' })
  async obtenerPorPaciente(@Request() req, @Param('id') id: string) {
    const archivos = await this.archivos_servicio.obtenerPorPaciente(
      req.user.id,
      +id,
    );

    return Promise.all(
      archivos.map(async (archivo) => ({
        ...archivo,
        url: await this.almacenamiento_servicio.obtenerUrlAcceso(
          archivo.ruta_archivo,
          TipoDocumento.ARCHIVO_ADJUNTO,
        ),
      })),
    );
  }

  @Get('plan-tratamiento/:id')
  @ApiOperation({ summary: 'Obtener archivos por ID de plan de tratamiento' })
  async obtenerPorPlan(@Request() req, @Param('id') id: string) {
    const archivos = await this.archivos_servicio.obtenerPorPlan(
      req.user.id,
      +id,
    );

    return Promise.all(
      archivos.map(async (archivo) => ({
        ...archivo,
        url: await this.almacenamiento_servicio.obtenerUrlAcceso(
          archivo.ruta_archivo,
          TipoDocumento.ARCHIVO_ADJUNTO,
        ),
      })),
    );
  }

  @Get(':id/contenido')
  @ApiOperation({ summary: 'Obtener contenido de un archivo en Base64' })
  obtenerContenido(@Request() req, @Param('id') id: string) {
    return this.archivos_servicio.obtenerContenido(req.user.id, +id);
  }

  @Get(':id/url-visualizacion')
  @ApiOperation({
    summary: 'Obtener URL para visualización inline (sin CloudFront/CDN)',
  })
  async obtenerUrlVisualizacion(@Request() req, @Param('id') id: string) {
    const url = await this.archivos_servicio.obtenerUrlVisualizacion(
      req.user.id,
      +id,
    );
    return { url };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar metadatos de un archivo' })
  async actualizar(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ActualizarArchivoDto,
  ) {
    const archivo = await this.archivos_servicio.actualizar(
      req.user.id,
      +id,
      dto,
    );
    const url = await this.almacenamiento_servicio.obtenerUrlAcceso(
      archivo.ruta_archivo,
      TipoDocumento.ARCHIVO_ADJUNTO,
    );
    return {
      ...archivo,
      url,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un archivo adjunto' })
  eliminar(@Request() req, @Param('id') id: string) {
    return this.archivos_servicio.eliminar(req.user.id, +id);
  }
}
