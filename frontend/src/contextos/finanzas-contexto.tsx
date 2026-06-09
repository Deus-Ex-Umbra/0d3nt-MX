import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type SeccionFinanzas = 'movimientos' | 'analisis';

type AnalisisPrecision = 'alta' | 'equilibrio' | 'global';
type AnalisisEstado = 'disponibles' | 'borrados' | 'todos';

type AnalisisFiltros = {
  fecha_inicio: Date;
  fecha_fin: Date;
  glosa: string;
  sensible_mayusculas: boolean;
  nivel_precision: AnalisisPrecision;
  estado: AnalisisEstado;
};

type FinanzasUIContexto = {
  seccion_activa: SeccionFinanzas;
  setSeccionActiva: (seccion: SeccionFinanzas) => void;

  analisis_filtros: AnalisisFiltros;
  setAnalisisFiltros: (filtros: AnalisisFiltros) => void;

  analisis_busqueda_local: string;
  setAnalisisBusquedaLocal: (valor: string) => void;
};

const FinanzasUIContext = createContext<FinanzasUIContexto | undefined>(undefined);

const STORAGE_KEYS = {
  seccion: 'finanzas_ui_seccion',
  analisis_filtros: 'finanzas_ui_analisis_filtros',
  analisis_busqueda_local: 'finanzas_ui_analisis_busqueda_local',
} as const;

function safeRead(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
  }
}

function filtrosAnalisisPorDefecto(): AnalisisFiltros {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);
  return {
    fecha_inicio: inicio,
    fecha_fin: fin,
    glosa: '',
    sensible_mayusculas: false,
    nivel_precision: 'equilibrio',
    estado: 'disponibles',
  };
}

function leerSeccionInicial(): SeccionFinanzas {
  const raw = safeRead(STORAGE_KEYS.seccion);
  if (raw === 'movimientos' || raw === 'analisis') return raw;
  return 'movimientos';
}

function leerAnalisisFiltrosInicial(): AnalisisFiltros {
  const raw = safeRead(STORAGE_KEYS.analisis_filtros);
  if (!raw) return filtrosAnalisisPorDefecto();

  try {
    const parsed = JSON.parse(raw);
    const base = filtrosAnalisisPorDefecto();

    const fi = new Date(parsed?.fecha_inicio);
    const ff = new Date(parsed?.fecha_fin);

    const fecha_inicio = Number.isNaN(fi.getTime()) ? base.fecha_inicio : fi;
    const fecha_fin = Number.isNaN(ff.getTime()) ? base.fecha_fin : ff;

    const glosa = typeof parsed?.glosa === 'string' ? parsed.glosa : base.glosa;
    const sensible_mayusculas = typeof parsed?.sensible_mayusculas === 'boolean'
      ? parsed.sensible_mayusculas
      : base.sensible_mayusculas;

    const nivel_precision: AnalisisPrecision =
      parsed?.nivel_precision === 'alta' || parsed?.nivel_precision === 'equilibrio' || parsed?.nivel_precision === 'global'
        ? parsed.nivel_precision
        : base.nivel_precision;

    const estado: AnalisisEstado =
      parsed?.estado === 'disponibles' || parsed?.estado === 'borrados' || parsed?.estado === 'todos'
        ? parsed.estado
        : base.estado;

    return { fecha_inicio, fecha_fin, glosa, sensible_mayusculas, nivel_precision, estado };
  } catch {
    return filtrosAnalisisPorDefecto();
  }
}

function leerAnalisisBusquedaLocalInicial(): string {
  return safeRead(STORAGE_KEYS.analisis_busqueda_local) ?? '';
}

export function ProveedorFinanzasUI({ children }: { children: React.ReactNode }) {
  const [seccion_activa, setSeccionActivaState] = useState<SeccionFinanzas>(() => leerSeccionInicial());
  const [analisis_filtros, setAnalisisFiltrosState] = useState<AnalisisFiltros>(() => leerAnalisisFiltrosInicial());
  const [analisis_busqueda_local, setAnalisisBusquedaLocalState] = useState<string>(() => leerAnalisisBusquedaLocalInicial());

  const setSeccionActiva = useCallback((seccion: SeccionFinanzas) => {
    setSeccionActivaState(seccion);
  }, []);

  const setAnalisisFiltros = useCallback((filtros: AnalisisFiltros) => {
    setAnalisisFiltrosState(filtros);
  }, []);

  const setAnalisisBusquedaLocal = useCallback((valor: string) => {
    setAnalisisBusquedaLocalState(valor);
  }, []);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.seccion, seccion_activa);
  }, [seccion_activa]);

  useEffect(() => {
    safeWrite(
      STORAGE_KEYS.analisis_filtros,
      JSON.stringify({
        ...analisis_filtros,
        fecha_inicio: analisis_filtros.fecha_inicio?.toISOString?.() ?? analisis_filtros.fecha_inicio,
        fecha_fin: analisis_filtros.fecha_fin?.toISOString?.() ?? analisis_filtros.fecha_fin,
      })
    );
  }, [analisis_filtros]);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.analisis_busqueda_local, analisis_busqueda_local);
  }, [analisis_busqueda_local]);

  const value = useMemo<FinanzasUIContexto>(
    () => ({
      seccion_activa,
      setSeccionActiva,
      analisis_filtros,
      setAnalisisFiltros,
      analisis_busqueda_local,
      setAnalisisBusquedaLocal,
    }),
    [
      seccion_activa,
      setSeccionActiva,
      analisis_filtros,
      setAnalisisFiltros,
      analisis_busqueda_local,
      setAnalisisBusquedaLocal,
    ]
  );

  return <FinanzasUIContext.Provider value={value}>{children}</FinanzasUIContext.Provider>;
}

export function useFinanzasUI() {
  const ctx = useContext(FinanzasUIContext);
  if (!ctx) throw new Error('useFinanzasUI debe usarse dentro de ProveedorFinanzasUI');
  return ctx;
}

export type { SeccionFinanzas, AnalisisFiltros, AnalisisPrecision, AnalisisEstado };
