type IpcRendererElectron = {
  invoke?: (canal: string, ...args: any[]) => Promise<any>;
};

export function obtenerIpcRenderer(): IpcRendererElectron | null {
  try {
    const w = window as any;
    const req = w?.require;
    if (typeof req !== 'function') return null;
    const electron = req('electron');
    return electron?.ipcRenderer ?? null;
  } catch {
    return null;
  }
}

export type EstadoBootstrap = {
  stage: string;
  detail: string;
  ok: boolean;
  error: string | null;
  progreso: number;
  updatedAt: number;
  dbPort?: number;
  backendPort?: number;
  rutas?: Record<string, any>;
  checks?: Record<string, any>;
};

export async function obtenerEstadoBootstrap(): Promise<EstadoBootstrap | null> {
  const ipc = obtenerIpcRenderer();
  if (!ipc?.invoke) return null;
  try {
    const resp = await ipc.invoke('bootstrap:estado');
    return resp as EstadoBootstrap;
  } catch {
    return null;
  }
}

export async function obtenerLogsBootstrap(): Promise<{ bootstrap: string; postgres: string } | null> {
  const ipc = obtenerIpcRenderer();
  if (!ipc?.invoke) return null;
  try {
    const resp = await ipc.invoke('bootstrap:logs');
    return {
      bootstrap: String(resp?.bootstrap || ''),
      postgres: String(resp?.postgres || ''),
    };
  } catch {
    return null;
  }
}

export function suscribirBootstrapProgreso(onEstado: (s: EstadoBootstrap) => void): () => void {
  const ipc = obtenerIpcRenderer() as any;
  if (!ipc?.on || !ipc?.removeListener) return () => { };
  const handler = (_event: any, estado: any) => {
    try {
      onEstado(estado as EstadoBootstrap);
    } catch {
    }
  };
  ipc.on('bootstrap:progreso', handler);
  return () => {
    try { ipc.removeListener('bootstrap:progreso', handler); } catch { }
  };
}

export async function actualizarTitleBarOverlay(opts: { color: string; symbolColor: string; height?: number }): Promise<boolean> {
  const ipc = obtenerIpcRenderer();
  if (!ipc?.invoke) return false;
  const resp = await ipc.invoke('ui:titlebarOverlay', {
    color: String(opts?.color || ''),
    symbolColor: String(opts?.symbolColor || ''),
    height: typeof opts?.height === 'number' ? opts.height : 32,
  });
  return !!resp?.ok;
}

export async function minimizarVentana(): Promise<boolean> {
  const ipc = obtenerIpcRenderer();
  if (!ipc?.invoke) return false;
  const resp = await ipc.invoke('ui:window:minimize');
  return !!resp?.ok;
}

export async function alternarMaximizarVentana(): Promise<boolean> {
  const ipc = obtenerIpcRenderer();
  if (!ipc?.invoke) return false;
  const resp = await ipc.invoke('ui:window:maximizeToggle');
  return !!resp?.ok;
}

export async function ventanaEstaMaximizada(): Promise<boolean> {
  const ipc = obtenerIpcRenderer();
  if (!ipc?.invoke) return false;
  const resp = await ipc.invoke('ui:window:isMaximized');
  return !!resp?.ok && !!resp?.maximized;
}

export async function ventanaEstaEnPantallaCompleta(): Promise<boolean> {
  const ipc = obtenerIpcRenderer();
  if (!ipc?.invoke) return false;
  const resp = await ipc.invoke('ui:window:isFullScreen');
  return !!resp?.ok && !!resp?.fullscreen;
}

export async function cerrarVentana(): Promise<boolean> {
  const ipc = obtenerIpcRenderer();
  if (!ipc?.invoke) return false;
  const resp = await ipc.invoke('ui:window:close');
  return !!resp?.ok;
}

export async function obtenerEstadoLicenciaLocal(): Promise<
  | { disponible: false; motivo?: string }
  | { disponible: true; ruta: string }
> {
  const ipc = obtenerIpcRenderer();
  if (!ipc?.invoke) return { disponible: false, motivo: 'No disponible fuera de Electron' };
  const resp = await ipc.invoke('licencia:estado');
  if (resp?.valida) return { disponible: true, ruta: String(resp.ruta || '') };
  return { disponible: false, motivo: String(resp?.motivo || 'Licencia no encontrada o inválida') };
}

export async function obtenerHwidCliente(): Promise<string | null> {
  const ipc = obtenerIpcRenderer();
  if (!ipc?.invoke) return null;
  const resp = await ipc.invoke('licencia:hwid');
  return resp ? String(resp) : null;
}

export async function guardarLicenciaLocal(paquete: {
  llave_aes: string;
  c: string;
  t_auth: string;
  iv: string;
  s: string;
}, opts?: { llave_publica_pem?: string }): Promise<{ ok: true; ruta: string } | { ok: false; error: string }> {
  const ipc = obtenerIpcRenderer();
  if (!ipc?.invoke) return { ok: false, error: 'No disponible fuera de Electron' };
  const resp = await ipc.invoke('licencia:guardar', paquete, {
    llave_publica_pem: opts?.llave_publica_pem,
  });
  if (resp?.ok) return { ok: true, ruta: String(resp.ruta || '') };
  return { ok: false, error: String(resp?.error || 'No se pudo guardar la licencia') };
}
