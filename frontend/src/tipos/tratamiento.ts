import { PacienteBasico } from './paciente';

export interface Tratamiento {
  id: number;
  nombre: string;
  numero_citas: number;
  costo_total: number;
  costo_total_usd?: number;
  tasa_cambio?: number;
  intervalo_dias: number;
  intervalo_semanas: number;
  intervalo_meses: number;
  horas_aproximadas_citas: number;
  minutos_aproximados_citas: number;
  auto_completar_al_100?: boolean;
}

export interface PlanTratamiento {
  id: number;
  costo_total: number;
  costo_total_usd?: number;
  tasa_cambio?: number;
  total_abonado: number;
  total_abonado_usd?: number;
  paciente_eliminado?: boolean;
  paciente: PacienteBasico;
  tratamiento: {
    id: number;
    nombre: string;
    intervalo_dias?: number;
    intervalo_semanas?: number;
    intervalo_meses?: number;
    auto_completar_al_100?: boolean;
  };
  fecha_inicio: Date;
  estado: string;
  citas?: Array<{
    id: number;
    fecha: Date;
    descripcion: string;
    estado_pago: string;
    monto_esperado: number;
    paciente_eliminado?: boolean;
  }>;
}

