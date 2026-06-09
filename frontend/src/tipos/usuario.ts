export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  avatar?: string;
  pais?: string;
  codigo_pais?: string;
  moneda?: string;
  moneda_pais_iso?: string;
  modo_edicion_historica?: boolean;
}

export interface UsuarioInventario {
  id: number;
  nombre: string;
  correo: string;
}

