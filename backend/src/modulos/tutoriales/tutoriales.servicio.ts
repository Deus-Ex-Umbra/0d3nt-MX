import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { TutorialCompletado } from './entidades/tutorial-completado.entidad';
import {
  ProgresoTutorialesPaginaDto,
  TutorialInfoDto,
} from './dto/progreso-pagina.dto';
import { Paciente } from '../pacientes/entidades/paciente.entidad';
import { ArchivoAdjunto } from '../archivos-adjuntos/entidades/archivo-adjunto.entidad';

@Injectable()
export class TutorialesServicio {
  private readonly logger = new Logger(TutorialesServicio.name);

  constructor(
    @InjectRepository(TutorialCompletado)
    private readonly tutorial_repositorio: Repository<TutorialCompletado>,
    @InjectRepository(Paciente)
    private readonly paciente_repositorio: Repository<Paciente>,
    @InjectRepository(ArchivoAdjunto)
    private readonly archivo_repositorio: Repository<ArchivoAdjunto>,
  ) {}

  async obtenerPrerequisitosEdicionImagenes(
    usuario_id: number,
  ): Promise<{ tiene_pacientes: boolean; tiene_imagenes: boolean }> {
    const total_pacientes = await this.paciente_repositorio.count({
      where: {
        usuario: { id: usuario_id } as any,
      },
    });

    const total_imagenes = await this.archivo_repositorio.count({
      where: {
        usuario: { id: usuario_id } as any,
        tipo_mime: Like('image/%'),
      },
    });

    return {
      tiene_pacientes: total_pacientes > 0,
      tiene_imagenes: total_imagenes > 0,
    };
  }

  async obtenerTutorialesCompletados(
    usuario_id: number,
  ): Promise<TutorialCompletado[]> {
    return this.tutorial_repositorio.find({
      where: { usuario_id },
      order: { fecha_completado: 'DESC' },
    });
  }

  async estaTutorialCompletado(
    usuario_id: number,
    nombre_tutorial: string,
  ): Promise<boolean> {
    const tutorial = await this.tutorial_repositorio.findOne({
      where: { usuario_id, nombre_tutorial },
    });
    const completado = !!tutorial;

    if (!completado && nombre_tutorial === 'primer-tutorial') {
      this.logger.log(
        `🎓 Primer Inicio de Sesión - Usuario ID: ${usuario_id} - Tutorial "${nombre_tutorial}" debe activarse`,
      );
    } else if (completado) {
      this.logger.debug(
        `Tutorial "${nombre_tutorial}" ya completado para usuario ID: ${usuario_id}`,
      );
    }

    return completado;
  }

  async marcarTutorialCompletado(
    usuario_id: number,
    nombre_tutorial: string,
  ): Promise<TutorialCompletado> {
    const existente = await this.tutorial_repositorio.findOne({
      where: { usuario_id, nombre_tutorial },
    });

    if (existente) {
      return existente;
    }

    const nuevo_tutorial = this.tutorial_repositorio.create({
      usuario_id,
      nombre_tutorial,
    });

    return this.tutorial_repositorio.save(nuevo_tutorial);
  }

  async obtenerProgresoPorPagina(
    usuario_id: number,
    pagina: string,
    tutoriales_definidos: { nombre: string; titulo: string }[],
    condiciones_bloqueo: Record<
      string,
      { bloqueado: boolean; mensaje?: string }
    >,
  ): Promise<ProgresoTutorialesPaginaDto> {
    if (!tutoriales_definidos || !Array.isArray(tutoriales_definidos)) {
      this.logger.warn(
        `obtenerProgresoPorPagina: tutoriales_definidos es inválido para página ${pagina}`,
      );
      return {
        pagina,
        total_tutoriales: 0,
        tutoriales_completados: 0,
        porcentaje_completado: 0,
        tutoriales: [],
      };
    }

    const nombres_tutoriales = tutoriales_definidos.map((t) => t.nombre);

    const completados = await this.tutorial_repositorio.find({
      where: {
        usuario_id,
        nombre_tutorial: In(nombres_tutoriales),
      },
    });

    const nombres_completados = new Set(
      completados.map((c) => c.nombre_tutorial),
    );

    const tutoriales: TutorialInfoDto[] = tutoriales_definidos.map((t) => {
      const condicion = condiciones_bloqueo?.[t.nombre];
      return {
        nombre: t.nombre,
        titulo: t.titulo,
        completado: nombres_completados.has(t.nombre),
        bloqueado: condicion?.bloqueado ?? false,
        condicion_bloqueo: condicion?.mensaje,
      };
    });

    const total = tutoriales.length;
    const completados_count = tutoriales.filter((t) => t.completado).length;

    return {
      pagina,
      total_tutoriales: total,
      tutoriales_completados: completados_count,
      porcentaje_completado:
        total > 0 ? Math.round((completados_count / total) * 100) : 0,
      tutoriales,
    };
  }
}
