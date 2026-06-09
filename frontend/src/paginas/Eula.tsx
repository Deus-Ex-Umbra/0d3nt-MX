import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';
import { licenciamientoPublicoApi } from '@/lib/api';
import { obtenerMensajeError } from '@/lib/utilidades';
import { obtenerHwidCliente } from '@/lib/electron';
import { EULA_VERSION, EULA_TEXTO } from '@/lib/eula-texto';

async function sha256Hex(texto: string): Promise<string> {
  const data = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function Eula() {
  const navegar = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [aceptando, setAceptando] = useState(false);
  const [error, setError] = useState('');

  const plataforma = useMemo(() => {
    try {
      return navigator.platform || 'web';
    } catch {
      return 'web';
    }
  }, []);

  const hostname = useMemo(() => {
    try {
      return window.location.hostname || 'local';
    } catch {
      return 'local';
    }
  }, []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const hwid = await obtenerHwidCliente();
        if (!hwid) throw new Error('No se pudo obtener el HWID del dispositivo (Electron).');

        const estado = await licenciamientoPublicoApi.obtenerEstadoInstalacion({ hwid_cliente: hwid });
        if (cancelado) return;
        if (estado.eula_aceptado) {
          navegar('/licencia', { replace: true });
          return;
        }
      } catch {
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [navegar]);

  const aceptar = async () => {
    setError('');
    setAceptando(true);
    try {
      const hwid = await obtenerHwidCliente();
      if (!hwid) throw new Error('No se pudo obtener el HWID del dispositivo (Electron).');

      const hash = await sha256Hex(EULA_VERSION);
      localStorage.setItem('eula_version', EULA_VERSION);
      localStorage.setItem('eula_hash', hash);

      await licenciamientoPublicoApi.aceptarEula({
        hwid_cliente: hwid,
        eula_version: EULA_VERSION,
        hash_aceptacion_local: hash,
        plataforma,
        hostname,
        app_version: '0d3nt',
        dispositivo: {
          userAgent: navigator.userAgent,
        },
      });

      navegar('/licencia', { replace: true });
    } catch (err: any) {
      setError(obtenerMensajeError(err));
    } finally {
      setAceptando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-2 border-border shadow-2xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <ShieldCheck className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Acuerdo de licencia (EULA)</CardTitle>
            <CardDescription className="text-base">
              Debes aceptar el EULA para usar 0d3ntApp.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="rounded-lg border border-border bg-secondary/30 p-6 text-sm text-foreground space-y-4 max-h-[50vh] overflow-y-auto eula-content text-left shadow-inner">
              <div dangerouslySetInnerHTML={{ __html: EULA_TEXTO }} />
              <p className="border-t border-border mt-6 pt-4 text-center text-muted-foreground font-mono">
                Revisión EULA: {EULA_VERSION}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button onClick={aceptar} disabled={aceptando} className="min-w-40">
              {aceptando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aceptar y continuar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
