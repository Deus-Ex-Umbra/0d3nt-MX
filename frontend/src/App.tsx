import { Fragment, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProveedorAutenticacion, useAutenticacion } from './contextos/autenticacion-contexto';
import { ProveedorTema } from './contextos/tema-contexto';
import { ProveedorMenu } from './contextos/menu-contexto';
import { ProveedorClinica } from './contextos/clinica-contexto';
import { ProveedorEdicionImagenes } from './contextos/edicion-imagenes-contexto';
import { ProveedorTutorial } from './contextos/tutoriales';
import { ProveedorInventariosUI } from './contextos/inventarios-contexto';
import { ProveedorInicioUI } from './contextos/inicio-contexto';
import { ProveedorTratamientosUI } from './contextos/tratamientos-contexto';
import { ProveedorFinanzasUI } from './contextos/finanzas-contexto';
import { ProveedorConfiguracionUI } from './contextos/configuracion-contexto';
import InicioSesion from './paginas/InicioSesion';
import Registro from './paginas/Registro';
import Inicio from './paginas/Inicio';
import Pacientes from './paginas/Pacientes';
import Agenda from './paginas/Agenda';
import EdicionImagenes from './paginas/EdicionImagenes';
import Tratamientos from './paginas/Tratamientos';
import Finanzas from './paginas/Finanzas';
import Inventarios from './paginas/Inventarios';
import Configuracion from './paginas/Configuracion';
import { VistaMovil } from './componentes/VistaMovil';
import { Loader2 } from 'lucide-react';
import { useResponsive } from './hooks/use-responsive';
import { Toaster } from './componentes/ui/toaster';
import { DescargasElectron } from './componentes/DescargasElectron';
import { BarraSuperiorElectron } from './componentes/BarraSuperiorElectron';
import { obtenerIpcRenderer } from './lib/electron';
import { licenciamientoPublicoApi } from './lib/api';
import { guardarLicenciaLocal, obtenerEstadoLicenciaLocal, obtenerHwidCliente } from './lib/electron';
import { obtenerMensajeError } from './lib/utilidades';
import { useToast } from './hooks/use-toast';
import { EulaDialogObligatorio } from './componentes/licenciamiento/eula-dialog';
import { LlaveComunicacionDialogObligatorio } from './componentes/licenciamiento/llave-comunicacion-dialog';
import { LicenciaActivacionDialogObligatorio } from './componentes/licenciamiento/licencia-activacion-dialog';
import { EULA_VERSION } from './lib/eula-texto';
import { BootstrapScreen, useBootstrapGate } from './componentes/BootstrapScreen';

async function sha256Hex(texto: string): Promise<string> {
  const data = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function obtenerEulaHashLocal(): Promise<string> {
  const existente = localStorage.getItem('eula_hash') || '';
  if (existente) return existente;
  const hash = await sha256Hex(EULA_VERSION);
  localStorage.setItem('eula_version', EULA_VERSION);
  localStorage.setItem('eula_hash', hash);
  return hash;
}

function GateLicenciamiento({ children }: { children?: React.ReactNode }) {
  const { cargando } = useAutenticacion();
  const { toast } = useToast();
  const [validando, setValidando] = useState(true);
  const [estado, setEstado] = useState<
    | null
    | {
      hwid: string;
      eula_aceptado: boolean;
      eula_aceptado_en: string | null;
      eula_version: string | null;
      credencial_configurada: boolean;
      credencial_valida: boolean;
      credencial_actualizado_en: string | null;
      credencial_validado_en: string | null;
      motivo: string | null;
    }
  >(null);
  const [estadoLicenciaLocal, setEstadoLicenciaLocal] = useState<
    | null
    | { disponible: false; motivo?: string }
    | { disponible: true; ruta: string }
  >(null);

  const [errorEula, setErrorEula] = useState('');
  const [aceptandoEula, setAceptandoEula] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let timer: number | null = null;

    const intentar = async () => {
      setValidando(true);
      try {
        if (import.meta.env.VITE_LICENCIABLE === 'false') {
          setEstadoLicenciaLocal({ disponible: true, ruta: 'bypassed' });
          setEstado({
            hwid: '',
            eula_aceptado: true,
            eula_aceptado_en: null,
            eula_version: null,
            credencial_configurada: true,
            credencial_valida: true,
            credencial_actualizado_en: null,
            credencial_validado_en: null,
            motivo: null,
          });
          setValidando(false);
          return;
        }

        const licenciaLocal = await obtenerEstadoLicenciaLocal();
        if (cancelado) return;
        setEstadoLicenciaLocal(licenciaLocal);

        if (licenciaLocal.disponible) {
          setEstado({
            hwid: '',
            eula_aceptado: true,
            eula_aceptado_en: null,
            eula_version: null,
            credencial_configurada: true,
            credencial_valida: true,
            credencial_actualizado_en: null,
            credencial_validado_en: null,
            motivo: null,
          });
          setValidando(false);
          return;
        }

        const hwid = await obtenerHwidCliente();
        if (!hwid) throw new Error('No se pudo obtener el HWID del dispositivo (Electron).');
        const estadoInstalacion = await licenciamientoPublicoApi.obtenerEstadoInstalacion({ hwid_cliente: hwid });
        if (cancelado) return;
        setEstado(estadoInstalacion);
        setValidando(false);
      } catch {
        if (cancelado) return;
        timer = window.setTimeout(intentar, 800);
      }
    };

    intentar();

    return () => {
      cancelado = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [cargando]);

  useEffect(() => {
    let cancelado = false;

    const onLlaveInvalida = () => {
      (async () => {
        try {
          const hwid = await obtenerHwidCliente();
          if (!hwid) return;
          const estadoInstalacion = await licenciamientoPublicoApi.obtenerEstadoInstalacion({
            hwid_cliente: hwid,
          });
          if (!cancelado) setEstado(estadoInstalacion);
        } catch {
        }
      })();
    };

    window.addEventListener('licenciamiento:llave-invalida', onLlaveInvalida as any);
    return () => {
      cancelado = true;
      window.removeEventListener('licenciamiento:llave-invalida', onLlaveInvalida as any);
    };
  }, []);

  const necesitaEula = useMemo(() => {
    if (!estado) return false;
    return !estado.eula_aceptado;
  }, [estado]);

  const necesitaLlave = useMemo(() => {
    if (!estado) return false;
    return estado.eula_aceptado && !estado.credencial_valida;
  }, [estado]);

  const necesitaLicencia = useMemo(() => {
    if (!estadoLicenciaLocal) return false;
    if (necesitaEula || necesitaLlave) return false;
    return estadoLicenciaLocal.disponible === false;
  }, [estadoLicenciaLocal, necesitaEula, necesitaLlave]);


  const aceptarEula = async () => {
    setErrorEula('');
    setAceptandoEula(true);
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
        plataforma: (() => {
          try {
            return navigator.platform || 'web';
          } catch {
            return 'web';
          }
        })(),
        hostname: (() => {
          try {
            return window.location.hostname || 'local';
          } catch {
            return 'local';
          }
        })(),
        app_version: '0d3nt',
        dispositivo: {
          userAgent: navigator.userAgent,
        },
      });

      const estadoInstalacion = await licenciamientoPublicoApi.obtenerEstadoInstalacion({
        hwid_cliente: hwid,
      });
      setEstado(estadoInstalacion);
    } catch (err: any) {
      setErrorEula(obtenerMensajeError(err));
    } finally {
      setAceptandoEula(false);
    }
  };

  const guardarLlave = async (llave: string) => {
    const hwid = await obtenerHwidCliente();
    if (!hwid) throw new Error('No se pudo obtener el HWID del dispositivo (Electron).');

    const resp = await licenciamientoPublicoApi.guardarCredencial({
      hwid_cliente: hwid,
      token: llave,
    });

    if (!resp.valida) {
      throw new Error(resp.motivo || 'Llave inválida');
    }

    toast({
      title: 'Llave validada',
      description: 'La llave de comunicación fue validada correctamente.',
    });

    const estadoInstalacion = await licenciamientoPublicoApi.obtenerEstadoInstalacion({
      hwid_cliente: hwid,
    });
    setEstado(estadoInstalacion);
  };

  const activarLicencia = async (codigo32: string) => {
    try {
      const hwid = await obtenerHwidCliente();
      if (!hwid) throw new Error('No se pudo obtener el HWID del dispositivo (Electron).');

      const eulaHash = await obtenerEulaHashLocal();
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

      const licenciaLocal = await obtenerEstadoLicenciaLocal();
      setEstadoLicenciaLocal(licenciaLocal);

      toast({
        title: 'Licencia validada',
        description: 'La licencia fue guardada y validada correctamente.',
      });
    } catch (err: any) {
      throw new Error(obtenerMensajeError(err));
    }
  };

  if (cargando || validando) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Validando licencia...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children ? <>{children}</> : <Outlet />}

      <EulaDialogObligatorio
        open={necesitaEula}
        cargando={aceptandoEula}
        error={errorEula}
        onAceptar={aceptarEula}
      />

      <LlaveComunicacionDialogObligatorio
        open={!necesitaEula && necesitaLlave}
        motivo={estado?.motivo}
        onGuardar={guardarLlave}
      />

      <LicenciaActivacionDialogObligatorio
        open={!necesitaEula && !necesitaLlave && necesitaLicencia}
        onActivar={activarLicencia}
      />
    </>
  );
}

function GateBootstrap({ children }: { children?: React.ReactNode }) {
  const ipc = obtenerIpcRenderer();
  const esElectron = !!ipc?.invoke;
  const { estado, listo } = useBootstrapGate();

  if (!esElectron) return <>{children}</>;
  if (listo) return <>{children}</>;
  if (!estado) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6">
        <div className="text-sm text-muted-foreground">Iniciando…</div>
      </div>
    );
  }

  return <BootstrapScreen estado={estado} />;
}

function RutaProtegida({ children }: { children?: React.ReactNode }) {
  const { usuario, cargando } = useAutenticacion();

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

  if (!usuario) {
    return <Navigate to="/inicio-sesion" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

function RutaPublica({ children }: { children: React.ReactNode }) {
  const { usuario, cargando } = useAutenticacion();

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

  if (usuario) {
    return <Navigate to="/inicio" replace />;
  }

  return <>{children}</>;
}

function InicioResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Inicio />;
}

function PacientesResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Pacientes />;
}

function AgendaResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Agenda />;
}

function EdicionImagenesResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <EdicionImagenes />;
}

function TratamientosResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Tratamientos />;
}

function FinanzasResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Finanzas />;
}

function InventariosResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Inventarios />;
}

function ConfiguracionResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Configuracion />;
}

function AppSesion() {
  const { usuario } = useAutenticacion();
  const sessionKey = usuario ? `usuario:${usuario.id}` : 'anon';

  useEffect(() => {
    const esElectron = !!obtenerIpcRenderer();
    const root = window.document.documentElement;
    root.classList.toggle('electron-app', esElectron);
    return () => {
      root.classList.remove('electron-app');
    };
  }, []);
  const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

  return (
    <Fragment key={sessionKey}>
      <ProveedorTema>
        <ProveedorClinica>
          <ProveedorMenu>
            <ProveedorEdicionImagenes>
              <Router>
                <BarraSuperiorElectron />
                <ProveedorInventariosUI>
                  <ProveedorInicioUI>
                    <ProveedorTratamientosUI>
                      <ProveedorFinanzasUI>
                        <ProveedorConfiguracionUI>
                          <ProveedorTutorial>
                            <Routes>
                              <Route element={<GateLicenciamiento />}>
                                <Route path="/eula" element={<Navigate to="/inicio-sesion" replace />} />
                                <Route path="/licencia" element={<Navigate to="/inicio-sesion" replace />} />
                                <Route
                                  path="/inicio-sesion"
                                  element={
                                    <RutaPublica>
                                      <InicioSesion />
                                    </RutaPublica>
                                  }
                                />
                                <Route
                                  path="/registro"
                                  element={
                                    <RutaPublica>
                                      <Registro />
                                    </RutaPublica>
                                  }
                                />
                                <Route element={<RutaProtegida />}>
                                  <Route path="/inicio" element={<InicioResponsive />} />
                                  <Route path="/pacientes" element={<PacientesResponsive />} />
                                  <Route path="/agenda" element={<AgendaResponsive />} />
                                  <Route path="/edicion-imagenes" element={<EdicionImagenesResponsive />} />
                                  <Route path="/tratamientos" element={<TratamientosResponsive />} />
                                  <Route path="/finanzas" element={<FinanzasResponsive />} />
                                  <Route path="/inventarios" element={<InventariosResponsive />} />
                                  <Route path="/configuracion" element={<ConfiguracionResponsive />} />
                                </Route>
                                <Route path="/" element={<Navigate to={usuario ? '/inicio' : '/inicio-sesion'} replace />} />
                              </Route>
                            </Routes>
                          </ProveedorTutorial>
                        </ProveedorConfiguracionUI>
                      </ProveedorFinanzasUI>
                    </ProveedorTratamientosUI>
                  </ProveedorInicioUI>
                </ProveedorInventariosUI>
              </Router>
              <Toaster />
              <DescargasElectron />
            </ProveedorEdicionImagenes>
          </ProveedorMenu>
        </ProveedorClinica>
      </ProveedorTema>
    </Fragment>
  );
}

function App() {
  return (
    <GateBootstrap>
      <ProveedorAutenticacion>
        <AppSesion />
      </ProveedorAutenticacion>
    </GateBootstrap>
  );
}

export default App;
