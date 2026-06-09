export type CategoriaSimboloOdontograma =
    | 'TRATAMIENTO_PATOLOGIA'
    | 'CONDICION_HALLAZGO';

export interface SimboloOdontograma {
    id: number;
    nombre: string;
    descripcion?: string;
    imagen_base64: string;
    color_primario?: string;
    color_hover: string;
    color_secundario?: string | null;
    categoria?: CategoriaSimboloOdontograma;
    activo: boolean;
    fecha_creacion?: string;
    datos_canvas?: any;
}

export interface PiezaAfectada {
    numero_pieza: number;
    partes: string[];
}

export interface TransformacionSimbolo {
    x: number;
    y: number;
    escala: number;
    espejo_x: boolean;
    espejo_y: boolean;
    rotacion: number;
}

export interface OdontogramaAplicacion {
    id: number;
    simbolo: SimboloOdontograma;
    comentario?: string;
    piezas_afectadas: PiezaAfectada[];
    transformacion?: TransformacionSimbolo;
    fecha_creacion?: string;
}

export interface Odontograma {
    id: number;
    nombre?: string;
    paciente_id: number;
    aplicaciones: OdontogramaAplicacion[];
    fecha_creacion: string;
    fecha_actualizacion: string;
    tipo?: 'adulto' | 'nino';
    version?: number;
    es_ultima_version?: boolean;
    datos_pintado?: any;
    configuracion_dientes?: any;
}

export interface CrearSimboloOdontogramaDto {
    nombre: string;
    descripcion?: string;
    imagen_base64: string;
    color_primario?: string;
    color_secundario?: string | null;
    categoria?: CategoriaSimboloOdontograma;
    datos_canvas?: any;
}

export interface AplicarSimboloDto {
    simbolo_id: number;
    comentario?: string;
    piezas_afectadas: PiezaAfectada[];
    transformacion?: TransformacionSimbolo;
}
