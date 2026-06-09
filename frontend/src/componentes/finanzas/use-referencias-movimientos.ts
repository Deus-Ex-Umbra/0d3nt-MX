import { useCallback, useEffect, useRef, useState } from 'react';
import { agendaApi, planesTratamientoApi } from '@/lib/api';
import type { Movimiento } from '@/tipos';
import type {
  CitaReferenciaLite,
  PlanTratamientoReferenciaLite,
} from './referencia-cita-tratamiento';

function normalizarCita(data: any): CitaReferenciaLite {
  return {
    descripcion: data?.descripcion ?? '',
    paciente: data?.paciente
      ? {
          nombre: data.paciente.nombre,
          apellidos: data.paciente.apellidos,
        }
      : null,
  };
}

function normalizarPlan(data: any): PlanTratamientoReferenciaLite {
  return {
    tratamiento: data?.tratamiento
      ? {
          nombre: data.tratamiento.nombre,
        }
      : null,
  };
}

export function useReferenciasMovimientos(movimientos: Movimiento[]) {
  const [citasPorId, setCitasPorId] = useState<Record<number, CitaReferenciaLite>>({});
  const [planesPorId, setPlanesPorId] = useState<Record<number, PlanTratamientoReferenciaLite>>({});

  const citasEnVuelo = useRef<Set<number>>(new Set());
  const planesEnVuelo = useRef<Set<number>>(new Set());

  const cargarReferencias = useCallback(
    async (movs: Movimiento[]) => {
      const ids_citas = Array.from(
        new Set(movs.map((m) => m.cita_id).filter((v): v is number => typeof v === 'number'))
      );
      const ids_planes = Array.from(
        new Set(movs.map((m) => m.plan_tratamiento_id).filter((v): v is number => typeof v === 'number'))
      );

      const faltantes_citas = ids_citas.filter((id) => !citasPorId[id] && !citasEnVuelo.current.has(id));
      const faltantes_planes = ids_planes.filter((id) => !planesPorId[id] && !planesEnVuelo.current.has(id));

      if (faltantes_citas.length === 0 && faltantes_planes.length === 0) return;

      faltantes_citas.forEach((id) => citasEnVuelo.current.add(id));
      faltantes_planes.forEach((id) => planesEnVuelo.current.add(id));

      try {
        if (faltantes_citas.length > 0) {
          const resultados = await Promise.allSettled(
            faltantes_citas.map(async (id) => ({ id, data: await agendaApi.obtenerPorIdCompleto(id) }))
          );
          const nuevas: Record<number, CitaReferenciaLite> = {};
          for (const r of resultados) {
            if (r.status === 'fulfilled') {
              nuevas[r.value.id] = normalizarCita(r.value.data);
            }
          }
          if (Object.keys(nuevas).length > 0) {
            setCitasPorId((prev) => ({ ...prev, ...nuevas }));
          }
        }

        if (faltantes_planes.length > 0) {
          const resultados = await Promise.allSettled(
            faltantes_planes.map(async (id) => ({ id, data: await planesTratamientoApi.obtenerPorId(id) }))
          );
          const nuevas: Record<number, PlanTratamientoReferenciaLite> = {};
          for (const r of resultados) {
            if (r.status === 'fulfilled') {
              nuevas[r.value.id] = normalizarPlan(r.value.data);
            }
          }
          if (Object.keys(nuevas).length > 0) {
            setPlanesPorId((prev) => ({ ...prev, ...nuevas }));
          }
        }
      } finally {
        faltantes_citas.forEach((id) => citasEnVuelo.current.delete(id));
        faltantes_planes.forEach((id) => planesEnVuelo.current.delete(id));
      }
    },
    [citasPorId, planesPorId]
  );

  useEffect(() => {
    if (!movimientos || movimientos.length === 0) return;
    void cargarReferencias(movimientos);
  }, [movimientos, cargarReferencias]);

  return { citasPorId, planesPorId };
}
