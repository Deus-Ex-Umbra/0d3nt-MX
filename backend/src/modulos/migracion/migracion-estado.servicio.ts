import { Injectable } from '@nestjs/common';
import { FormatoMigracion } from './dto/iniciar-migracion.dto';

export type EstadoMigracion = {
  en_progreso: boolean;
  progreso: number;
  etapa: string;
  mensaje?: string;
  error?: string;
  formato_solicitado?: FormatoMigracion;
  formato_usado?: FormatoMigracion;
  archivo_salida?: string;
  advertencias?: string[];
  iniciado_en?: string;
  finalizado_en?: string;
};

@Injectable()
export class MigracionEstadoServicio {
  private estado: EstadoMigracion = {
    en_progreso: false,
    progreso: 0,
    etapa: 'idle',
  };

  obtenerEstado(): EstadoMigracion {
    return { ...this.estado, advertencias: [...(this.estado.advertencias || [])] };
  }

  estaEnProgreso(): boolean {
    return !!this.estado.en_progreso;
  }

  iniciar(formatoSolicitado: FormatoMigracion): void {
    this.estado = {
      en_progreso: true,
      progreso: 0,
      etapa: 'iniciando',
      formato_solicitado: formatoSolicitado,
      advertencias: [],
      iniciado_en: new Date().toISOString(),
    };
  }

  advertir(msg: string): void {
    const advertencias = this.estado.advertencias || [];
    advertencias.push(msg);
    this.estado = { ...this.estado, advertencias };
  }

  actualizar(patch: Partial<EstadoMigracion>): void {
    const progreso =
      typeof patch.progreso === 'number'
        ? Math.max(0, Math.min(100, patch.progreso))
        : this.estado.progreso;
    this.estado = { ...this.estado, ...patch, progreso };
  }

  finalizarOk(archivoSalida: string, formatoUsado: FormatoMigracion): void {
    this.estado = {
      ...this.estado,
      en_progreso: false,
      progreso: 100,
      etapa: 'completado',
      archivo_salida: archivoSalida,
      formato_usado: formatoUsado,
      finalizado_en: new Date().toISOString(),
    };
  }

  finalizarError(error: any): void {
    const msg =
      typeof error?.message === 'string'
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Error desconocido';

    this.estado = {
      ...this.estado,
      en_progreso: false,
      etapa: 'error',
      error: msg,
      finalizado_en: new Date().toISOString(),
    };
  }
}
