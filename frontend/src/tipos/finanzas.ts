export interface Movimiento {
  id: number;
  tipo: 'ingreso' | 'egreso';
  fecha: Date;
  monto: number;
  monto_usd?: number;
  tasa_cambio?: number;
  concepto: string;
  cita_id?: number;
  plan_tratamiento_id?: number;
  creado_en?: Date;
  actualizado_en?: Date;
  eliminado_en?: Date;
}

export interface ReporteFinanzas {
  total_ingresos: number;
  total_egresos: number;
  balance: number;
  total_ingresos_usd?: number;
  total_egresos_usd?: number;
  balance_usd?: number;
  movimientos: Movimiento[];
}

export interface DatosGrafico {
  periodo: string;
  ingresos: number;
  egresos: number;
  ingresos_usd?: number;
  egresos_usd?: number;
}

export interface FiltrosAnalisis {
  fecha_inicio: string;
  fecha_fin: string;
  glosa?: string;
  sensible_mayusculas?: boolean;
  nivel_precision?: 'alta' | 'equilibrio' | 'global';
}

export interface RespuestaAnalisis {
  total_ingresos: number;
  total_egresos: number;
  balance: number;
  total_ingresos_usd?: number;
  total_egresos_usd?: number;
  balance_usd?: number;
  movimientos: Movimiento[];
  datos_grafico: DatosGrafico[];
  granularidad: 'hora' | 'dia' | 'semana' | 'mes' | 'ano';
}
