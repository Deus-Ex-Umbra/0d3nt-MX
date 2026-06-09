import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimboloOdontograma } from './entidades/simbolo-odontograma.entidad';
import { CategoriaSimboloOdontograma } from './entidades/simbolo-odontograma.entidad';
import { Odontograma } from './entidades/odontograma.entidad';
import { OdontogramaAplicacion } from './entidades/odontograma-aplicacion.entidad';
import { CrearSimboloOdontogramaDto } from './dto/crear-simbolo-odontograma.dto';
import { ActualizarSimboloOdontogramaDto } from './dto/actualizar-simbolo-odontograma.dto';
import {
  CrearOdontogramaDto,
  AplicarSimboloDto,
  ActualizarAplicacionDto,
} from './dto/odontograma.dto';

import { CrearNuevaVersionDto } from './dto/crear-nueva-version.dto';

@Injectable()
export class OdontogramaServicio {
  constructor(
    @InjectRepository(SimboloOdontograma)
    private readonly simbolo_repositorio: Repository<SimboloOdontograma>,
    @InjectRepository(Odontograma)
    private readonly odontograma_repositorio: Repository<Odontograma>,
    @InjectRepository(OdontogramaAplicacion)
    private readonly aplicacion_repositorio: Repository<OdontogramaAplicacion>,
  ) {}

  private normalizarColoresPorCategoria(params: {
    categoria: CategoriaSimboloOdontograma;
    color_primario?: string | null;
    color_secundario?: string | null;
  }): { color_hover: string; color_secundario: string | null } {
    const categoria = params.categoria;

    const colorPrincipalPorDefecto =
      categoria === CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA
        ? '#0000FF'
        : '#000000';

    const color_hover =
      params.color_primario && params.color_primario.trim()
        ? params.color_primario
        : colorPrincipalPorDefecto;

    if (categoria === CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA) {
      const color_secundario =
        params.color_secundario && params.color_secundario.trim()
          ? params.color_secundario
          : '#FF0000';
      return { color_hover, color_secundario };
    }

    return { color_hover, color_secundario: null };
  }

  async crearSimbolo(
    usuario_id: number,
    dto: CrearSimboloOdontogramaDto,
  ): Promise<SimboloOdontograma> {
    const { color_primario, ...dtoSinColorPrimario } = dto;
    const categoria =
      dto.categoria ?? CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA;
    const { color_hover, color_secundario } =
      this.normalizarColoresPorCategoria({
        categoria,
        color_primario: color_primario ?? null,
        color_secundario: dto.color_secundario ?? null,
      });

    const simbolo = this.simbolo_repositorio.create({
      ...(dtoSinColorPrimario as Omit<
        CrearSimboloOdontogramaDto,
        'color_primario'
      >),
      categoria,
      color_hover,
      color_secundario,
      usuario_id,
    });
    return this.simbolo_repositorio.save(simbolo);
  }

  async obtenerSimbolos(usuario_id: number): Promise<SimboloOdontograma[]> {
    return this.simbolo_repositorio.find({
      where: { usuario_id, activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async obtenerSimboloPorId(
    usuario_id: number,
    id: number,
  ): Promise<SimboloOdontograma> {
    const simbolo = await this.simbolo_repositorio.findOne({
      where: { id, usuario_id },
    });
    if (!simbolo) {
      throw new NotFoundException('Símbolo no encontrado');
    }
    return simbolo;
  }

  async actualizarSimbolo(
    usuario_id: number,
    id: number,
    dto: ActualizarSimboloOdontogramaDto,
  ): Promise<SimboloOdontograma> {
    const simbolo = await this.obtenerSimboloPorId(usuario_id, id);

    const { color_primario, ...dtoSinColorPrimario } =
      dto as ActualizarSimboloOdontogramaDto & { color_primario?: string };

    const categoria =
      dto.categoria ??
      simbolo.categoria ??
      CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA;
    const { color_hover, color_secundario } =
      this.normalizarColoresPorCategoria({
        categoria,
        color_primario: color_primario ?? simbolo.color_hover ?? null,
        color_secundario:
          dto.color_secundario ?? simbolo.color_secundario ?? null,
      });

    Object.assign(simbolo, dtoSinColorPrimario, {
      categoria,
      color_hover,
      color_secundario,
    });
    return this.simbolo_repositorio.save(simbolo);
  }

  async eliminarSimbolo(usuario_id: number, id: number): Promise<void> {
    const simbolo = await this.obtenerSimboloPorId(usuario_id, id);
    await this.simbolo_repositorio.softDelete(simbolo.id);
  }

  async crearOdontograma(
    usuario_id: number,
    paciente_id: number,
    dto: CrearOdontogramaDto,
  ): Promise<Odontograma> {
    const odontograma = this.odontograma_repositorio.create({
      ...dto,
      paciente_id,
      usuario_id,
    });
    return this.odontograma_repositorio.save(odontograma);
  }

  async obtenerOdontogramasPorPaciente(
    usuario_id: number,
    paciente_id: number,
  ): Promise<Odontograma[]> {
    return this.odontograma_repositorio.find({
      where: { paciente_id, usuario_id },
      relations: ['aplicaciones', 'aplicaciones.simbolo'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async obtenerOdontogramaPorId(
    usuario_id: number,
    id: number,
  ): Promise<Odontograma> {
    const odontograma = await this.odontograma_repositorio.findOne({
      where: { id, usuario_id },
      relations: ['aplicaciones', 'aplicaciones.simbolo'],
    });
    if (!odontograma) {
      throw new NotFoundException('Odontograma no encontrado');
    }
    return odontograma;
  }

  async actualizarOdontograma(
    usuario_id: number,
    id: number,
    dto: CrearOdontogramaDto,
  ): Promise<Odontograma> {
    const odontograma = await this.obtenerOdontogramaPorId(usuario_id, id);
    Object.assign(odontograma, dto);
    return this.odontograma_repositorio.save(odontograma);
  }

  async eliminarOdontograma(usuario_id: number, id: number): Promise<void> {
    const odontograma = await this.obtenerOdontogramaPorId(usuario_id, id);
    await this.odontograma_repositorio.softDelete(odontograma.id);
  }

  async aplicarSimbolo(
    usuario_id: number,
    odontograma_id: number,
    dto: AplicarSimboloDto,
  ): Promise<OdontogramaAplicacion> {
    await this.obtenerOdontogramaPorId(usuario_id, odontograma_id);
    await this.obtenerSimboloPorId(usuario_id, dto.simbolo_id);
    const aplicacion = this.aplicacion_repositorio.create({
      odontograma_id,
      simbolo_id: dto.simbolo_id,
      comentario: dto.comentario,
      piezas_afectadas: dto.piezas_afectadas,
      transformacion: dto.transformacion,
    });

    return this.aplicacion_repositorio.save(aplicacion);
  }

  async actualizarAplicacion(
    usuario_id: number,
    aplicacion_id: number,
    dto: ActualizarAplicacionDto,
  ): Promise<OdontogramaAplicacion> {
    const aplicacion = await this.aplicacion_repositorio.findOne({
      where: { id: aplicacion_id },
      relations: ['odontograma'],
    });

    if (!aplicacion) {
      throw new NotFoundException('Aplicación no encontrada');
    }

    if (aplicacion.odontograma.usuario_id !== usuario_id) {
      throw new NotFoundException('Aplicación no encontrada');
    }

    Object.assign(aplicacion, dto);
    return this.aplicacion_repositorio.save(aplicacion);
  }

  async eliminarAplicacion(
    usuario_id: number,
    aplicacion_id: number,
  ): Promise<void> {
    const aplicacion = await this.aplicacion_repositorio.findOne({
      where: { id: aplicacion_id },
      relations: ['odontograma'],
    });

    if (!aplicacion) {
      throw new NotFoundException('Aplicación no encontrada');
    }

    if (aplicacion.odontograma.usuario_id !== usuario_id) {
      throw new NotFoundException('Aplicación no encontrada');
    }

    await this.aplicacion_repositorio.delete(aplicacion_id);
  }

  async obtenerOCrearOdontogramaPrincipal(
    usuario_id: number,
    paciente_id: number,
  ): Promise<Odontograma> {
    const odontogramas = await this.obtenerOdontogramasPorPaciente(
      usuario_id,
      paciente_id,
    );

    if (odontogramas.length > 0) {
      const ultima =
        odontogramas.find((o) => o.es_ultima_version) || odontogramas[0];
      return ultima;
    }
    return this.crearOdontograma(usuario_id, paciente_id, {
      nombre: 'Odontograma Principal',
      tipo: 'adulto',
    });
  }

  async crearNuevaVersion(
    usuario_id: number,
    odontograma_id: number,
    opciones?: CrearNuevaVersionDto,
  ): Promise<Odontograma> {
    const odontogramaActual = await this.odontograma_repositorio.findOne({
      where: { id: odontograma_id, usuario_id },
      relations: ['aplicaciones'],
    });

    if (!odontogramaActual) {
      throw new NotFoundException('Odontograma no encontrado');
    }
    const clonar = opciones?.clonar ?? true;
    const tipo = opciones?.tipo ?? odontogramaActual.tipo;
    await this.odontograma_repositorio.update(
      { paciente_id: odontogramaActual.paciente_id, usuario_id },
      { es_ultima_version: false },
    );
    const nuevaVersion = this.odontograma_repositorio.create({
      paciente_id: odontogramaActual.paciente_id,
      usuario_id,
      nombre: odontogramaActual.nombre,
      tipo: tipo,
      version: (odontogramaActual.version || 1) + 1,
      es_ultima_version: true,
      datos_pintado:
        clonar && odontogramaActual.datos_pintado
          ? JSON.parse(JSON.stringify(odontogramaActual.datos_pintado))
          : null,
      configuracion_dientes:
        clonar && odontogramaActual.configuracion_dientes
          ? JSON.parse(JSON.stringify(odontogramaActual.configuracion_dientes))
          : null,
    });
    const guardado = await this.odontograma_repositorio.save(nuevaVersion);
    if (
      clonar &&
      odontogramaActual.aplicaciones &&
      odontogramaActual.aplicaciones.length > 0
    ) {
      const aplicacionesCopia = odontogramaActual.aplicaciones.map((app) => {
        return this.aplicacion_repositorio.create({
          odontograma_id: guardado.id,
          simbolo_id: app.simbolo_id,
          piezas_afectadas: JSON.parse(JSON.stringify(app.piezas_afectadas)),
          transformacion: app.transformacion
            ? JSON.parse(JSON.stringify(app.transformacion))
            : null,
          comentario: app.comentario,
        });
      });
      await this.aplicacion_repositorio.save(aplicacionesCopia);
    }
    return this.obtenerOdontogramaPorId(usuario_id, guardado.id);
  }
}
