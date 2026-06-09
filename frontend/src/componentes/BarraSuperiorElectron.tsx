import { useEffect, useMemo, useRef, useState } from 'react';
import { useTema } from '../contextos/tema-contexto';
import { alternarMaximizarVentana, cerrarVentana, minimizarVentana, obtenerIpcRenderer, ventanaEstaEnPantallaCompleta, ventanaEstaMaximizada } from '../lib/electron';
import { Minus, Square, X } from 'lucide-react';

export function BarraSuperiorElectron() {
  const { tema, tema_personalizado } = useTema();
  const ref = useRef<HTMLDivElement | null>(null);
  const [maximizada, setMaximizada] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const habilitado = useMemo(() => {
    return !!obtenerIpcRenderer();
  }, []);

  useEffect(() => {
    if (!habilitado) return;
    void (async () => {
      setMaximizada(await ventanaEstaMaximizada());
      setFullscreen(await ventanaEstaEnPantallaCompleta());
    })();
  }, [habilitado, tema, tema_personalizado]);

  useEffect(() => {
    if (!habilitado) return;

    const ipc = obtenerIpcRenderer() as any;
    const handler = (_event: any, valor: boolean) => setMaximizada(!!valor);
    try {
      ipc?.on?.('ui:window:maximized', handler);
      return () => ipc?.removeListener?.('ui:window:maximized', handler);
    } catch {
      return;
    }
  }, [habilitado]);

  useEffect(() => {
    if (!habilitado) return;

    const ipc = obtenerIpcRenderer() as any;
    const handler = (_event: any, valor: boolean) => setFullscreen(!!valor);
    try {
      ipc?.on?.('ui:window:fullscreen', handler);
      return () => ipc?.removeListener?.('ui:window:fullscreen', handler);
    } catch {
      return;
    }
  }, [habilitado]);

  useEffect(() => {
    if (!habilitado) return;
    const root = window.document.documentElement;
    root.classList.toggle('electron-fullscreen', fullscreen);
  }, [habilitado, fullscreen]);

  if (!habilitado) return null;

  if (fullscreen) return null;
  const iconHref = window.location.protocol === 'file:'
    ? './app_0d3nt_ico_logo.svg'
    : '/app_0d3nt_ico_logo.svg';

  return (
    <div
      ref={ref}
      className="h-7 flex items-center justify-between border-b border-border bg-background text-foreground select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
      onDoubleClick={() => {
        void alternarMaximizarVentana();
      }}
    >
      <div className="flex items-center gap-2 px-2" style={{ WebkitAppRegion: 'drag' } as any}>
        <img src={iconHref} alt="0d3nt" className="h-4 w-4" draggable={false} />
        <span className="text-xs font-medium">0d3ntApp</span>
      </div>

      <div className="flex items-stretch" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          type="button"
          className="h-7 w-10 flex items-center justify-center hover:bg-secondary/60 transition-colors"
          onClick={() => void minimizarVentana()}
          aria-label="Minimizar"
          title="Minimizar"
        >
          <Minus className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="h-7 w-10 flex items-center justify-center hover:bg-secondary/60 transition-colors"
          onClick={() => void alternarMaximizarVentana()}
          aria-label={maximizada ? 'Restaurar' : 'Maximizar'}
          title={maximizada ? 'Restaurar' : 'Maximizar'}
        >
          <Square className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          className="h-7 w-12 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
          onClick={() => void cerrarVentana()}
          aria-label="Cerrar"
          title="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
