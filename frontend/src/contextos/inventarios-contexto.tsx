import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Inventario, Producto, ReporteValor } from '@/tipos';

type VistaInventarios = 'lista' | 'detalle';
type TabInventarios = 'productos' | 'kardex' | 'bitacora' | 'auditoria';
type SubtabProductos = 'consumibles' | 'activos_fijos';

type SeleccionInventario = { id: number; nombre?: string } | null;

type DetalleInventarioCache = {
  inventario: Inventario;
  productos: Producto[];
  reporte_valor: ReporteValor | null;
  timestamp: number;
} | null;

type InventariosUIContexto = {
  vista_actual: VistaInventarios;
  setVistaActual: (vista: VistaInventarios) => void;

  tab_activo: TabInventarios;
  setTabActivo: (tab: TabInventarios) => void;

  subtab_productos: SubtabProductos;
  setSubtabProductos: (tab: SubtabProductos) => void;

  seleccion: SeleccionInventario;
  setSeleccion: (seleccion: SeleccionInventario) => void;
  limpiarSeleccion: () => void;

  detalle_cache: DetalleInventarioCache;
  setDetalleCache: (cache: DetalleInventarioCache) => void;
  limpiarDetalleCache: () => void;
};

const InventariosUIContext = createContext<InventariosUIContexto | undefined>(undefined);

const STORAGE_KEYS = {
  vista: 'inventarios_ui_vista',
  tab: 'inventarios_ui_tab',
  subtab: 'inventarios_ui_subtab',
  seleccion: 'inventarios_ui_seleccion',
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

function safeRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
  }
}

function leerVistaInicial(): VistaInventarios {
  const raw = safeRead(STORAGE_KEYS.vista);
  return raw === 'detalle' ? 'detalle' : 'lista';
}

function leerTabInicial(): TabInventarios {
  const raw = safeRead(STORAGE_KEYS.tab);
  if (raw === 'productos' || raw === 'kardex' || raw === 'bitacora' || raw === 'auditoria') return raw;
  return 'productos';
}

function leerSubtabInicial(): SubtabProductos {
  const raw = safeRead(STORAGE_KEYS.subtab);
  if (raw === 'consumibles' || raw === 'activos_fijos') return raw;
  return 'consumibles';
}

function leerSeleccionInicial(): SeleccionInventario {
  const raw = safeRead(STORAGE_KEYS.seleccion);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const id = Number(parsed?.id);
    if (!Number.isFinite(id) || id <= 0) return null;
    const nombre = typeof parsed?.nombre === 'string' ? parsed.nombre : undefined;
    return { id, nombre };
  } catch {
    return null;
  }
}

export function ProveedorInventariosUI({ children }: { children: React.ReactNode }) {
  const [vista_actual, setVistaActual] = useState<VistaInventarios>(() => leerVistaInicial());
  const [tab_activo, setTabActivo] = useState<TabInventarios>(() => leerTabInicial());
  const [subtab_productos, setSubtabProductos] = useState<SubtabProductos>(() => leerSubtabInicial());
  const [seleccion, setSeleccionState] = useState<SeleccionInventario>(() => leerSeleccionInicial());
  const [detalle_cache, setDetalleCacheState] = useState<DetalleInventarioCache>(null);
  const setSeleccion = useCallback((next: SeleccionInventario) => {
    setSeleccionState(next);
  }, []);

  const limpiarSeleccion = useCallback(() => {
    setSeleccionState(null);
    setVistaActual('lista');
  }, []);

  const setDetalleCache = useCallback((cache: DetalleInventarioCache) => {
    setDetalleCacheState(cache);
  }, []);

  const limpiarDetalleCache = useCallback(() => {
    setDetalleCacheState(null);
  }, []);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.vista, vista_actual);
  }, [vista_actual]);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.tab, tab_activo);
  }, [tab_activo]);

  useEffect(() => {
    safeWrite(STORAGE_KEYS.subtab, subtab_productos);
  }, [subtab_productos]);

  useEffect(() => {
    if (!seleccion) {
      safeRemove(STORAGE_KEYS.seleccion);
      return;
    }
    safeWrite(STORAGE_KEYS.seleccion, JSON.stringify({ id: seleccion.id, nombre: seleccion.nombre ?? '' }));
  }, [seleccion]);

  const value = useMemo<InventariosUIContexto>(
    () => ({
      vista_actual,
      setVistaActual,
      tab_activo,
      setTabActivo,
      subtab_productos,
      setSubtabProductos,
      seleccion,
      setSeleccion,
      limpiarSeleccion,
      detalle_cache,
      setDetalleCache,
      limpiarDetalleCache,
    }),
    [
      vista_actual,
      tab_activo,
      subtab_productos,
      seleccion,
      detalle_cache,
      setSeleccion,
      limpiarSeleccion,
      setDetalleCache,
      limpiarDetalleCache,
    ]
  );

  return <InventariosUIContext.Provider value={value}>{children}</InventariosUIContext.Provider>;
}

export function useInventariosUI() {
  const ctx = useContext(InventariosUIContext);
  if (!ctx) throw new Error('useInventariosUI debe usarse dentro de ProveedorInventariosUI');
  return ctx;
}

export type { VistaInventarios, TabInventarios, SubtabProductos, SeleccionInventario, DetalleInventarioCache };
