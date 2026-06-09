import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type TabTratamientos = 'planes' | 'plantillas';
type TabEstadoPlan = 'pendiente' | 'completado' | 'cancelado';

type TratamientosUIContexto = {
  tabActiva: TabTratamientos;
  setTabActiva: (tab: TabTratamientos) => void;

  paciente_filtro: string;
  setPacienteFiltro: (valor: string) => void;

  busqueda_planes: string;
  setBusquedaPlanes: (valor: string) => void;

  busqueda_plantillas: string;
  setBusquedaPlantillas: (valor: string) => void;

  tab_estado_plan: TabEstadoPlan;
  setTabEstadoPlan: (tab: TabEstadoPlan) => void;

  items_por_pagina_planes: number;
  setItemsPorPaginaPlanes: (cantidad: number) => void;
};

const TratamientosUIContext = createContext<TratamientosUIContexto | undefined>(undefined);

const STORAGE_KEYS = {
  tab: 'tratamientos_ui_tab',
  paciente_filtro: 'tratamientos_ui_paciente_filtro',
  busqueda_planes: 'tratamientos_ui_busqueda_planes',
  busqueda_plantillas: 'tratamientos_ui_busqueda_plantillas',
  tab_estado_plan: 'tratamientos_ui_tab_estado_plan',
  items_por_pagina_planes: 'tratamientos_ui_items_por_pagina_planes',
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

function leerTabInicial(): TabTratamientos {
  const raw = safeRead(STORAGE_KEYS.tab);
  if (raw === 'planes' || raw === 'plantillas') return raw;
  return 'planes';
}

function leerPacienteFiltroInicial(): string {
  const raw = safeRead(STORAGE_KEYS.paciente_filtro);
  return raw ?? 'todos';
}

function leerBusquedaPlanesInicial(): string {
  return safeRead(STORAGE_KEYS.busqueda_planes) ?? '';
}

function leerBusquedaPlantillasInicial(): string {
  return safeRead(STORAGE_KEYS.busqueda_plantillas) ?? '';
}

function leerTabEstadoPlanInicial(): TabEstadoPlan {
  const raw = safeRead(STORAGE_KEYS.tab_estado_plan);
  if (raw === 'pendiente' || raw === 'completado' || raw === 'cancelado') return raw;
  return 'pendiente';
}

function leerItemsPorPaginaPlanesInicial(): number {
  const raw = safeRead(STORAGE_KEYS.items_por_pagina_planes);
  const n = Number(raw);
  if (n === 10 || n === 15 || n === 20) return n;
  return 10;
}

export function ProveedorTratamientosUI({ children }: { children: React.ReactNode }) {
  const [tabActiva, setTabActivaState] = useState<TabTratamientos>(() => leerTabInicial());
  const [paciente_filtro, setPacienteFiltroState] = useState<string>(() => leerPacienteFiltroInicial());
  const [busqueda_planes, setBusquedaPlanesState] = useState<string>(() => leerBusquedaPlanesInicial());
  const [busqueda_plantillas, setBusquedaPlantillasState] = useState<string>(() => leerBusquedaPlantillasInicial());
  const [tab_estado_plan, setTabEstadoPlanState] = useState<TabEstadoPlan>(() => leerTabEstadoPlanInicial());
  const [items_por_pagina_planes, setItemsPorPaginaPlanesState] = useState<number>(() => leerItemsPorPaginaPlanesInicial());

  const setTabActiva = useCallback((tab: TabTratamientos) => {
    setTabActivaState(tab);
  }, []);

  const setPacienteFiltro = useCallback((valor: string) => {
    setPacienteFiltroState(valor);
  }, []);

  const setBusquedaPlanes = useCallback((valor: string) => {
    setBusquedaPlanesState(valor);
  }, []);

  const setBusquedaPlantillas = useCallback((valor: string) => {
    setBusquedaPlantillasState(valor);
  }, []);

  const setTabEstadoPlan = useCallback((tab: TabEstadoPlan) => {
    setTabEstadoPlanState(tab);
  }, []);

  const setItemsPorPaginaPlanes = useCallback((cantidad: number) => {
    setItemsPorPaginaPlanesState(cantidad);
  }, []);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.tab, tabActiva);
  }, [tabActiva]);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.paciente_filtro, paciente_filtro);
  }, [paciente_filtro]);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.busqueda_planes, busqueda_planes);
  }, [busqueda_planes]);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.busqueda_plantillas, busqueda_plantillas);
  }, [busqueda_plantillas]);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.tab_estado_plan, tab_estado_plan);
  }, [tab_estado_plan]);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.items_por_pagina_planes, String(items_por_pagina_planes));
  }, [items_por_pagina_planes]);

  const value = useMemo<TratamientosUIContexto>(
    () => ({
      tabActiva,
      setTabActiva,
      paciente_filtro,
      setPacienteFiltro,
      busqueda_planes,
      setBusquedaPlanes,
      busqueda_plantillas,
      setBusquedaPlantillas,
      tab_estado_plan,
      setTabEstadoPlan,
      items_por_pagina_planes,
      setItemsPorPaginaPlanes,
    }),
    [
      tabActiva,
      setTabActiva,
      paciente_filtro,
      setPacienteFiltro,
      busqueda_planes,
      setBusquedaPlanes,
      busqueda_plantillas,
      setBusquedaPlantillas,
      tab_estado_plan,
      setTabEstadoPlan,
      items_por_pagina_planes,
      setItemsPorPaginaPlanes,
    ]
  );

  return <TratamientosUIContext.Provider value={value}>{children}</TratamientosUIContext.Provider>;
}

export function useTratamientosUI() {
  const ctx = useContext(TratamientosUIContext);
  if (!ctx) throw new Error('useTratamientosUI debe usarse dentro de ProveedorTratamientosUI');
  return ctx;
}

export type { TabTratamientos, TabEstadoPlan };
