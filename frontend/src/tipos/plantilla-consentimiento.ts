export interface PlantillaConsentimiento {
  id: number;
  nombre: string;
  contenido: string;
  usuario_id: number;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  margen_superior: number;
  margen_inferior: number;
  margen_izquierdo: number;
  margen_derecho: number;
  tamano_papel?: 'carta' | 'legal' | 'a4';
  tamano_hoja_id?: number | null;
  ancho_mm?: number | null;
  alto_mm?: number | null;
}

export interface EtiquetaReemplazable {
  etiqueta: string;
  descripcion: string;
  tipo: 'texto' | 'fecha' | 'numero' | 'catalogo' | 'personalizada';
  catalogo_id?: number;
}

export interface EtiquetaPersonalizada {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
}
