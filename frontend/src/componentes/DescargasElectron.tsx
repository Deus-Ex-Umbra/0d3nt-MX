import { useEffect, useMemo, useRef, useState } from 'react';
import { Progress } from '@/componentes/ui/progress';
import { Button } from '@/componentes/ui/button';
import { X, FolderOpen } from 'lucide-react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/componentes/ui/toast';

type EstadoDescarga = 'iniciada' | 'en_progreso' | 'completada' | 'fallida' | 'cancelada';

type ActualizacionDescarga = {
  id: string;
  nombre: string;
  rutaDestino: string;
  estado: EstadoDescarga;
  recibidosBytes: number;
  totalBytes: number;
  progreso: number | null;
};

type IpcRendererElectron = {
  on: (canal: string, listener: (_event: unknown, data: unknown) => void) => void;
  removeListener: (canal: string, listener: (_event: unknown, data: unknown) => void) => void;
  send: (canal: string, data: unknown) => void;
};

function obtenerIpcRenderer(): IpcRendererElectron | null {
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

function formatearBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(unidades.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const valor = bytes / Math.pow(1024, i);
  const decimales = i === 0 ? 0 : valor >= 10 ? 1 : 2;
  return `${valor.toFixed(decimales)} ${unidades[i]}`;
}

function textoEstado(estado: EstadoDescarga): string {
  switch (estado) {
    case 'iniciada':
      return 'Iniciando…';
    case 'en_progreso':
      return 'Descargando…';
    case 'completada':
      return 'Completada';
    case 'cancelada':
      return 'Cancelada';
    case 'fallida':
      return 'Fallida';
    default:
      return '—';
  }
}

export function DescargasElectron() {
  const ipc = useMemo(() => obtenerIpcRenderer(), []);
  const [descargas, setDescargas] = useState<Record<string, ActualizacionDescarga>>({});
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({});
  const [cuentaAtras, setCuentaAtras] = useState<Record<string, number>>({});
  const intervalosCuentaAtrasRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const limpiarCuentaAtras = (id: string) => {
    const intervalo = intervalosCuentaAtrasRef.current[id];
    if (intervalo) {
      clearInterval(intervalo);
      delete intervalosCuentaAtrasRef.current[id];
    }

    setCuentaAtras((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, id)) return prev;
      const { [id]: _omitida, ...resto } = prev;
      return resto;
    });
  };

  const iniciarCuentaAtras = (id: string, segundos: number) => {
    limpiarCuentaAtras(id);
    setCuentaAtras((prev) => ({ ...prev, [id]: segundos }));

    intervalosCuentaAtrasRef.current[id] = setInterval(() => {
      setCuentaAtras((prev) => {
        const actual = prev[id];
        if (typeof actual !== 'number') return prev;

        const siguiente = Math.max(0, actual - 1);
        if (siguiente === 0) {
          clearInterval(intervalosCuentaAtrasRef.current[id]);
          delete intervalosCuentaAtrasRef.current[id];

          setAbiertas((prevAbiertas) => ({ ...prevAbiertas, [id]: false }));

          const { [id]: _omitida, ...resto } = prev;
          return resto;
        }

        return { ...prev, [id]: siguiente };
      });
    }, 1000);
  };

  useEffect(() => {
    if (!ipc) return;

    const listener = (_event: unknown, data: unknown) => {
      const actualizacion = data as Partial<ActualizacionDescarga>;
      if (!actualizacion?.id) return;

      setDescargas((prev) => {
        const anterior = prev[actualizacion.id as string];
        const siguiente: ActualizacionDescarga = {
          id: String(actualizacion.id),
          nombre: String(actualizacion.nombre ?? anterior?.nombre ?? 'archivo'),
          rutaDestino: String(actualizacion.rutaDestino ?? anterior?.rutaDestino ?? ''),
          estado: (actualizacion.estado as EstadoDescarga) ?? anterior?.estado ?? 'en_progreso',
          recibidosBytes: Number(actualizacion.recibidosBytes ?? anterior?.recibidosBytes ?? 0),
          totalBytes: Number(actualizacion.totalBytes ?? anterior?.totalBytes ?? 0),
          progreso: (actualizacion.progreso as number | null) ?? anterior?.progreso ?? null,
        };

        const eraFinal =
          anterior?.estado === 'completada' || anterior?.estado === 'fallida' || anterior?.estado === 'cancelada';
        const esFinal =
          siguiente.estado === 'completada' || siguiente.estado === 'fallida' || siguiente.estado === 'cancelada';

        if (!eraFinal && esFinal) {
          iniciarCuentaAtras(siguiente.id, 6);
        }

        if (eraFinal && !esFinal) {
          limpiarCuentaAtras(siguiente.id);
        }

        setAbiertas((prevAbiertas) => {
          const yaDefinida = Object.prototype.hasOwnProperty.call(prevAbiertas, siguiente.id);
          if (!yaDefinida) {
            return { ...prevAbiertas, [siguiente.id]: true };
          }

          if (!eraFinal && esFinal) {
            return { ...prevAbiertas, [siguiente.id]: true };
          }

          return prevAbiertas;
        });

        return { ...prev, [siguiente.id]: siguiente };
      });
    };

    ipc.on('descarga:actualizacion', listener);
    return () => {
      ipc.removeListener('descarga:actualizacion', listener);
    };
  }, [ipc]);

  useEffect(() => {
    return () => {
      Object.values(intervalosCuentaAtrasRef.current).forEach((i) => clearInterval(i));
      intervalosCuentaAtrasRef.current = {};
    };
  }, []);

  const lista = useMemo(() => Object.values(descargas), [descargas]);
  const visibles = useMemo(() => {
    const activas = lista.filter((d) => d.estado === 'iniciada' || d.estado === 'en_progreso');
    const finalizadas = lista
      .filter((d) => d.estado === 'completada' || d.estado === 'fallida' || d.estado === 'cancelada')
      .slice(-3);
    return [...activas, ...finalizadas]
      .filter((d) => abiertas[d.id] !== false)
      .slice(0, 5);
  }, [abiertas, lista]);

  if (!ipc || visibles.length === 0) return null;

  return (
    <ToastProvider>
      {visibles.map((d) => {
        const porcentaje = typeof d.progreso === 'number' ? Math.round(d.progreso * 100) : null;
        const puedeCancelar = d.estado === 'iniciada' || d.estado === 'en_progreso';
        const mostrarProgreso = d.estado === 'iniciada' || d.estado === 'en_progreso';
        const esFinal = d.estado === 'completada' || d.estado === 'fallida' || d.estado === 'cancelada';
        const segundosRestantes = esFinal ? cuentaAtras[d.id] : undefined;

        return (
          <Toast
            key={d.id}
            open={abiertas[d.id] !== false}
            onOpenChange={(open) => {
              setAbiertas((prev) => ({ ...prev, [d.id]: open }));
              if (!open) {
                limpiarCuentaAtras(d.id);
              }

              if (!open && esFinal) {
                setDescargas((prev) => {
                  if (!prev[d.id]) return prev;
                  const { [d.id]: _omitida, ...resto } = prev;
                  return resto;
                });
              }
            }}
            duration={esFinal ? 6000 : 1000000}
            className="data-[state=open]:sm:slide-in-from-top-full"
          >
            <div className="grid w-full gap-2">
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1">
                <ToastTitle className="col-span-2 truncate">{d.nombre}</ToastTitle>

                <ToastDescription className="text-xs text-muted-foreground">
                  {textoEstado(d.estado)}
                  {porcentaje !== null ? ` • ${porcentaje}%` : ''}
                  {d.totalBytes > 0
                    ? ` • ${formatearBytes(d.recibidosBytes)} / ${formatearBytes(d.totalBytes)}`
                    : ''}
                  {typeof segundosRestantes === 'number' ? ` • Cierra en ${segundosRestantes}s` : ''}
                </ToastDescription>

                <div className="flex shrink-0 items-center gap-1">
                  {d.rutaDestino ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Mostrar en carpeta"
                      onClick={() => ipc.send('descarga:mostrarEnCarpeta', { rutaDestino: d.rutaDestino })}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  ) : null}

                  {puedeCancelar ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Cancelar"
                      onClick={() => ipc.send('descarga:cancelar', { id: d.id })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>

              {mostrarProgreso ? <Progress value={porcentaje ?? undefined} /> : null}
            </div>
            <ToastClose />
          </Toast>
        );
      })}

      <ToastViewport
        className="top-4 right-4 left-auto bottom-auto w-[360px] max-w-[360px] flex-col gap-2 sm:top-4 sm:right-4 sm:left-auto sm:bottom-auto sm:w-[360px] sm:flex-col md:max-w-[360px]"
      />
    </ToastProvider>
  );
}
