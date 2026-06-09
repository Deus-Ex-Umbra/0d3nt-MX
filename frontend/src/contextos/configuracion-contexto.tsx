import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type TabConfiguracion = 'perfil' | 'clinica' | 'apariencia' | 'catalogos';

type ConfiguracionUIContexto = {
  tab_configuracion: TabConfiguracion;
  setTabConfiguracion: (tab: TabConfiguracion) => void;

  catalogos_secciones_abiertas: string[];
  esSeccionCatalogosAbierta: (id: string) => boolean;
  setSeccionCatalogosAbierta: (id: string, abierta: boolean) => void;
  toggleSeccionCatalogos: (id: string) => void;
};

const ConfiguracionUIContext = createContext<ConfiguracionUIContexto | undefined>(undefined);

const STORAGE_KEYS = {
  tab: 'configuracion_ui_tab',
  catalogos: 'configuracion_ui_catalogos_secciones_abiertas',
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

function leerTabInicial(): TabConfiguracion {
  const raw = safeRead(STORAGE_KEYS.tab);
  if (raw === 'perfil' || raw === 'clinica' || raw === 'apariencia' || raw === 'catalogos') return raw;
  return 'perfil';
}

function leerSeccionesCatalogosInicial(): string[] {
  const raw = safeRead(STORAGE_KEYS.catalogos);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === 'string' && x.trim().length > 0);
  } catch {
    return [];
  }
}

function normalizarUnicos(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const id = (v || '').trim();
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function ProveedorConfiguracionUI({ children }: { children: React.ReactNode }) {
  const [tab_configuracion, setTabConfiguracionState] = useState<TabConfiguracion>(() => leerTabInicial());
  const [catalogos_secciones_abiertas, setCatalogosSeccionesAbiertasState] = useState<string[]>(() =>
    normalizarUnicos(leerSeccionesCatalogosInicial())
  );

  const setTabConfiguracion = useCallback((tab: TabConfiguracion) => {
    setTabConfiguracionState(tab);
  }, []);

  const esSeccionCatalogosAbierta = useCallback(
    (id: string) => {
      const key = (id || '').trim();
      if (!key) return false;
      return catalogos_secciones_abiertas.includes(key);
    },
    [catalogos_secciones_abiertas]
  );

  const setSeccionCatalogosAbierta = useCallback((id: string, abierta: boolean) => {
    const key = (id || '').trim();
    if (!key) return;

    setCatalogosSeccionesAbiertasState((prev) => {
      const current = new Set(prev);
      if (abierta) current.add(key);
      else current.delete(key);
      return Array.from(current);
    });
  }, []);

  const toggleSeccionCatalogos = useCallback((id: string) => {
    const key = (id || '').trim();
    if (!key) return;

    setCatalogosSeccionesAbiertasState((prev) => {
      const current = new Set(prev);
      if (current.has(key)) current.delete(key);
      else current.add(key);
      return Array.from(current);
    });
  }, []);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.tab, tab_configuracion);
  }, [tab_configuracion]);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.catalogos, JSON.stringify(normalizarUnicos(catalogos_secciones_abiertas)));
  }, [catalogos_secciones_abiertas]);

  const value = useMemo<ConfiguracionUIContexto>(
    () => ({
      tab_configuracion,
      setTabConfiguracion,
      catalogos_secciones_abiertas,
      esSeccionCatalogosAbierta,
      setSeccionCatalogosAbierta,
      toggleSeccionCatalogos,
    }),
    [
      tab_configuracion,
      setTabConfiguracion,
      catalogos_secciones_abiertas,
      esSeccionCatalogosAbierta,
      setSeccionCatalogosAbierta,
      toggleSeccionCatalogos,
    ]
  );

  return <ConfiguracionUIContext.Provider value={value}>{children}</ConfiguracionUIContext.Provider>;
}

export function useConfiguracionUI() {
  const ctx = useContext(ConfiguracionUIContext);
  if (!ctx) throw new Error('useConfiguracionUI debe usarse dentro de ProveedorConfiguracionUI');
  return ctx;
}

export type { TabConfiguracion };
