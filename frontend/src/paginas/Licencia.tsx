import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Loader2, KeyRound, BadgeCheck, ShieldCheck } from 'lucide-react';
import { licenciamientoPublicoApi } from '@/lib/api';
import { obtenerMensajeError } from '@/lib/utilidades';
import { guardarLicenciaLocal, obtenerEstadoLicenciaLocal, obtenerHwidCliente } from '@/lib/electron';

export default function Licencia() {
  const navegar = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [token, setToken] = useState('');
  const [guardandoCred, setGuardandoCred] = useState(false);
  const [paso, setPaso] = useState<1 | 2>(1);

  const [codigo32, setCodigo32] = useState('');
  const [activando, setActivando] = useState(false);

  const eulaHash = useMemo(() => localStorage.getItem('eula_hash') || '', []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const hwid = await obtenerHwidCliente();
        if (!hwid) throw new Error('No se pudo obtener el HWID del dispositivo (Electron).');

        const estado = await licenciamientoPublicoApi.obtenerEstadoInstalacion({ hwid_cliente: hwid });
        if (!estado.eula_aceptado) {
          navegar('/eula', { replace: true });
          return;
        }

        if (estado.credencial_valida) {
          navegar('/inicio-sesion', { replace: true });
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

  const guardarCredencial = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setGuardandoCred(true);
    try {
      const hwid = await obtenerHwidCliente();
      if (!hwid) throw new Error('No se pudo obtener el HWID del dispositivo (Electron).');

      const tokenPlano = token.trim();
      if (!tokenPlano) throw new Error('Ingresa la llave de acceso.');

      const resp = await licenciamientoPublicoApi.guardarCredencial({
        hwid_cliente: hwid,
        token: tokenPlano,
      });

      if (!resp.valida) {
        throw new Error(resp.motivo || 'Llave inválida');
      }

      setPaso(2);
      setToken('');
    } catch (err: any) {
      setError(obtenerMensajeError(err));
    } finally {
      setGuardandoCred(false);
    }
  };

  const activar = async () => {
    setError('');
    setActivando(true);
    try {
      const hwid = await obtenerHwidCliente();
      if (!hwid) throw new Error('No se pudo obtener el HWID del dispositivo (Electron).');
      if (!eulaHash) throw new Error('Falta hash de aceptación local del EULA.');
      const codigoNormalizado = String(codigo32 || '')
        .trim()
        .replace(/[\s-]+/g, '')
        .toLowerCase();

      const resp = await licenciamientoPublicoApi.activarLicenciaVl({
        codigo_32: codigoNormalizado,
        hwid_cliente: hwid,
        hash_aceptacion_local: eulaHash,
      });

      const paquete = resp?.paquete;
      const llavePublica = String(resp?.llave_publica || '').trim();
      if (!paquete?.llave_aes || !paquete?.c || !paquete?.t_auth || !paquete?.iv || !paquete?.s) {
        throw new Error('Respuesta de licencia inválida.');
      }

      const guardado = await guardarLicenciaLocal(paquete, {
        llave_publica_pem: llavePublica || undefined,
      });
      if (!guardado.ok) throw new Error(guardado.error);

      const estadoLocal = await obtenerEstadoLicenciaLocal();
      if (!estadoLocal.disponible) {
        throw new Error(estadoLocal.motivo || 'No se pudo validar la licencia localmente.');
      }
      navegar('/inicio-sesion', { replace: true });
    } catch (err: any) {
      setError(obtenerMensajeError(err));
    } finally {
      setActivando(false);
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
      <div className="w-full max-w-2xl space-y-4">
        <Card className="border-2 border-border shadow-2xl">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <KeyRound className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Activación por pasos</CardTitle>
                <CardDescription>
                  Paso {paso} de 2. Primero validamos tu llave de acceso; luego (opcional) descargas la licencia local.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Conexión segura</p>
                    <p className="text-sm text-muted-foreground">
                      La llave se envía por HTTPS y se valida contra VL0d3ntApp para habilitar la activación.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={guardarCredencial} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Llave de acceso</Label>
                  <Input
                    id="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Pega aquí tu llave"
                    required
                    disabled={guardandoCred || activando || paso !== 1}
                    className="h-11 bg-secondary/50"
                  />
                </div>

                {paso === 1 ? (
                  <Button type="submit" disabled={guardandoCred || activando || !token.trim()} className="min-w-56">
                    {guardandoCred && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Validar y continuar
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="button" className="min-w-56" onClick={() => navegar('/inicio-sesion', { replace: true })}>
                      Continuar al inicio de sesión
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-2xl">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <BadgeCheck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Activar licencia</CardTitle>
                <CardDescription>
                  (Opcional) Ingresa el código de 32 caracteres para descargar tu licencia local.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={codigo32}
                onChange={(e) => setCodigo32(e.target.value)}
                placeholder="abc123def456ghi789jkl012mno345p"
                disabled={guardandoCred || activando || paso !== 2}
                className="h-11 bg-secondary/50"
              />
            </div>

            <Button onClick={activar} disabled={paso !== 2 || !codigo32.trim() || activando || guardandoCred} className="min-w-56">
              {activando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Activar y guardar licencia
            </Button>
          </CardContent>

          <CardFooter className="text-sm text-muted-foreground">
            La licencia se guarda como <span className="font-mono">licencia.odent</span> en el directorio de usuario de la app.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
