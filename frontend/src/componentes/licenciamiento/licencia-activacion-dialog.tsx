import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/componentes/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/componentes/ui/dialog';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/componentes/ui/tooltip';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { licenciamientoPublicoApi } from '@/lib/api';
import { obtenerHwidCliente } from '@/lib/electron';
import { obtenerMensajeError } from '@/lib/utilidades';

type EstadoSolicitud = 'PENDIENTE' | 'ACTIVA' | 'RECHAZADA' | 'REVOCADA' | string;

type SolicitudCache = {
  id_licencia: string;
  solicitado_en: string;
};

function storageKeySolicitud(hwid: string) {
  return `vl_solicitud_licencia_v1:${hwid}`;
}

type SolicitudesDiariasCache = {
  fecha: string; 
  conteo: number;
};

function storageKeySolicitudesDiarias(hwid: string) {
  return `vl_solicitud_licencia_v1:count:${hwid}`;
}

type FallasValidacionDiariasCache = {
  fecha: string; 
  conteo: number;
};

function storageKeyFallasValidacionDiarias(hwid: string) {
  return `vl_activacion_licencia_v1:fallas:${hwid}`;
}

function obtenerFechaHoyISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

type Props = {
  open: boolean;
  onActivar: (codigo32: string) => Promise<void>;
};

export function LicenciaActivacionDialogObligatorio({ open, onActivar }: Props) {
  const [codigo32, setCodigo32] = useState('');
  const [activando, setActivando] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  const [consultandoSolicitud, setConsultandoSolicitud] = useState(false);
  const [solicitudId, setSolicitudId] = useState<string | null>(null);
  const [solicitudEstado, setSolicitudEstado] = useState<EstadoSolicitud | null>(null);
  const [error, setError] = useState('');

  const [solicitudesHoy, setSolicitudesHoy] = useState(0);
  const [fallasHoy, setFallasHoy] = useState(0);

  const maxSolicitudesPorDia = 6;
  const maxFallasValidacion = 6;

  const leerConteoDiario = (raw: string | null, hoy: string) => {
    if (!raw) return 0;
    try {
      const parsed = JSON.parse(raw) as { fecha?: string; conteo?: unknown };
      if (String(parsed?.fecha || '') !== hoy) return 0;
      const n = Number(parsed?.conteo ?? 0);
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    } catch {
      return 0;
    }
  };

  const esFallaPorCodigoInvalido = (mensaje: string) => {
    const m = String(mensaje || '').toLowerCase();
    return (
      m.includes('licencia inválida') ||
      m.includes('licencia invalida') ||
      m.includes('licencia no encontrada')
    );
  };

  useEffect(() => {
    if (!open) return;
    setCodigo32('');
    setError('');
    setActivando(false);
    setSolicitando(false);
    setConsultandoSolicitud(false);
    setSolicitudEstado(null);
    setSolicitudesHoy(0);
    setFallasHoy(0);

    (async () => {
      try {
        const hwid = await obtenerHwidCliente();
        if (!hwid) throw new Error('No se pudo obtener el HWID del dispositivo (Electron).');

        const hoy = obtenerFechaHoyISO();
        setSolicitudesHoy(leerConteoDiario(localStorage.getItem(storageKeySolicitudesDiarias(hwid)), hoy));
        setFallasHoy(leerConteoDiario(localStorage.getItem(storageKeyFallasValidacionDiarias(hwid)), hoy));

        const raw = localStorage.getItem(storageKeySolicitud(hwid));
        if (!raw) {
          setSolicitudId(null);
          return;
        }

        let parsed: SolicitudCache | null = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = null;
        }
        const id = String(parsed?.id_licencia || '').trim();
        if (!id) {
          localStorage.removeItem(storageKeySolicitud(hwid));
          setSolicitudId(null);
          return;
        }

        setSolicitudId(id);
        setConsultandoSolicitud(true);
        const estado = await licenciamientoPublicoApi.obtenerEstadoSolicitudLicenciaVl({
          hwid_cliente: hwid,
          id_licencia: id,
        });
        const est = String(estado?.estado || '').trim() as EstadoSolicitud;
        setSolicitudEstado(est || null);

        if (est === 'RECHAZADA' || est === 'REVOCADA' || est === 'ELIMINADA') {
          localStorage.removeItem(storageKeySolicitud(hwid));
          setSolicitudId(null);
        }
      } catch (err: any) {
        setError(obtenerMensajeError(err));
      } finally {
        setConsultandoSolicitud(false);
      }
    })();
  }, [open]);

  const puedeActivar = useMemo(() => {
    return !!solicitudId && String(solicitudEstado || '').toUpperCase() === 'ACTIVA';
  }, [solicitudEstado, solicitudId]);

  const limiteSolicitudesAlcanzado = useMemo(() => {
    return solicitudesHoy >= maxSolicitudesPorDia;
  }, [maxSolicitudesPorDia, solicitudesHoy]);

  const limiteFallasAlcanzado = useMemo(() => {
    return fallasHoy >= maxFallasValidacion;
  }, [fallasHoy, maxFallasValidacion]);

  const disabled = useMemo(() => {
    if (activando) return true;
    if (limiteFallasAlcanzado) return true;
    return !codigo32.trim();
  }, [activando, codigo32, limiteFallasAlcanzado]);

  const solicitar = async () => {
    setError('');
    setSolicitando(true);
    try {
      const hwid = await obtenerHwidCliente();
      if (!hwid) throw new Error('No se pudo obtener el HWID del dispositivo (Electron).');

      const hoy = obtenerFechaHoyISO();
      const conteoActual = leerConteoDiario(localStorage.getItem(storageKeySolicitudesDiarias(hwid)), hoy);
      if (conteoActual >= maxSolicitudesPorDia) {
        throw new Error('Límite diario alcanzado: máximo 6 solicitudes por día. Intenta mañana.');
      }

      const resp = await licenciamientoPublicoApi.solicitarLicenciaVl({
        hwid_cliente: hwid,
        origen: '0d3nt-electron',
        app_version: '0d3nt',
        plataforma: (() => {
          try {
            return navigator.platform || 'web';
          } catch {
            return 'web';
          }
        })(),
      });
      const id = String(resp?.id_licencia || '').trim();
      if (!id) throw new Error('Respuesta de solicitud inválida (falta id_licencia).');

      localStorage.setItem(
        storageKeySolicitud(hwid),
        JSON.stringify({ id_licencia: id, solicitado_en: new Date().toISOString() } satisfies SolicitudCache),
      );

      setSolicitudId(id);
      setSolicitudEstado((String(resp?.estado || '').trim() as EstadoSolicitud) || 'INACTIVA');

      try {
        localStorage.setItem(
          storageKeySolicitudesDiarias(hwid),
          JSON.stringify({ fecha: hoy, conteo: conteoActual + 1 } satisfies SolicitudesDiariasCache),
        );
        setSolicitudesHoy(conteoActual + 1);
      } catch {
      }
    } catch (err: any) {
      setError(obtenerMensajeError(err));
    } finally {
      setSolicitando(false);
    }
  };

  const activar = async () => {
    setError('');
    setActivando(true);
    try {
      if (limiteFallasAlcanzado) {
        throw new Error('Límite de intentos alcanzado: máximo 6 fallas. Intenta más tarde.');
      }

      await onActivar(codigo32.trim());

      try {
        const hwid = await obtenerHwidCliente();
        if (hwid) {
          localStorage.removeItem(storageKeyFallasValidacionDiarias(hwid));
          setFallasHoy(0);
        }
      } catch {
      }

      try {
        const hwid = await obtenerHwidCliente();
        if (hwid) localStorage.removeItem(storageKeySolicitud(hwid));
      } catch {
      }
    } catch (err: any) {
      const mensaje = String(err?.message || err || 'No se pudo activar la licencia.');
      setError(mensaje);

      if (esFallaPorCodigoInvalido(mensaje)) {
        try {
          const hwid = await obtenerHwidCliente();
          if (hwid) {
            const hoy = obtenerFechaHoyISO();
            const actual = leerConteoDiario(localStorage.getItem(storageKeyFallasValidacionDiarias(hwid)), hoy);
            const nuevo = actual + 1;
            localStorage.setItem(
              storageKeyFallasValidacionDiarias(hwid),
              JSON.stringify({ fecha: hoy, conteo: nuevo } satisfies FallasValidacionDiariasCache),
            );
            setFallasHoy(nuevo);
          }
        } catch {
        }
      }
    } finally {
      setActivando(false);
    }
  };

  return (
    <Dialog open={open}>
      <TooltipProvider delayDuration={0}>
        <DialogContent
          className="max-w-xl"
          hideCloseButton
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <BadgeCheck className="h-6 w-6" />
                Activar licencia
              </DialogTitle>
            </div>

            <DialogDescription>
              Si tu licencia ya fue aceptada (<strong>ACTIVA</strong>), pega tu código aquí y actívala.
              {String(solicitudEstado || '').toUpperCase() === 'INACTIVA'
                ? ' Si está INACTIVA, espera la aprobación en VL0d3ntApp.'
                : null}
            </DialogDescription>
          </DialogHeader>

        {error ? (
          <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo32">Código (32 caracteres)</Label>
              <Input
                id="codigo32"
                value={codigo32}
                onChange={(e) => setCodigo32(e.target.value)}
                placeholder="abc123def456ghi789jkl012mno345p"
                disabled={activando}
                className="h-11 bg-secondary/50"
                autoComplete="off"
              />
            </div>

            {!solicitudId ? (
              <div className="rounded-lg border bg-secondary/30 p-3 text-sm">
                Si aún no has solicitado una licencia, haz clic en <strong>Solicitar licencia</strong>.
                Si ya tienes el código, puedes activarlo directamente.
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Solicitud registrada{solicitudEstado ? ` (${solicitudEstado})` : ''}.
              </div>
            )}

            {solicitudEstado === 'RECHAZADA' || solicitudEstado === 'REVOCADA' ? (
              <div className="text-sm text-muted-foreground">
                La solicitud anterior fue marcada como inválida. Debes crear una nueva solicitud.
              </div>
            ) : null}

            {!!solicitudId && !puedeActivar ? (
              <div className="text-sm text-muted-foreground">
                Si el estado aún no es <strong>ACTIVA</strong>, la activación probablemente fallará hasta que sea aprobada.
              </div>
            ) : null}

            <div className="text-sm text-muted-foreground">
              La licencia se guarda como <span className="font-mono">licencia.odent</span> en el directorio de usuario de la app.
            </div>
          </div>

          <DialogFooter>
            {!solicitudId ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={solicitar}
                    disabled={solicitando || consultandoSolicitud || limiteSolicitudesAlcanzado}
                  >
                    {(solicitando || consultandoSolicitud) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Solicitar licencia
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>
                    Solicitudes hoy: <strong>{solicitudesHoy}</strong>/{maxSolicitudesPorDia}.
                  </p>
                  <p>Este límite solo afecta el botón de solicitar.</p>
                </TooltipContent>
              </Tooltip>
            ) : solicitudEstado !== 'ACTIVA' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={solicitar}
                    disabled={solicitando || consultandoSolicitud || activando || limiteSolicitudesAlcanzado}
                  >
                    {(solicitando || consultandoSolicitud) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Volver a solicitar
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>
                    Solicitudes hoy: <strong>{solicitudesHoy}</strong>/{maxSolicitudesPorDia}.
                  </p>
                  <p>Este límite solo afecta el botón de solicitar.</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span />
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={activar} disabled={disabled} className="min-w-56">
                  {activando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Activar y guardar licencia
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>
                  Fallas por código inválido hoy: <strong>{fallasHoy}</strong>/{maxFallasValidacion}.
                </p>
                <p>Solo aumenta si el servidor responde “Licencia inválida”.</p>
              </TooltipContent>
            </Tooltip>
          </DialogFooter>
        </DialogContent>
      </TooltipProvider>
    </Dialog>
  );
}
