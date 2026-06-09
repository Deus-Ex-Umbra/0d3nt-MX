import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Progress } from '@/componentes/ui/progress';
import { Button } from '@/componentes/ui/button';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { obtenerEstadoBootstrap, obtenerLogsBootstrap, suscribirBootstrapProgreso, type EstadoBootstrap } from '@/lib/electron';

function fmtStage(stage: string): string {
  const s = String(stage || '');
  if (!s) return 'Iniciando…';
  if (s === 'listo') return 'Listo';
  if (s.startsWith('postgres:')) return 'Base de datos';
  if (s.startsWith('backend:')) return 'Servidor';
  if (s === 'error') return 'Error';
  return s;
}

function fmtBool(v: unknown): string {
  if (v === true) return 'Sí';
  if (v === false) return 'No';
  return String(v ?? '');
}

function fmtFecha(ms: unknown): string {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return '';
  try {
    return new Date(n).toLocaleString();
  } catch {
    return '';
  }
}

function Fila({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-2 pr-3 text-sm text-muted-foreground align-top w-56">{k}</td>
      <td className="py-2 text-sm break-words">{v}</td>
    </tr>
  );
}

function TablaKVs({ filas }: { filas: Array<{ k: string; v: React.ReactNode }> }) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <tbody>
          {filas.map((f) => (
            <Fila key={f.k} k={f.k} v={f.v} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function etiquetaCheck(k: string): string {
  const mapa: Record<string, string> = {
    pgsqlUserExiste: 'Carpeta pgsql en AppData existe',
    pgsqlUserValido: 'PostgreSQL portable válido en AppData',
    pgsqlResourcesValido: 'PostgreSQL portable válido en resources',
    pgCtlExiste: 'pg_ctl.exe existe',
    dataDirExiste: 'Carpeta data existe',
    pgVersionExiste: 'PG_VERSION existe (base inicializada)',
  };
  return mapa[k] || k;
}

export function BootstrapScreen({ estado }: { estado: EstadoBootstrap }) {
  const [logs, setLogs] = useState<{ bootstrap: string; postgres: string } | null>(null);
  const [verLogs, setVerLogs] = useState(false);

  const progreso = useMemo(() => {
    const p = Number(estado?.progreso ?? 0);
    if (!Number.isFinite(p)) return 0;
    return Math.max(0, Math.min(100, p));
  }, [estado?.progreso]);

  const titulo = fmtStage(estado?.stage);
  const detalle = String(estado?.detail || '');
  const error = estado?.stage === 'error' ? String(estado?.error || 'Ocurrió un error') : '';

  const resumenFilas = useMemo(() => {
    return [
      { k: 'Estado', v: fmtStage(estado?.stage) },
      { k: 'Detalle', v: detalle || '—' },
      { k: '¿Listo?', v: fmtBool(estado?.ok) },
      { k: 'Código de error', v: estado?.stage === 'error' ? (String(estado?.error || '') || '—') : '—' },
      { k: 'Progreso', v: `${progreso}%` },
      { k: 'Puerto BD', v: String(estado?.dbPort ?? '—') },
      { k: 'Puerto servidor', v: String(estado?.backendPort ?? '—') },
      { k: 'Última actualización', v: fmtFecha(estado?.updatedAt) || '—' },
    ];
  }, [detalle, estado?.backendPort, estado?.dbPort, estado?.error, estado?.ok, estado?.stage, estado?.updatedAt, progreso]);

  const rutasFilas = useMemo(() => {
    const r = (estado as any)?.rutas || {};
    const rr = r?.rutas ? r.rutas : r;
    if (!rr || typeof rr !== 'object') return [];
    const keys = ['userData', 'pgsqlRootActual', 'pgsqlData', 'pgCtl', 'bootstrapLog', 'pgsqlUser', 'pgsqlResources'];
    return keys
      .filter((k) => rr?.[k])
      .map((k) => ({ k, v: String(rr[k]) }));
  }, [estado]);

  const checksFilas = useMemo(() => {
    const c = (estado as any)?.checks || {};
    const cc = c?.checks ? c.checks : c;
    if (!cc || typeof cc !== 'object') return [];
    return Object.keys(cc)
      .sort()
      .map((k) => ({ k: etiquetaCheck(k), v: fmtBool(cc[k]) }));
  }, [estado]);

  const recargarLogs = async () => {
    const l = await obtenerLogsBootstrap();
    setLogs(l);
  };

  useEffect(() => {
    if (!verLogs) return;
    recargarLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verLogs]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{titulo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{detalle}</div>
              <Progress value={progreso} />
              <div className="text-xs text-muted-foreground">{progreso}%</div>
            </div>

            {estado?.stage === 'error' ? (
              <div className="space-y-3">
                <div className="text-sm text-destructive">{error}</div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setVerLogs((v) => !v)}>
                    {verLogs ? 'Ocultar detalles' : 'Ver detalles'}
                  </Button>
                  {verLogs ? (
                    <Button variant="secondary" onClick={recargarLogs}>
                      Recargar
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setVerLogs((v) => !v)}>
                  {verLogs ? 'Ocultar detalles' : 'Ver detalles'}
                </Button>
                {verLogs ? (
                  <Button variant="secondary" onClick={recargarLogs}>
                    Recargar
                  </Button>
                ) : null}
              </div>
            )}

            {verLogs ? (
              <div className="space-y-3 mt-4">
                {estado?.stage === 'error' ? (
                  <div className="text-sm text-muted-foreground">
                    Para reportar este problema, comparte el “Resumen” y, si te lo piden, los “Logs”.
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">bootstrap.log</div>
                    <ScrollArea className="h-48 rounded-md border p-2">
                      <pre className="text-xs whitespace-pre-wrap break-words">{logs?.bootstrap || 'Sin logs'}</pre>
                    </ScrollArea>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">pgsql/data/logfile</div>
                    <ScrollArea className="h-48 rounded-md border p-2">
                      <pre className="text-xs whitespace-pre-wrap break-words">{logs?.postgres || 'Sin logs'}</pre>
                    </ScrollArea>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Resumen</div>
                  <TablaKVs filas={resumenFilas} />
                </div>

                {rutasFilas.length ? (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Rutas (para soporte)</div>
                    <TablaKVs filas={rutasFilas} />
                  </div>
                ) : null}

                {checksFilas.length ? (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Verificaciones</div>
                    <TablaKVs filas={checksFilas} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function useBootstrapGate() {
  const [estado, setEstado] = useState<EstadoBootstrap | null>(null);

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      const s = await obtenerEstadoBootstrap();
      if (!cancelado) setEstado(s);
    };
    cargar();
    const unsub = suscribirBootstrapProgreso((s) => setEstado(s));
    const t = window.setInterval(cargar, 1500);

    return () => {
      cancelado = true;
      try { unsub(); } catch { }
      window.clearInterval(t);
    };
  }, []);

  const listo = estado?.ok === true && estado?.stage === 'listo';
  return { estado, listo };
}
