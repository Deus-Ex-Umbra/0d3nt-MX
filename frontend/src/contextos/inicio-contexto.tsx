import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type TabInicio = 'dashboard' | 'reportes' | 'plantillas';
type SubtabPlantillas = 'consentimientos' | 'recetas';

type InicioUIContexto = {
  tabInicio: TabInicio;
  setTabInicio: (tab: TabInicio) => void;

  subtabPlantillas: SubtabPlantillas;
  setSubtabPlantillas: (tab: SubtabPlantillas) => void;

  fechaSeleccionada: Date | undefined;
  setFechaSeleccionada: (fecha: Date | undefined) => void;
};

const InicioUIContext = createContext<InicioUIContexto | undefined>(undefined);

const STORAGE_KEYS = {
  tab: 'inicio_ui_tab',
  subtab: 'inicio_ui_subtab_plantillas',
  fecha: 'inicio_ui_fecha_seleccionada',
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

function leerTabInicial(): TabInicio {
  const raw = safeRead(STORAGE_KEYS.tab);
  if (raw === 'dashboard' || raw === 'reportes' || raw === 'plantillas') return raw;
  return 'dashboard';
}

function leerSubtabInicial(): SubtabPlantillas {
  const raw = safeRead(STORAGE_KEYS.subtab);
  if (raw === 'consentimientos' || raw === 'recetas') return raw;
  return 'consentimientos';
}

function leerFechaInicial(): Date | undefined {
  const raw = safeRead(STORAGE_KEYS.fecha);
  if (!raw) return new Date();
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
}

export function ProveedorInicioUI({ children }: { children: React.ReactNode }) {
  const [tabInicio, setTabInicioState] = useState<TabInicio>(() => leerTabInicial());
  const [subtabPlantillas, setSubtabPlantillasState] = useState<SubtabPlantillas>(() => leerSubtabInicial());
  const [fechaSeleccionada, setFechaSeleccionadaState] = useState<Date | undefined>(() => leerFechaInicial());

  const setTabInicio = useCallback((tab: TabInicio) => {
    setTabInicioState(tab);
  }, []);

  const setSubtabPlantillas = useCallback((tab: SubtabPlantillas) => {
    setSubtabPlantillasState(tab);
  }, []);

  const setFechaSeleccionada = useCallback((fecha: Date | undefined) => {
    setFechaSeleccionadaState(fecha);
  }, []);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.tab, tabInicio);
  }, [tabInicio]);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.subtab, subtabPlantillas);
  }, [subtabPlantillas]);

  useEffect(() => {
    if (!fechaSeleccionada) return;
    safeWrite(STORAGE_KEYS.fecha, fechaSeleccionada.toISOString());
  }, [fechaSeleccionada]);

  const value = useMemo<InicioUIContexto>(
    () => ({
      tabInicio,
      setTabInicio,
      subtabPlantillas,
      setSubtabPlantillas,
      fechaSeleccionada,
      setFechaSeleccionada,
    }),
    [tabInicio, setTabInicio, subtabPlantillas, setSubtabPlantillas, fechaSeleccionada, setFechaSeleccionada]
  );

  return <InicioUIContext.Provider value={value}>{children}</InicioUIContext.Provider>;
}

export function useInicioUI() {
  const ctx = useContext(InicioUIContext);
  if (!ctx) throw new Error('useInicioUI debe usarse dentro de ProveedorInicioUI');
  return ctx;
}

export type { TabInicio, SubtabPlantillas };
