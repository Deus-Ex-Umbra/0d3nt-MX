import { useState, useEffect, useRef } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { TituloAccionable } from '@/componentes/tutoriales/titulo-accionable';
import { TutorialModalWrapper } from '@/componentes/tutoriales/tutorial-modal-wrapper';
import { ProveedorTutorialesPagina } from '@/contextos/tutoriales';
import { IDS_ELEMENTOS_CONFIGURACION, TUTORIALES_CONFIGURACION } from '@/tutoriales/configuracion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { User, Palette, Camera, Loader2, Save, Plus, Sun, Moon, Droplet, Database, Lock, Eye, EyeOff, Leaf, Heart, Coffee, Layers, Grape, Flame, Stethoscope, Pill, Building2, ImageIcon, X, Settings2, Clock, History, DollarSign, RefreshCw, DownloadCloud, AlertTriangle, CheckCircle2, BrainCircuit, Globe, ArrowDown } from 'lucide-react';
import { useAutenticacion } from '@/contextos/autenticacion-contexto';
import { useTema, TemaPersonalizado } from '@/contextos/tema-contexto';
import { useClinica } from '@/contextos/clinica-contexto';
import { usuariosApi, catalogoApi, asistenteApi, finanzasApi, licenciamientoPublicoApi, migracionApi, EstadoMigracion } from '@/lib/api';
import { usarConexion } from '@/hooks/usar-conexion';
import { toast } from '@/hooks/use-toast';
import { GestionCatalogo } from '@/componentes/catalogo/gestion-catalogo';
import { ItemCatalogo } from '@/tipos';
import { GestionTamanosPapel } from '@/componentes/catalogo/gestion-tamanos-papel';
import { GestionSimbologia } from '@/componentes/catalogo/gestion-simbologia';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/componentes/ui/dialog';
import { Progress } from '@/componentes/ui/progress';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { Combobox } from '@/componentes/ui/combobox';
import { PAISES } from '@/lib/paises';
import { INFO_MONEDAS_PAIS } from '@/lib/monedas';
import { cn, obtenerMensajeError } from '@/lib/utilidades';
import { TabConfiguracion, useConfiguracionUI } from '@/contextos/configuracion-contexto';
import { obtenerHwidCliente } from '@/lib/electron';
import { Textarea } from '@/componentes/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import { LlaveComunicacionDialogObligatorio } from '@/componentes/licenciamiento/llave-comunicacion-dialog';
import { PhoneInput, formatearTelefonoCompleto } from '@/componentes/ui/phone-input';
import { MolarCuadrado } from '@/componentes/odontograma/dientes/Molar-cuadrado';
import { MolarCircular } from '@/componentes/odontograma/dientes/Molar-circular';

type DiaSemana = 'domingo' | 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado';
type IntervaloHorario = { inicio: string; fin: string };
type HorariosLaborales = Record<DiaSemana, IntervaloHorario[]>;

const DIAS_SEMANA: DiaSemana[] = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const HORARIOS_DEFAULT: IntervaloHorario[] = [
  { inicio: '08:00', fin: '12:00' },
  { inicio: '14:00', fin: '18:00' },
];

const crearHorariosDefault = (): HorariosLaborales => ({
  domingo: [...HORARIOS_DEFAULT],
  lunes: [...HORARIOS_DEFAULT],
  martes: [...HORARIOS_DEFAULT],
  miércoles: [...HORARIOS_DEFAULT],
  jueves: [...HORARIOS_DEFAULT],
  viernes: [...HORARIOS_DEFAULT],
  sábado: [...HORARIOS_DEFAULT],
});

const esHoraHHMM = (valor: string): boolean => /^\d{2}:\d{2}$/.test(valor);

const horaAMinutos = (hora: string): number => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

const ordenarIntervalos = (rangos: IntervaloHorario[]): IntervaloHorario[] =>
  [...rangos].sort((a, b) => horaAMinutos(a.inicio) - horaAMinutos(b.inicio));

const asegurarDiasHorarios = (horarios: HorariosLaborales): HorariosLaborales =>
  ({ ...crearHorariosDefault(), ...horarios } as HorariosLaborales);

const normalizarHorarios = (horarios: HorariosLaborales): HorariosLaborales => {
  const normalized = { ...crearHorariosDefault(), ...horarios } as HorariosLaborales;
  for (const dia of Object.keys(normalized) as DiaSemana[]) {
    normalized[dia] = ordenarIntervalos(
      (normalized[dia] || []).map(r => ({ inicio: (r?.inicio || '').trim(), fin: (r?.fin || '').trim() }))
    );
  }
  return normalized;
};

const parseHorariosLaborales = (raw: unknown): HorariosLaborales => {
  const fallback = crearHorariosDefault();
  if (!raw) return fallback;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return normalizarHorarios(parsed as HorariosLaborales);
    }
  } catch {
  }
  return fallback;
};

const validarHorariosLaborales = (horarios: HorariosLaborales): Record<DiaSemana, string | null> => {
  const errores: Record<DiaSemana, string | null> = {
    domingo: null,
    lunes: null,
    martes: null,
    miércoles: null,
    jueves: null,
    viernes: null,
    sábado: null,
  };

  for (const dia of Object.keys(errores) as DiaSemana[]) {
    const rangos = ordenarIntervalos(horarios[dia] || []);

    for (const r of rangos) {
      if (!esHoraHHMM(r.inicio) || !esHoraHHMM(r.fin)) {
        errores[dia] = 'Formato inválido (HH:MM)';
        break;
      }
      const inicio = horaAMinutos(r.inicio);
      const fin = horaAMinutos(r.fin);
      if (inicio >= fin) {
        errores[dia] = 'Inicio debe ser menor que fin';
        break;
      }
    }

    if (errores[dia]) continue;

    for (let i = 1; i < rangos.length; i++) {
      const prev = rangos[i - 1];
      const curr = rangos[i];
      if (horaAMinutos(prev.fin) > horaAMinutos(curr.inicio)) {
        errores[dia] = 'Hay solapamiento de horarios';
        break;
      }
    }
  }

  return errores;
};

export default function Configuracion() {
  const { usuario, actualizarUsuario } = useAutenticacion();
  const { en_linea } = usarConexion();
  const { tema, cambiarTema, tema_efectivo, tema_personalizado, actualizarTemaPersonalizado, aplicarColoresPersonalizados } = useTema();
  const { actualizarConfigClinica } = useClinica();
  const { tab_configuracion, setTabConfiguracion, esSeccionCatalogosAbierta, setSeccionCatalogosAbierta } = useConfiguracionUI();
  const [colores_personalizados, setColoresPersonalizados] = useState<TemaPersonalizado>({
    background: '#ffffff',
    foreground: '#0a0a0a',
    primary: '#3b82f6',
    secondary: '#f1f5f9',
    accent: '#e0f2fe',
    muted: '#f1f5f9',
    border: '#e2e8f0',
  });
  const [guardando_tema, setGuardandoTema] = useState(false);
  const [dialogo_personalizado_abierto, setDialogoPersonalizadoAbierto] = useState(false);
  const [dialogo_confirmar_salir, setDialogoConfirmarSalir] = useState(false);
  const [colores_temporales, setColoresTemporales] = useState<TemaPersonalizado | null>(null);
  const [tema_modificado, setTemaModificado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [perfil_inicial, setPerfilInicial] = useState({ nombre: '', pais: '', codigo_pais: '', moneda: '$' });
  const [avatar_perfil, setAvatarPerfil] = useState<string | null>(null);
  const [avatar_perfil_inicial, setAvatarPerfilInicial] = useState<string | null>(null);
  const [moneda_pais_iso_inicial, setMonedaPaisIsoInicial] = useState('');
  const [guardando_pais, setGuardandoPais] = useState(false);
  const [guardando_moneda, setGuardandoMoneda] = useState(false);
  const [guardando_modo_historico, setGuardandoModoHistorico] = useState(false);
  const [guardando_modelo_odontograma, setGuardandoModeloOdontograma] = useState(false);

  const [dialogo_caja_comentarios, setDialogoCajaComentarios] = useState(false);
  const [correo_comentarios, setCorreoComentarios] = useState('');
  const [codigo_pais_comentarios, setCodigoPaisComentarios] = useState('+591');
  const [numero_celular_comentarios, setNumeroCelularComentarios] = useState('');
  const [categoria_comentarios, setCategoriaComentarios] = useState<string>('Nueva Funcionalidad');
  const [contenido_comentarios, setContenidoComentarios] = useState('');
  const [error_comentarios, setErrorComentarios] = useState('');
  const [enviando_comentarios, setEnviandoComentarios] = useState(false);
  const [dialogo_llave_comentarios, setDialogoLlaveComentarios] = useState(false);
  const [motivo_llave_comentarios, setMotivoLlaveComentarios] = useState<string | null>(null);

  const obtenerCodigoPaisPorDefectoComentarios = () => {
    const desdeCodigoPais = String(usuario?.codigo_pais || '').trim();
    if (desdeCodigoPais) return desdeCodigoPais;

    const nombrePais = String(usuario?.pais || formulario_perfil.pais || '').trim();
    if (nombrePais) {
      const encontrado = PAISES.find((p) => String(p?.nombre || '').trim() === nombrePais);
      if (encontrado?.codigo) return encontrado.codigo;
    }

    return '+591';
  };

  const [formulario_perfil, setFormularioPerfil] = useState({
    nombre: '',
    pais: '',
    codigo_pais: '',
    moneda: '$',
  });

  const modo_edicion_historica = !!usuario?.modo_edicion_historica;

  const manejarCambiarModoEdicionHistorica = async (activar: boolean) => {
    if (!usuario) return;
    setGuardandoModoHistorico(true);
    try {
      const actualizado = await usuariosApi.actualizarPerfil({ modo_edicion_historica: activar });
      actualizarUsuario({ modo_edicion_historica: !!actualizado?.modo_edicion_historica });
      toast({
        title: 'Configuración actualizada',
        description: activar
          ? 'Edición histórica activada para esta sesión'
          : 'Edición histórica desactivada',
      });
    } catch (error: any) {
      console.error('Error al actualizar modo de edición histórica:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar la configuración',
        variant: 'destructive',
      });
    } finally {
      setGuardandoModoHistorico(false);
    }
  };

  useEffect(() => {
    if (usuario) {
      const isoMonedaPersistida = usuario.moneda_pais_iso || '';
      const isoMoneda = isoMonedaPersistida;
      const avatarUsuario = typeof usuario.avatar === 'string' && usuario.avatar.trim() !== '' ? usuario.avatar : null;
      setFormularioPerfil({
        nombre: usuario.nombre || '',
        pais: usuario.pais || 'Bolivia',
        codigo_pais: usuario.codigo_pais || '+591',
        moneda: usuario.moneda || '$',
      });
      setPerfilInicial({
        nombre: usuario.nombre || '',
        pais: usuario.pais || 'Bolivia',
        codigo_pais: usuario.codigo_pais || '+591',
        moneda: usuario.moneda || '$',
      });
      setAvatarPerfil(avatarUsuario);
      setAvatarPerfilInicial(avatarUsuario);
      setMonedaPaisIsoInicial(isoMoneda);
      setPaisMonedaIso(isoMoneda);
    }
  }, [usuario]);

  const [formulario_contrasena, setFormularioContrasena] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_contrasena: '',
  });

  const [mostrar_contrasenas, setMostrarContrasenas] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  });

  const [cambiando_contrasena, setCambiandoContrasena] = useState(false);
  const [alergias, setAlergias] = useState<ItemCatalogo[]>([]);
  const [enfermedades, setEnfermedades] = useState<ItemCatalogo[]>([]);
  const [medicamentos, setMedicamentos] = useState<ItemCatalogo[]>([]);
  const [colores, setColores] = useState<ItemCatalogo[]>([]);
  const [etiquetas_plantillas, setEtiquetasPlantillas] = useState<ItemCatalogo[]>([]);
  const [cargando_catalogos, setCargandoCatalogos] = useState(false);
  const [dialogo_migracion_formato_abierto, setDialogoMigracionFormatoAbierto] = useState(false);
  const [dialogo_migracion_progreso_abierto, setDialogoMigracionProgresoAbierto] = useState(false);
  const [formato_migracion, setFormatoMigracion] = useState<'zip' | 'rar' | 'tar.gz'>('zip');
  const [migracion_iniciando, setMigracionIniciando] = useState(false);
  const [estado_migracion, setEstadoMigracion] = useState<EstadoMigracion | null>(null);
  const intervalo_migracion_ref = useRef<number | null>(null);

  const cargarEstadoMigracion = async () => {
    try {
      const estado = await migracionApi.estado();
      setEstadoMigracion(estado);
      return estado;
    } catch (error: any) {
      setEstadoMigracion((prev) =>
        prev || {
          en_progreso: false,
          progreso: 0,
          etapa: 'error',
          error: obtenerMensajeError(error) || 'No se pudo obtener el estado de migración',
        },
      );
      return null;
    }
  };

  useEffect(() => {
    if (!dialogo_migracion_progreso_abierto) {
      if (intervalo_migracion_ref.current) {
        window.clearInterval(intervalo_migracion_ref.current);
        intervalo_migracion_ref.current = null;
      }
      return;
    }

    cargarEstadoMigracion();
    intervalo_migracion_ref.current = window.setInterval(async () => {
      const estado = await cargarEstadoMigracion();
      if (estado && !estado.en_progreso) {
        if (intervalo_migracion_ref.current) {
          window.clearInterval(intervalo_migracion_ref.current);
          intervalo_migracion_ref.current = null;
        }
      }
    }, 900);

    return () => {
      if (intervalo_migracion_ref.current) {
        window.clearInterval(intervalo_migracion_ref.current);
        intervalo_migracion_ref.current = null;
      }
    };
  }, [dialogo_migracion_progreso_abierto]);

  const iniciarMigracion = async () => {
    setMigracionIniciando(true);
    try {
      await migracionApi.iniciar({ formato: formato_migracion });
      setDialogoMigracionFormatoAbierto(false);
      setDialogoMigracionProgresoAbierto(true);
      await cargarEstadoMigracion();
      toast({
        title: 'Migración iniciada',
        description: 'La migración se está ejecutando. No cierres la aplicación.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: obtenerMensajeError(error) || 'No se pudo iniciar la migración',
        variant: 'destructive',
      });
    } finally {
      setMigracionIniciando(false);
    }
  };

  const [pais_moneda_iso, setPaisMonedaIso] = useState('');

  const obtenerPaisPorIso = (iso?: string) => PAISES.find(p => p.iso === iso);

  useEffect(() => {
    if (usuario?.moneda_pais_iso) {
      setPaisMonedaIso(usuario.moneda_pais_iso);
    }
  }, [usuario]);

  const [config_clinica, setConfigClinica] = useState({
    logo: '',
    nombre_clinica: '',
    mensaje_bienvenida_antes: 'Bienvenido, ',
    mensaje_bienvenida_despues: ', ¿qué hacemos hoy?',
    horarios_laborales: '',
    gemini_api_key: '',
    gemini_url_base: '',
    gemini_verificado: false,
    exchange_rate_api_key: '',
    exchange_rate_verificado: false,
    cambio_dolar: 1,
    trabajar_con: 'local' as 'local' | 'usd',
    moneda_configurada: false,
    moneda_principal: '',
    modelo_dientes_odontograma: 'cuadrado' as 'cuadrado' | 'circular',
  });
  const [config_clinica_inicial, setConfigClinicaInicial] = useState({
    logo: '',
    nombre_clinica: '',
    mensaje_bienvenida_antes: '',
    mensaje_bienvenida_despues: '',
    horarios_laborales: '',
    gemini_api_key: '',
    gemini_url_base: '',
    gemini_verificado: false,
    exchange_rate_api_key: '',
    exchange_rate_verificado: false,
    cambio_dolar: 1,
    trabajar_con: 'local' as 'local' | 'usd',
    moneda_configurada: false,
    moneda_principal: '',
    modelo_dientes_odontograma: 'cuadrado' as 'cuadrado' | 'circular',
  });

  const [horarios_laborales, setHorariosLaborales] = useState<HorariosLaborales>(crearHorariosDefault());
  const [horarios_laborales_inicial, setHorariosLaboralesInicial] = useState<HorariosLaborales>(crearHorariosDefault());
  const [guardando_horarios, setGuardandoHorarios] = useState(false);
  const [intervalos_reordenados, setIntervalosReordenados] = useState<Partial<Record<DiaSemana, boolean[]>>>({});
  const timeout_reordenados_ref = useRef<number | null>(null);
  const [cargando_clinica, setCargandoClinica] = useState(true);
  const [guardando_clinica, setGuardandoClinica] = useState(false);
  const [guardando_divisas, setGuardandoDivisas] = useState(false);
  const [guardando_divisas_api, setGuardandoDivisasApi] = useState(false);
  const [guardando_ia, setGuardandoIA] = useState(false);
  const logo_clinica_input_ref = useRef<HTMLInputElement>(null);
  const moneda_ref = useRef<HTMLDivElement>(null);
  const [, setMonedaParpadeo] = useState(false);
  const [cambio_manual_local, setCambioManualLocal] = useState('');
  const [cambio_manual_usd, setCambioManualUSD] = useState('');

  useEffect(() => {
    const onNavegarConfiguracion = (evento: Event) => {
      const custom = evento as CustomEvent<{ tab?: 'perfil' | 'clinica' | 'apariencia' | 'catalogos' }>;
      const detalle = custom.detail;
      if (!detalle) return;
      if (detalle.tab) setTabConfiguracion(detalle.tab);
    };

    window.addEventListener('tutorial:navegar-configuracion', onNavegarConfiguracion);
    return () => {
      window.removeEventListener('tutorial:navegar-configuracion', onNavegarConfiguracion);
    };
  }, []);

  useEffect(() => {
    if (config_clinica.cambio_dolar) {
      setCambioManualUSD('1');
      setCambioManualLocal(config_clinica.cambio_dolar.toString());
    }
  }, [config_clinica.cambio_dolar]);

  useEffect(() => {
    if (cargando_clinica) return;
    if (config_clinica.moneda_configurada === false && moneda_ref.current) {
      setMonedaParpadeo(true);
    } else {
      setMonedaParpadeo(false);
    }
  }, [config_clinica.moneda_configurada, cargando_clinica]);

  const temas_disponibles = [
    { valor: 'claro', nombre: 'Claro', icono: Sun, descripcion: 'Tema claro tradicional', categoria: 'Base' },
    { valor: 'oscuro', nombre: 'Oscuro', icono: Moon, descripcion: 'Tema oscuro clásico', categoria: 'Base' },
    { valor: 'azul', nombre: 'Azul Océano', icono: Droplet, descripcion: 'Tonos azules profundos', categoria: 'Base' },
    { valor: 'clinico', nombre: 'Clínico Blanco', icono: Stethoscope, descripcion: 'Limpio y profesional', categoria: 'Médico' },
    { valor: 'menta', nombre: 'Menta Dental', icono: Pill, descripcion: 'Verde menta relajante', categoria: 'Médico' },
    { valor: 'menta-claro', nombre: 'Menta Claro', icono: Pill, descripcion: 'Menta dental refrescante', categoria: 'Médico' },
    { valor: 'azul-claro', nombre: 'Azul Claro', icono: Droplet, descripcion: 'Azul suave y luminoso', categoria: 'Colores Claros' },
    { valor: 'verde-claro', nombre: 'Verde Claro', icono: Leaf, descripcion: 'Verde natural y fresco', categoria: 'Colores Claros' },
    { valor: 'rosa-claro', nombre: 'Rosa Claro', icono: Heart, descripcion: 'Rosa suave y elegante', categoria: 'Colores Claros' },
    { valor: 'beige-claro', nombre: 'Beige Claro', icono: Coffee, descripcion: 'Beige cálido y acogedor', categoria: 'Colores Claros' },
    { valor: 'gris-claro', nombre: 'Gris Claro', icono: Layers, descripcion: 'Gris neutro y minimalista', categoria: 'Colores Claros' },
    { valor: 'morado-claro', nombre: 'Morado Claro', icono: Grape, descripcion: 'Morado suave y delicado', categoria: 'Colores Claros' },
    { valor: 'naranja-claro', nombre: 'Naranja Claro', icono: Flame, descripcion: 'Naranja cálido y energético', categoria: 'Colores Claros' },
    { valor: 'verde', nombre: 'Verde Bosque', icono: Leaf, descripcion: 'Tonos verdes naturales', categoria: 'Colores Oscuros' },
    { valor: 'rosa', nombre: 'Rosa Elegante', icono: Heart, descripcion: 'Tonos rosa intensos', categoria: 'Colores Oscuros' },
    { valor: 'beige', nombre: 'Beige Cálido', icono: Coffee, descripcion: 'Tonos beige y hueso', categoria: 'Colores Oscuros' },
    { valor: 'gris', nombre: 'Gris Neutro', icono: Layers, descripcion: 'Escala de grises pura', categoria: 'Colores Oscuros' },
    { valor: 'morado', nombre: 'Morado Real', icono: Grape, descripcion: 'Tonos morados elegantes', categoria: 'Colores Oscuros' },
    { valor: 'naranja', nombre: 'Naranja Fuego', icono: Flame, descripcion: 'Tonos naranjas cálidos', categoria: 'Colores Oscuros' },
    { valor: 'cielo-abierto', nombre: 'Cielo Abierto', icono: Sun, descripcion: 'Azul cielo luminoso', categoria: 'Especiales' },
    { valor: 'esmeralda', nombre: 'Esmeralda', icono: Leaf, descripcion: 'Verde esmeralda vibrante', categoria: 'Especiales' },
    { valor: 'atardecer', nombre: 'Atardecer', icono: Moon, descripcion: 'Tonos cálidos nocturnos', categoria: 'Especiales' },
    { valor: 'cafe-leche', nombre: 'Café con Leche', icono: Coffee, descripcion: 'Tonos café acogedores', categoria: 'Especiales' },
    { valor: 'artico', nombre: 'Ártico', icono: Layers, descripcion: 'Blanco y gris helado', categoria: 'Especiales' },
    { valor: 'neon-cyber', nombre: 'Neón Cyber', icono: Flame, descripcion: 'Verde neón futurista', categoria: 'Especiales' },
    { valor: 'vintage-sepia', nombre: 'Vintage Sepia', icono: Coffee, descripcion: 'Estilo retro cálido', categoria: 'Especiales' },
    { valor: 'azul-hielo', nombre: 'Azul Hielo', icono: Droplet, descripcion: 'Azul cristalino', categoria: 'Especiales' },
    { valor: 'mono-claro', nombre: 'Monocromático Claro', icono: Layers, descripcion: 'Blanco puro, serio y minimalista', categoria: 'Monocromáticos' },
    { valor: 'mono-oscuro', nombre: 'Monocromático Oscuro', icono: Layers, descripcion: 'Negro puro, elegante y sobrio', categoria: 'Monocromáticos' },
    { valor: 'personalizado', nombre: 'Personalizado', icono: Settings2, descripcion: 'Crea tu propio tema', categoria: 'Personalizado' },
  ];

  const temas_por_categoria = temas_disponibles.reduce((acc, tema) => {
    if (!acc[tema.categoria]) {
      acc[tema.categoria] = [];
    }
    acc[tema.categoria].push(tema);
    return acc;
  }, {} as Record<string, typeof temas_disponibles>);

  useEffect(() => {
    cargarCatalogos();
    cargarConfiguracionClinica();
    cargarEstadoMigracion();
  }, []);

  const cerrarDialogoCajaComentarios = () => {
    setDialogoCajaComentarios(false);
    setCorreoComentarios('');
    setCodigoPaisComentarios(obtenerCodigoPaisPorDefectoComentarios());
    setNumeroCelularComentarios('');
    setCategoriaComentarios('Nueva Funcionalidad');
    setContenidoComentarios('');
    setErrorComentarios('');
    setEnviandoComentarios(false);
  };

  const guardarLlaveComentarios = async (llave: string) => {
    const hwid = await obtenerHwidCliente();
    if (!hwid) throw new Error('No se pudo obtener el HWID del dispositivo (Electron).');

    const tokenPlano = (llave || '').trim();
    if (!tokenPlano) throw new Error('Ingresa la llave de acceso.');

    const resp = await licenciamientoPublicoApi.guardarCredencial({
      hwid_cliente: hwid,
      token: tokenPlano,
    });

    if (!resp.valida) {
      throw new Error(resp.motivo || 'Llave inválida');
    }

    toast({
      title: 'Llave actualizada',
      description: 'Ya puedes volver a enviar tu comentario.',
    });

    setDialogoLlaveComentarios(false);
    setMotivoLlaveComentarios(null);
  };

  const enviarComentario = async () => {
    setErrorComentarios('');
    setEnviandoComentarios(true);
    try {
      const hwid = await obtenerHwidCliente();
      if (!hwid) throw new Error('No se pudo obtener el HWID del dispositivo (Electron).');

      const contenido = contenido_comentarios.trim();
      if (contenido.length < 1) throw new Error('Escribe tu comentario.');

      const celular = numero_celular_comentarios.trim()
        ? formatearTelefonoCompleto(codigo_pais_comentarios, numero_celular_comentarios)
        : undefined;

      await licenciamientoPublicoApi.crearSugerenciaVl({
        hwid_cliente: hwid,
        categoria: categoria_comentarios,
        contenido,
        correo: correo_comentarios.trim() || undefined,
        celular,
      });

      toast({
        title: 'Enviado',
        description: 'Gracias. Tu comentario fue enviado correctamente.',
      });

      cerrarDialogoCajaComentarios();
    } catch (err: any) {
      const status = err?.response?.status;
      const motivoRaw = err?.response?.data?.message || err?.message || 'La llave de comunicación ya no es válida.';
      const motivoStr = typeof motivoRaw === 'string' ? motivoRaw : 'La llave de comunicación ya no es válida.';
      const motivoLower = motivoStr.toLowerCase();
      const pareceProblemaDeLlave =
        motivoLower.includes('llave') &&
        (motivoLower.includes('inválida') ||
          motivoLower.includes('invalida') ||
          motivoLower.includes('inactiva') ||
          motivoLower.includes('eliminada') ||
          motivoLower.includes('revocada'));

      if (status === 401 || status === 403 || pareceProblemaDeLlave) {
        setMotivoLlaveComentarios(motivoStr);
        setDialogoLlaveComentarios(true);
        setErrorComentarios('Tu llave de comunicación fue rechazada. Actualízala y vuelve a intentar enviar.');
        return;
      }
      setErrorComentarios(obtenerMensajeError(err));
    } finally {
      setEnviandoComentarios(false);
    }
  };


  const cargarCatalogos = async () => {
    setCargandoCatalogos(true);
    try {
      const [alergias_data, enfermedades_data, medicamentos_data, colores_data, etiquetas_plantillas_data] = await Promise.all([
        catalogoApi.obtenerAlergias(),
        catalogoApi.obtenerEnfermedades(),
        catalogoApi.obtenerMedicamentos(),
        catalogoApi.obtenerColores(),
        catalogoApi.obtenerEtiquetasPlantilla(),
      ]);
      setAlergias(alergias_data);
      setEnfermedades(enfermedades_data);
      setMedicamentos(medicamentos_data);
      setColores(colores_data);
      setEtiquetasPlantillas(etiquetas_plantillas_data);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los catálogos',
        variant: 'destructive',
      });
    } finally {
      setCargandoCatalogos(false);
    }
  };

  const cargarConfiguracionClinica = async () => {
    setCargandoClinica(true);
    try {
      const config = await catalogoApi.obtenerConfiguracionClinica();
      const horariosCargados = parseHorariosLaborales((config as any).horarios_laborales);

      const modeloOdontograma: 'cuadrado' | 'circular' =
        (config as any).modelo_dientes_odontograma === 'circular' ? 'circular' : 'cuadrado';

      const configCargada = {
        logo: config.logo || '',
        nombre_clinica: config.nombre_clinica || '',
        mensaje_bienvenida_antes: config.mensaje_bienvenida_antes || 'Bienvenido, ',
        mensaje_bienvenida_despues: config.mensaje_bienvenida_despues || ', ¿qué hacemos hoy?',
        horarios_laborales: (config as any).horarios_laborales || '',
        gemini_api_key: config.gemini_api_key || '',
        gemini_url_base: config.gemini_url_base || '',
        gemini_verificado: config.gemini_verificado || false,
        exchange_rate_api_key: config.exchange_rate_api_key || '',
        exchange_rate_verificado: config.exchange_rate_verificado || false,
        cambio_dolar: Number(config.cambio_dolar) || 1,
        trabajar_con: config.trabajar_con || 'local',
        moneda_configurada: config.moneda_configurada || false,
        moneda_principal: config.moneda_principal || '',
        modelo_dientes_odontograma: modeloOdontograma,
      };
      setConfigClinica(configCargada);
      setConfigClinicaInicial(configCargada);
      setHorariosLaborales(horariosCargados);
      setHorariosLaboralesInicial(horariosCargados);
    } catch (error) {
      console.error('Error al cargar configuración de clínica:', error);
    } finally {
      setCargandoClinica(false);
    }
  };

  const aplicarParcheClinica = async (patch: Partial<typeof config_clinica>) => {
    await catalogoApi.actualizarConfiguracionClinica(patch);
    setConfigClinica(prev => ({ ...prev, ...patch }));
    setConfigClinicaInicial(prev => ({ ...prev, ...patch }));
    actualizarConfigClinica(patch);
  };

  const manejarCambiarModeloOdontograma = async (modelo: 'cuadrado' | 'circular') => {
    if (config_clinica.modelo_dientes_odontograma === modelo) return;
    setGuardandoModeloOdontograma(true);
    try {
      await aplicarParcheClinica({ modelo_dientes_odontograma: modelo });
      toast({
        title: 'Configuración actualizada',
        description: `Modelo de dientes del odontograma: ${modelo}`,
      });
    } catch (error: any) {
      console.error('Error al actualizar modelo de odontograma:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar la configuración',
        variant: 'destructive',
      });
    } finally {
      setGuardandoModeloOdontograma(false);
    }
  };

  const manejarGuardarConfiguracionClinica = async () => {
    setGuardandoClinica(true);
    try {
      await aplicarParcheClinica({
        logo: config_clinica.logo,
        nombre_clinica: config_clinica.nombre_clinica,
        mensaje_bienvenida_antes: config_clinica.mensaje_bienvenida_antes,
        mensaje_bienvenida_despues: config_clinica.mensaje_bienvenida_despues,
      });

      toast({
        title: 'Éxito',
        description: 'Configuración guardada.',
      });
    } catch (error: any) {
      console.error('Error al guardar configuración de clínica:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setGuardandoClinica(false);
    }
  };

  const errores_horarios = validarHorariosLaborales(horarios_laborales);
  const hay_errores_horarios = (Object.values(errores_horarios) as Array<string | null>).some(Boolean);
  const hayCambiosHorarios =
    JSON.stringify(normalizarHorarios(horarios_laborales)) !== JSON.stringify(normalizarHorarios(horarios_laborales_inicial));

  const actualizarIntervaloHorario = (dia: DiaSemana, indice: number, campo: keyof IntervaloHorario, valor: string) => {
    setHorariosLaborales(prev => {
      const actual = asegurarDiasHorarios(prev);
      const rangos = [...(actual[dia] || [])];
      const original = rangos[indice] || { inicio: '08:00', fin: '09:00' };
      rangos[indice] = { ...original, [campo]: valor };
      return { ...actual, [dia]: rangos };
    });
  };

  const quitarIntervaloHorario = (dia: DiaSemana, indice: number) => {
    setHorariosLaborales(prev => {
      const actual = asegurarDiasHorarios(prev);
      const rangos = (actual[dia] || []).filter((_, i) => i !== indice);
      return { ...actual, [dia]: rangos };
    });
  };

  const sugerirNuevoIntervalo = (rangos: IntervaloHorario[]): IntervaloHorario => {
    const ultimo = rangos[rangos.length - 1];
    if (ultimo && esHoraHHMM(ultimo.fin)) {
      const inicio = horaAMinutos(ultimo.fin);
      const fin = Math.min(inicio + 60, 23 * 60 + 59);
      const toHHMM = (min: number) => {
        const h = String(Math.floor(min / 60)).padStart(2, '0');
        const m = String(min % 60).padStart(2, '0');
        return `${h}:${m}`;
      };

      const inicioTxt = toHHMM(inicio);
      const finTxt = toHHMM(fin);
      if (inicio < fin) return { inicio: inicioTxt, fin: finTxt };
    }
    return { inicio: '08:00', fin: '09:00' };
  };

  const agregarIntervaloHorario = (dia: DiaSemana) => {
    setHorariosLaborales(prev => {
      const actual = asegurarDiasHorarios(prev);
      const rangos = [...(actual[dia] || [])];
      rangos.push(sugerirNuevoIntervalo(rangos));
      return { ...actual, [dia]: rangos };
    });
  };

  const calcularIntervalosReordenados = (antes: HorariosLaborales, despues: HorariosLaborales) => {
    const resultado: Partial<Record<DiaSemana, boolean[]>> = {};

    const firma = (r: IntervaloHorario) => `${(r?.inicio || '').trim()}-${(r?.fin || '').trim()}`;

    for (const dia of DIAS_SEMANA) {
      const original = (antes[dia] || []).map(r => ({ inicio: (r?.inicio || '').trim(), fin: (r?.fin || '').trim() }));
      const ordenado = (despues[dia] || []).map(r => ({ inicio: (r?.inicio || '').trim(), fin: (r?.fin || '').trim() }));

      const indicesPorFirma = new Map<string, number[]>();
      for (let i = 0; i < original.length; i++) {
        const k = firma(original[i]);
        const arr = indicesPorFirma.get(k) || [];
        arr.push(i);
        indicesPorFirma.set(k, arr);
      }

      const usados = new Map<string, number>();
      const movidos: boolean[] = new Array(ordenado.length).fill(false);
      for (let nuevoIndice = 0; nuevoIndice < ordenado.length; nuevoIndice++) {
        const k = firma(ordenado[nuevoIndice]);
        const occ = usados.get(k) || 0;
        const arr = indicesPorFirma.get(k);
        const indiceOriginal = arr?.[occ];
        usados.set(k, occ + 1);

        if (typeof indiceOriginal === 'number' && indiceOriginal !== nuevoIndice) {
          movidos[nuevoIndice] = true;
        }
      }

      if (movidos.some(Boolean)) resultado[dia] = movidos;
    }

    return resultado;
  };

  const manejarGuardarHorariosLaborales = async () => {
    setGuardandoHorarios(true);
    try {
      if (timeout_reordenados_ref.current) {
        window.clearTimeout(timeout_reordenados_ref.current);
        timeout_reordenados_ref.current = null;
      }

      const normalizado = normalizarHorarios(horarios_laborales);
      await aplicarParcheClinica({
        horarios_laborales: JSON.stringify(normalizado),
      });

      const reordenados = calcularIntervalosReordenados(asegurarDiasHorarios(horarios_laborales), normalizado);
      setHorariosLaborales(normalizado);
      setHorariosLaboralesInicial(normalizado);
      setIntervalosReordenados(reordenados);
      timeout_reordenados_ref.current = window.setTimeout(() => {
        setIntervalosReordenados({});
        timeout_reordenados_ref.current = null;
      }, 1100);

      toast({
        title: 'Éxito',
        description: 'Horarios laborables guardados.',
      });
    } catch (error: any) {
      console.error('Error al guardar horarios laborables:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudieron guardar los horarios',
        variant: 'destructive',
      });
    } finally {
      setGuardandoHorarios(false);
    }
  };

  const manejarGuardarPreferenciasDivisas = async () => {
    setGuardandoDivisas(true);
    try {
      const tasaCalculada = (parseFloat(cambio_manual_local) && parseFloat(cambio_manual_usd))
        ? (parseFloat(cambio_manual_local) / parseFloat(cambio_manual_usd))
        : config_clinica.cambio_dolar;

      const nueva_tasa = Number.isFinite(tasaCalculada) ? Number(Number(tasaCalculada).toFixed(2)) : (config_clinica.cambio_dolar || 1);

      await aplicarParcheClinica({
        cambio_dolar: nueva_tasa,
        trabajar_con: config_clinica.trabajar_con,
      });

      toast({
        title: 'Éxito',
        description: 'Preferencias de divisas guardadas.',
      });
    } catch (error: any) {
      console.error('Error al guardar preferencias de divisas:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo guardar la configuración de divisas',
        variant: 'destructive',
      });
    } finally {
      setGuardandoDivisas(false);
    }
  };

  const manejarGuardarYValidarDivisasApi = async () => {
    setGuardandoDivisasApi(true);
    try {
      let exchange_verificado = false;
      let nueva_tasa: number | null = null;

      if (config_clinica.exchange_rate_api_key) {
        try {
          const infoMoneda = INFO_MONEDAS_PAIS[formulario_perfil.pais] || INFO_MONEDAS_PAIS['default'];
          const monedaAValidar = infoMoneda.code || 'USD';

          const resultado = await finanzasApi.validarApiKeyTasa(config_clinica.exchange_rate_api_key, monedaAValidar);
          exchange_verificado = !!resultado?.verificado;
          if (resultado?.tasa !== undefined && resultado?.tasa !== null) {
            nueva_tasa = Number(Number(resultado.tasa).toFixed(2));
          }

          toast({ title: 'API de tasa de cambio', description: 'API Key validada correctamente.' });
        } catch (error) {
          console.error('Error al validar Exchange API:', error);
          exchange_verificado = false;
          toast({
            title: 'Advertencia',
            description: 'Se guardó la API Key pero no se pudo validar. Verifique su conexión o la clave.',
            variant: 'destructive',
          });
        }
      }

      const patch: Partial<typeof config_clinica> = {
        exchange_rate_api_key: config_clinica.exchange_rate_api_key,
        exchange_rate_verificado: exchange_verificado,
      };

      if (nueva_tasa !== null) {
        patch.cambio_dolar = nueva_tasa;
        setCambioManualLocal(nueva_tasa.toFixed(2));
        setCambioManualUSD('1');
      }

      await aplicarParcheClinica(patch);
      toast({ title: 'Éxito', description: 'API de tasa de cambio guardada.' });
    } catch (error: any) {
      console.error('Error al guardar/validar API de tasa de cambio:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo guardar la API de tasa de cambio',
        variant: 'destructive',
      });
    } finally {
      setGuardandoDivisasApi(false);
    }
  };

  const manejarGuardarConfiguracionIA = async () => {
    setGuardandoIA(true);
    try {
      const apiKey = (config_clinica.gemini_api_key || '').trim();
      const urlBase = (config_clinica.gemini_url_base || '').trim();
      await aplicarParcheClinica({
        gemini_api_key: apiKey,
        gemini_url_base: urlBase,
        gemini_verificado: false,
      });
      if (!apiKey) {
        toast({
          title: 'Éxito',
          description: 'Configuración IA guardada (pendiente de API Key).',
        });
        return;
      }

      let verificado = false;
      try {
        await asistenteApi.probarGemini('hola');
        verificado = true;
      } catch (error: any) {
        console.error('Error al validar Gemini:', error);
        verificado = false;
        toast({
          title: 'Error al validar Gemini',
          description: error?.response?.data?.message || 'No se pudo validar Gemini. Verifique la clave/endpoint y su conexión.',
          variant: 'destructive',
        });
      }
      await aplicarParcheClinica({ gemini_verificado: verificado });

      toast({
        title: verificado ? 'Éxito' : 'Configuración guardada',
        description: verificado
          ? 'Gemini verificado correctamente.'
          : 'La configuración se guardó, pero Gemini quedó pendiente de verificación.',
      });

    } catch (error: any) {
      console.error('Error al guardar configuración IA:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo guardar la configuración de IA',
        variant: 'destructive',
      });
    } finally {
      setGuardandoIA(false);
    }
  };

  const manejarSubirLogoClinica = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Solo se permiten archivos de imagen',
        variant: 'destructive',
      });
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      const base64 = lector.result as string;
      setConfigClinica({ ...config_clinica, logo: base64 });
    };
    lector.readAsDataURL(archivo);
  };

  const manejarActualizarPerfil = async () => {
    if (!formulario_perfil.nombre) {
      toast({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const hayCambiosAvatar = (avatar_perfil || '') !== (avatar_perfil_inicial || '');
      const payloadPerfil: {
        nombre: string;
        pais: string;
        codigo_pais: string;
        moneda: string;
        moneda_pais_iso?: string;
        avatar?: string;
        eliminar_avatar?: boolean;
      } = {
        nombre: formulario_perfil.nombre,
        pais: formulario_perfil.pais,
        codigo_pais: formulario_perfil.codigo_pais,
        moneda: formulario_perfil.moneda,
        moneda_pais_iso: pais_moneda_iso || undefined,
      };

      if (hayCambiosAvatar) {
        if (avatar_perfil) {
          payloadPerfil.avatar = avatar_perfil;
        } else {
          payloadPerfil.eliminar_avatar = true;
        }
      }

      const actualizado = await usuariosApi.actualizarPerfil(payloadPerfil);

      const avatarActualizado =
        typeof actualizado?.avatar === 'string' && actualizado.avatar.trim() !== ''
          ? actualizado.avatar
          : null;

      actualizarUsuario({
        nombre: actualizado?.nombre || formulario_perfil.nombre,
        pais: actualizado?.pais || formulario_perfil.pais,
        codigo_pais: actualizado?.codigo_pais || formulario_perfil.codigo_pais,
        moneda: actualizado?.moneda || formulario_perfil.moneda,
        moneda_pais_iso:
          (actualizado?.moneda_pais_iso ?? pais_moneda_iso) || undefined,
        avatar: avatarActualizado || undefined,
      });
      setPerfilInicial({
        nombre: actualizado?.nombre || formulario_perfil.nombre,
        pais: actualizado?.pais || formulario_perfil.pais,
        codigo_pais: actualizado?.codigo_pais || formulario_perfil.codigo_pais,
        moneda: actualizado?.moneda || formulario_perfil.moneda,
      });
      setAvatarPerfil(avatarActualizado);
      setAvatarPerfilInicial(avatarActualizado);
      setMonedaPaisIsoInicial(actualizado?.moneda_pais_iso ?? pais_moneda_iso);
      toast({
        title: 'Éxito',
        description: 'Perfil actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el perfil',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const manejarCambiarContrasena = async () => {
    if (!formulario_contrasena.contrasena_actual || !formulario_contrasena.nueva_contrasena || !formulario_contrasena.confirmar_contrasena) {
      toast({
        title: 'Error',
        description: 'Todos los campos son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    if (formulario_contrasena.nueva_contrasena.length < 6) {
      toast({
        title: 'Error',
        description: 'La nueva contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    if (formulario_contrasena.nueva_contrasena !== formulario_contrasena.confirmar_contrasena) {
      toast({
        title: 'Error',
        description: 'Las contraseñas nuevas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    if (formulario_contrasena.contrasena_actual === formulario_contrasena.nueva_contrasena) {
      toast({
        title: 'Error',
        description: 'La nueva contraseña debe ser diferente a la actual',
        variant: 'destructive',
      });
      return;
    }

    setCambiandoContrasena(true);
    try {
      await usuariosApi.cambiarContrasena({
        contrasena_actual: formulario_contrasena.contrasena_actual,
        nueva_contrasena: formulario_contrasena.nueva_contrasena,
      });

      toast({
        title: 'Éxito',
        description: 'Contraseña actualizada correctamente',
      });

      setFormularioContrasena({
        contrasena_actual: '',
        nueva_contrasena: '',
        confirmar_contrasena: '',
      });
      setMostrarContrasenas({
        actual: false,
        nueva: false,
        confirmar: false,
      });
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo cambiar la contraseña',
        variant: 'destructive',
      });
    } finally {
      setCambiandoContrasena(false);
    }
  };

  const manejarSubirAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Solo se permiten archivos de imagen',
        variant: 'destructive',
      });
      return;
    }

    const limiteBytes = 2 * 1024 * 1024;
    if (archivo.size > limiteBytes) {
      toast({
        title: 'Error',
        description: 'La imagen no debe superar 2MB',
        variant: 'destructive',
      });
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      const base64 = lector.result as string;
      setAvatarPerfil(base64);

      toast({
        title: 'Avatar listo',
        description: 'Ahora pulsa "Guardar Cambios" para persistirlo.',
      });
    };
    lector.readAsDataURL(archivo);
  };

  const manejarQuitarAvatar = () => {
    setAvatarPerfil(null);
  };

  const obtenerNombreTemaEfectivo = (): string => {
    const nombres: Record<string, string> = {
      'claro': 'Claro',
      'oscuro': 'Oscuro',
      'clinico': 'Clínico Blanco',
      'azul': 'Azul Océano',
      'azul-claro': 'Azul Claro',
      'verde': 'Verde Bosque',
      'verde-claro': 'Verde Claro',
      'rosa': 'Rosa Elegante',
      'rosa-claro': 'Rosa Claro',
      'beige': 'Beige Cálido',
      'beige-claro': 'Beige Claro',
      'gris': 'Gris Neutro',
      'gris-claro': 'Gris Claro',
      'morado': 'Morado Real',
      'morado-claro': 'Morado Claro',
      'naranja': 'Naranja Fuego',
      'naranja-claro': 'Naranja Claro',
      'menta': 'Menta Dental',
      'menta-claro': 'Menta Claro',
      'personalizado': 'Personalizado',
    };
    return nombres[tema_efectivo] || tema_efectivo;
  };
  useEffect(() => {
    if (tema_personalizado) {
      setColoresPersonalizados(tema_personalizado);
    }
  }, [tema_personalizado]);

  const guardarTemaPersonalizado = async (colores?: TemaPersonalizado) => {
    const coloresAGuardar = colores || colores_temporales || colores_personalizados;
    setGuardandoTema(true);
    try {
      await catalogoApi.actualizarConfiguracionClinica({
        tema_personalizado: JSON.stringify(coloresAGuardar),
      });
      setColoresPersonalizados(coloresAGuardar);
      actualizarTemaPersonalizado(coloresAGuardar);
      aplicarColoresPersonalizados(coloresAGuardar);
      toast({
        title: 'Éxito',
        description: 'Tu tema personalizado ha sido guardado',
      });
    } catch (error: any) {
      console.error('Error al guardar tema:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el tema personalizado',
        variant: 'destructive',
      });
    } finally {
      setGuardandoTema(false);
    }
  };

  const opcionesMoneda = PAISES.map(p => {
    const info = INFO_MONEDAS_PAIS[p.nombre] || INFO_MONEDAS_PAIS['default'];
    return {
      valor: p.iso,
      etiqueta: `${p.nombre} - ${info.simbolo} (${info.nombre})`,
      componente: (
        <div className="flex items-center gap-2">
          <span className={`fi fi-${p.iso} rounded-sm shadow-sm`} />
          <span>{p.nombre} - <span className="text-muted-foreground">{info.simbolo} ({info.nombre})</span></span>
        </div>
      )
    };
  });

  const hayCambiosMoneda =
    formulario_perfil.moneda !== perfil_inicial.moneda || pais_moneda_iso !== moneda_pais_iso_inicial;

  const hayCambiosAvatar = (avatar_perfil || '') !== (avatar_perfil_inicial || '');

  const hayCambiosPerfil =
    formulario_perfil.nombre !== perfil_inicial.nombre ||
    formulario_perfil.pais !== perfil_inicial.pais ||
    formulario_perfil.codigo_pais !== perfil_inicial.codigo_pais ||
    hayCambiosMoneda ||
    hayCambiosAvatar;

  const hayCambiosClinica =
    config_clinica.logo !== config_clinica_inicial.logo ||
    config_clinica.nombre_clinica !== config_clinica_inicial.nombre_clinica ||
    config_clinica.mensaje_bienvenida_antes !== config_clinica_inicial.mensaje_bienvenida_antes ||
    config_clinica.mensaje_bienvenida_despues !== config_clinica_inicial.mensaje_bienvenida_despues;

  const hayCambiosIA =
    config_clinica.gemini_api_key !== config_clinica_inicial.gemini_api_key ||
    config_clinica.gemini_url_base !== config_clinica_inicial.gemini_url_base;

  const hayCambiosDivisasApi = 
      config_clinica.exchange_rate_api_key !== config_clinica_inicial.exchange_rate_api_key || 
      config_clinica.exchange_rate_verificado !== config_clinica_inicial.exchange_rate_verificado;

  const camposContrasenaCompletos =
    formulario_contrasena.contrasena_actual.length > 0 &&
    formulario_contrasena.nueva_contrasena.length > 0 &&
    formulario_contrasena.confirmar_contrasena.length > 0;

  const seccion_migracion_datos_abierta = esSeccionCatalogosAbierta('config-catalogos-migracion-datos');
  const migracion_bloquea_cierre =
    dialogo_migracion_progreso_abierto &&
    (migracion_iniciando || estado_migracion?.en_progreso || estado_migracion === null);

  return (
    <ProveedorTutorialesPagina pagina="/configuracion" definicionesTutoriales={TUTORIALES_CONFIGURACION}>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 id="titulo-pagina-configuracion" className="text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
                <TituloAccionable titulo="Configuración">Configuración</TituloAccionable>
              </h1>
              <p className="text-lg text-muted-foreground">
                Personaliza tu experiencia en 0d3ntApp
              </p>
            </div>
            <div className="text-right space-y-1 group">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDialogoCajaComentarios(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Caja de Comentarios
              </Button>
            </div>
          </div>

          <Dialog
            open={dialogo_caja_comentarios}
            onOpenChange={(open) => {
              if (!open) cerrarDialogoCajaComentarios();
                else {
                  setDialogoCajaComentarios(true);
                  setCodigoPaisComentarios(obtenerCodigoPaisPorDefectoComentarios());
                }
            }}
          >
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Caja de Comentarios</DialogTitle>
                <DialogDescription>
                  Escribe tu sugerencia para el equipo (contacto opcional). Si tu llave de comunicación deja de ser válida,
                  se te pedirá nuevamente.
                </DialogDescription>
              </DialogHeader>

              {error_comentarios && (
                <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive">
                  {error_comentarios}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={categoria_comentarios} onValueChange={setCategoriaComentarios}>
                    <SelectTrigger className="h-11 bg-secondary/50">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nueva Funcionalidad">Nueva Funcionalidad</SelectItem>
                      <SelectItem value="Mejora de Interfaz">Mejora de Interfaz</SelectItem>
                      <SelectItem value="Duda de Uso / Asistencia">Duda de Uso / Asistencia</SelectItem>
                      <SelectItem value="Revisión Técnica">Revisión Técnica</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caja_contenido">Comentario</Label>
                  <Textarea
                    id="caja_contenido"
                    value={contenido_comentarios}
                    onChange={(e) => setContenidoComentarios(e.target.value)}
                    placeholder="Cuéntanos tu idea o problema..."
                    disabled={enviando_comentarios}
                    className="min-h-[140px] bg-secondary/50"
                    maxLength={4096}
                  />
                  <p className="text-xs text-muted-foreground">
                    {contenido_comentarios.length}/4096
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="caja_correo">Correo (opcional)</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setCorreoComentarios(usuario?.correo || '')}
                        disabled={enviando_comentarios || !usuario?.correo}
                      >
                        Usar mi correo
                      </Button>
                    </div>
                    <Input
                      id="caja_correo"
                      type="email"
                      value={correo_comentarios}
                      onChange={(e) => setCorreoComentarios(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      disabled={enviando_comentarios}
                      className="h-11 bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <PhoneInput
                      codigo_pais={codigo_pais_comentarios}
                      numero={numero_celular_comentarios}
                      onCodigoPaisChange={setCodigoPaisComentarios}
                      onNumeroChange={setNumeroCelularComentarios}
                      disabled={enviando_comentarios}
                      label="Celular (opcional)"
                      placeholder="70123456"
                      layout="vertical"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cerrarDialogoCajaComentarios}
                  disabled={enviando_comentarios}
                >
                  Cerrar
                </Button>
                <Button
                  type="button"
                  onClick={enviarComentario}
                  disabled={enviando_comentarios || !contenido_comentarios.trim()}
                >
                  {enviando_comentarios && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <LlaveComunicacionDialogObligatorio
            open={dialogo_llave_comentarios}
            motivo={motivo_llave_comentarios}
            onGuardar={guardarLlaveComentarios}
            allowClose
            onCerrar={() => {
              setDialogoLlaveComentarios(false);
              setMotivoLlaveComentarios(null);
            }}
          />

          <Tabs value={tab_configuracion} onValueChange={(v) => setTabConfiguracion(v as TabConfiguracion)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-11">
              <TabsTrigger value="perfil" className="text-base" id={IDS_ELEMENTOS_CONFIGURACION.TAB_PERFIL}>
                <User className="h-4 w-4 mr-2" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="clinica" className="text-base" id={IDS_ELEMENTOS_CONFIGURACION.TAB_CLINICA}>
                <Building2 className="h-4 w-4 mr-2" />
                Clínica
              </TabsTrigger>
              <TabsTrigger value="apariencia" className="text-base" id={IDS_ELEMENTOS_CONFIGURACION.TAB_APARIENCIA}>
                <Palette className="h-4 w-4 mr-2" />
                Apariencia
              </TabsTrigger>
              <TabsTrigger value="catalogos" className="text-base" id={IDS_ELEMENTOS_CONFIGURACION.TAB_CATALOGOS}>
                <Database className="h-4 w-4 mr-2" />
                Catálogos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="space-y-6 mt-6">
              <Card id={IDS_ELEMENTOS_CONFIGURACION.CARD_INFO_PERSONAL} className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Información Personal</CardTitle>
                      <CardDescription>Actualiza tus datos personales</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div id={IDS_ELEMENTOS_CONFIGURACION.SECCION_AVATAR} className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg group-hover:scale-110 transition-transform duration-200">
                        {avatar_perfil ? (
                          <img src={avatar_perfil} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
                        ) : (
                          usuario?.nombre.charAt(0).toUpperCase()
                        )}
                      </div>
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:scale-110 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-200"
                      >
                        <Camera className="h-4 w-4 text-primary-foreground" />
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={manejarSubirAvatar}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        Haz clic en el ícono de cámara para cambiar tu avatar
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Formatos permitidos: JPG, PNG, GIF (máx. 2MB). Debes guardar para aplicar cambios.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={manejarQuitarAvatar}
                        disabled={!avatar_perfil}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Quitar foto
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input
                      id="nombre"
                      value={formulario_perfil.nombre}
                      onChange={(e) => setFormularioPerfil({ ...formulario_perfil, nombre: e.target.value })}
                      placeholder="Dr. Juan Pérez"
                      className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="correo">Correo Electrónico</Label>
                    <Input
                      id="correo"
                      value={usuario?.correo}
                      disabled
                      className="bg-secondary/50 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      El correo no se puede modificar
                    </p>
                  </div>

                  <Button
                    onClick={manejarActualizarPerfil}
                    disabled={guardando || !hayCambiosPerfil}
                    id={IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_PERFIL}
                    className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                  >
                    {guardando ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card id={IDS_ELEMENTOS_CONFIGURACION.CARD_CONTRASENA} className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Cambiar Contraseña</CardTitle>
                      <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="contrasena_actual">Contraseña Actual</Label>
                    <div className="relative">
                      <Input
                        id="contrasena_actual"
                        type={mostrar_contrasenas.actual ? 'text' : 'password'}
                        value={formulario_contrasena.contrasena_actual}
                        onChange={(e) => setFormularioContrasena({ ...formulario_contrasena, contrasena_actual: e.target.value })}
                        placeholder="Ingresa tu contraseña actual"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarContrasenas({ ...mostrar_contrasenas, actual: !mostrar_contrasenas.actual })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {mostrar_contrasenas.actual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nueva_contrasena">Nueva Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="nueva_contrasena"
                        type={mostrar_contrasenas.nueva ? 'text' : 'password'}
                        value={formulario_contrasena.nueva_contrasena}
                        onChange={(e) => setFormularioContrasena({ ...formulario_contrasena, nueva_contrasena: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarContrasenas({ ...mostrar_contrasenas, nueva: !mostrar_contrasenas.nueva })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {mostrar_contrasenas.nueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formulario_contrasena.nueva_contrasena && formulario_contrasena.nueva_contrasena.length < 6 && (
                      <p className="text-xs text-destructive">
                        La contraseña debe tener al menos 6 caracteres
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmar_contrasena">Confirmar Nueva Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="confirmar_contrasena"
                        type={mostrar_contrasenas.confirmar ? 'text' : 'password'}
                        value={formulario_contrasena.confirmar_contrasena}
                        onChange={(e) => setFormularioContrasena({ ...formulario_contrasena, confirmar_contrasena: e.target.value })}
                        placeholder="Repite la nueva contraseña"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarContrasenas({ ...mostrar_contrasenas, confirmar: !mostrar_contrasenas.confirmar })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {mostrar_contrasenas.confirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formulario_contrasena.confirmar_contrasena &&
                      formulario_contrasena.nueva_contrasena !== formulario_contrasena.confirmar_contrasena && (
                        <p className="text-xs text-destructive">
                          Las contraseñas no coinciden
                        </p>
                      )}
                    {formulario_contrasena.confirmar_contrasena &&
                      formulario_contrasena.nueva_contrasena === formulario_contrasena.confirmar_contrasena && (
                        <p className="text-xs text-green-500">
                          ✓ Las contraseñas coinciden
                        </p>
                      )}
                  </div>

                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Requisitos de la contraseña:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <span className={formulario_contrasena.nueva_contrasena.length >= 6 ? 'text-green-500' : ''}>
                          {formulario_contrasena.nueva_contrasena.length >= 6 ? '✓' : '○'}
                        </span>
                        Mínimo 6 caracteres
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={formulario_contrasena.nueva_contrasena && formulario_contrasena.nueva_contrasena !== formulario_contrasena.contrasena_actual ? 'text-green-500' : ''}>
                          {formulario_contrasena.nueva_contrasena && formulario_contrasena.nueva_contrasena !== formulario_contrasena.contrasena_actual ? '✓' : '○'}
                        </span>
                        Diferente a la contraseña actual
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={formulario_contrasena.confirmar_contrasena && formulario_contrasena.nueva_contrasena === formulario_contrasena.confirmar_contrasena ? 'text-green-500' : ''}>
                          {formulario_contrasena.confirmar_contrasena && formulario_contrasena.nueva_contrasena === formulario_contrasena.confirmar_contrasena ? '✓' : '○'}
                        </span>
                        Las contraseñas deben coincidir
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={manejarCambiarContrasena}
                    disabled={cambiando_contrasena || !camposContrasenaCompletos}
                    id={IDS_ELEMENTOS_CONFIGURACION.BTN_CAMBIAR_CONTRASENA}
                    className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                  >
                    {cambiando_contrasena ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cambiando...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Cambiar Contraseña
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              <Card id={IDS_ELEMENTOS_CONFIGURACION.CARD_AJUSTES_EXTRA} className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <Settings2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Ajustes Extra</CardTitle>
                      <CardDescription>Configuraciones regionales y de sistema</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div id={IDS_ELEMENTOS_CONFIGURACION.SECCION_PAIS} className="space-y-4 p-5 border rounded-xl bg-secondary/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          <Globe className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">Región y Formato</h3>
                          <p className="text-xs text-muted-foreground">Configuración de prefijos telefónicos</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="pais_perfil_extra" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">País Predeterminado</Label>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-3">
                        <div className="flex-1">
                          <Combobox
                            opciones={PAISES.map(p => ({
                              valor: p.iso,
                              etiqueta: `${p.nombre} (${p.codigo})`,
                              componente: (
                                <div className="flex items-center gap-2">
                                  <span className={`fi fi-${p.iso} rounded-sm shadow-sm`} />
                                  <span>{p.nombre} ({p.codigo})</span>
                                </div>
                              )
                            }))}
                            valor={PAISES.find(p => p.nombre === formulario_perfil.pais)?.iso}
                            onChange={(iso) => {
                              const p = PAISES.find(p => p.iso === iso);
                              if (p) {
                                setFormularioPerfil(prev => ({
                                  ...prev,
                                  pais: p.nombre,
                                  codigo_pais: p.codigo,
                                }));
                              }
                            }}
                            placeholder="Escribe para buscar país..."
                            textoVacio="No se encontró el país. Usa 'Otros Países'."
                          />
                        </div>
                        <Button
                          onClick={async () => {
                            setGuardandoPais(true);
                            try {
                              await usuariosApi.actualizarPais({
                                pais: formulario_perfil.pais,
                                codigo_pais: formulario_perfil.codigo_pais
                              });
                              actualizarUsuario({
                                pais: formulario_perfil.pais,
                                codigo_pais: formulario_perfil.codigo_pais
                              });
                              setPerfilInicial(prev => ({ ...prev, pais: formulario_perfil.pais, codigo_pais: formulario_perfil.codigo_pais }));
                              toast({ title: 'Éxito', description: 'País guardado.' });
                            } catch (error: any) {
                              console.error('Error al actualizar país:', error);
                              toast({ title: 'Error', description: error.response?.data?.message || 'No se pudo guardar el país', variant: 'destructive' });
                            } finally {
                              setGuardandoPais(false);
                            }
                          }}
                          disabled={guardando_pais || !(formulario_perfil.pais !== perfil_inicial.pais || formulario_perfil.codigo_pais !== perfil_inicial.codigo_pais)}
                          id={IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_PAIS}
                          size="sm"
                          className="sm:w-auto w-full"
                          variant="secondary"
                        >
                          {guardando_pais ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Guardar País
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Define el código de país que aparecerá por defecto al registrar nuevos pacientes.
                      </p>
                    </div>

                    <div
                      ref={moneda_ref}
                      className={cn(
                        "space-y-3 pt-2 border-t border-border/50 transition-all duration-500",
                        !config_clinica.moneda_configurada && "relative ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] rounded-xl p-4 bg-yellow-500/5 my-4"
                      )}
                      id="contenedor-seccion-moneda"
                    >
                      {!config_clinica.moneda_configurada && (
                        <div className="absolute -top-3 left-4 bg-yellow-400 text-yellow-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                          REQUERIDO
                        </div>
                      )}
                      <Label htmlFor="moneda_perfil" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Moneda Local</Label>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-3">
                        <div className={cn("flex-1", config_clinica.moneda_configurada && "pointer-events-none opacity-50")}>
                          <Combobox
                            opciones={opcionesMoneda}
                            valor={pais_moneda_iso}
                            onChange={(valor) => {
                              const p = obtenerPaisPorIso(valor);
                              if (p) {
                                setPaisMonedaIso(p.iso);
                                const info = INFO_MONEDAS_PAIS[p.nombre] || INFO_MONEDAS_PAIS['default'];
                                setFormularioPerfil(prev => ({
                                  ...prev,
                                  moneda: info.moneda_real
                                }));
                              }
                            }}
                            placeholder="Buscar moneda o país..."
                            textoVacio="Moneda/País no encontrado."
                          />
                        </div>
                        <Button
                          onClick={async () => {
                            setGuardandoMoneda(true);
                            try {
                              await usuariosApi.actualizarMoneda({
                                moneda: formulario_perfil.moneda,
                                moneda_pais_iso: pais_moneda_iso || undefined,
                              });
                              actualizarUsuario({ moneda: formulario_perfil.moneda, moneda_pais_iso: pais_moneda_iso });
                              if (!config_clinica.moneda_configurada) {
                                const nuevaConfig = {
                                  ...config_clinica,
                                  moneda_configurada: true,
                                  moneda_principal: formulario_perfil.moneda
                                };
                                await catalogoApi.actualizarConfiguracionClinica(nuevaConfig);
                                setConfigClinica(nuevaConfig);
                                actualizarConfigClinica({
                                  moneda_configurada: true,
                                  moneda_principal: formulario_perfil.moneda
                                });
                              }

                              setPerfilInicial(prev => ({ ...prev, moneda: formulario_perfil.moneda }));
                              setMonedaPaisIsoInicial(pais_moneda_iso || '');
                              toast({ title: 'Éxito', description: 'Moneda guardada.' });
                            } catch (error: any) {
                              console.error('Error al actualizar moneda:', error);
                              toast({ title: 'Error', description: error.response?.data?.message || 'No se pudo guardar la moneda', variant: 'destructive' });
                            } finally {
                              setGuardandoMoneda(false);
                            }
                          }}
                          disabled={guardando_moneda || !pais_moneda_iso || !hayCambiosMoneda || config_clinica.moneda_configurada}
                          id={IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_MONEDA}
                          size="sm"
                          className="sm:w-auto w-full"
                          variant="secondary"
                        >
                          {guardando_moneda ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Guardar Moneda
                        </Button>
                      </div>
                      <p className={cn("text-xs font-medium flex items-center gap-1 mt-1", config_clinica.moneda_configurada ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-500")}>
                        {config_clinica.moneda_configurada
                          ? "Esta moneda está establecida como base para el sistema."
                          : "Selecciona cuidadosamente. Esta será la moneda base del sistema y no podrá cambiarse después."}
                      </p>
                    </div>
                    <Card id={IDS_ELEMENTOS_CONFIGURACION.CARD_DIVISAS} className={cn("mt-6 border-2 transition-all duration-300", config_clinica.moneda_configurada ? "border-primary/20 shadow-md" : "border-muted opacity-50 pointer-events-none grayscale")}>
                      <CardHeader className="bg-muted/50 pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400">
                            <DollarSign className="h-5 w-5" />
                          </div>
                          Configuración de Divisas
                        </CardTitle>
                        <CardDescription>Establece la tasa de cambio y tu moneda de trabajo principal.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                            Tasa de Cambio (Equivalencia)
                          </Label>
                          <div className="flex flex-col sm:flex-row items-end gap-3 p-4 border rounded-xl bg-card shadow-sm">
                            <div className="flex-1 space-y-1.5 w-full">
                              <Label className="text-xs font-medium text-muted-foreground">Moneda Local ({formulario_perfil.moneda})</Label>
                              <div className="relative">
                                <Input
                                  id={IDS_ELEMENTOS_CONFIGURACION.INPUT_CAMBIO_LOCAL}
                                  value={cambio_manual_local}
                                  onChange={(e) => {
                                    const soloNumerosYPunto = e.target.value.replace(/[^0-9.]/g, '');
                                    const partes = soloNumerosYPunto.split('.');
                                    const valorNormalizado = partes.length > 1
                                      ? `${partes[0]}.${partes.slice(1).join('')}`
                                      : soloNumerosYPunto;
                                    setCambioManualLocal(valorNormalizado);
                                  }}
                                  placeholder={`Ej: 6.96`}
                                  className="pl-8 font-mono"
                                  inputMode="decimal"
                                  pattern="^[0-9]*\.?[0-9]*$"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">{usuario?.moneda?.charAt(0) || '$'}</span>
                              </div>
                            </div>
                            <div className="flex items-center pb-3 text-muted-foreground font-bold px-2">
                              =
                            </div>
                            <div className="flex-1 space-y-1.5 w-full">
                              <Label className="text-xs font-medium text-muted-foreground">Dólares (USD)</Label>
                              <div className="relative">
                                <Input
                                  value={cambio_manual_usd}
                                  placeholder="1.00"
                                  className="pl-8 font-mono"
                                  readOnly
                                  disabled
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">$</span>
                              </div>
                            </div>
                            <div title={!en_linea ? "Sin conexión a internet" : (!config_clinica.exchange_rate_verificado ? "Configura la API de Tasa de Cambio primero" : `Actualizar tasa desde API (${INFO_MONEDAS_PAIS[formulario_perfil.pais]?.code || 'USD'})`)}>
                              <Button 
                                id={IDS_ELEMENTOS_CONFIGURACION.BTN_ACTUALIZAR_TASA_API}
                                size="icon" 
                                variant="outline" 
                                className="mb-0.5 shrink-0" 
                                disabled={!en_linea || !config_clinica.exchange_rate_verificado}
                                onClick={async () => {
                                  try {
                                    const infoMoneda = INFO_MONEDAS_PAIS[formulario_perfil.pais] || INFO_MONEDAS_PAIS['default'];
                                    const monedaIso = infoMoneda.code || 'USD';

                                    const { tasa } = await finanzasApi.actualizarTasaAutomatica(monedaIso);
                                    const tasaRedondeada = Number(Number(tasa).toFixed(2));
                                    
                                    setCambioManualLocal(tasaRedondeada.toFixed(2));
                                    setCambioManualUSD('1');
                                    setConfigClinica(prev => ({ ...prev, cambio_dolar: tasaRedondeada }));
                                    
                                    toast({ title: 'Tasa actualizada', description: `Tasa obtenida: 1 USD = ${tasaRedondeada.toFixed(2)} ${formulario_perfil.moneda}` });
                                  } catch (error: any) {
                                      toast({ 
                                          title: 'Error al obtener tasa', 
                                          description: error.response?.data?.message || 'Error desconocido', 
                                          variant: 'destructive' 
                                      });
                                  }
                              }}>
                                <DownloadCloud className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground/80 italic px-1">
                            Define cuánto valor de tu moneda local equivale a la cantidad de USD ingresada.
                          </p>
                        </div>
                        <div className="space-y-3 pt-2">
                          <Label className="text-sm font-semibold">Modo de Trabajo Principal</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div 
                              id={IDS_ELEMENTOS_CONFIGURACION.MODO_TRABAJO_LOCAL}
                              className={cn("relative flex flex-col items-center justify-between rounded-xl border-2 bg-popover p-4 hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer", config_clinica.trabajar_con === 'local' ? "border-primary bg-primary/5 shadow-sm" : "border-muted")}
                              onClick={() => setConfigClinica({ ...config_clinica, trabajar_con: 'local' })}
                            >
                              <div className="cursor-pointer flex flex-col items-center gap-2 w-full">
                                <div className="p-2 rounded-full bg-background border shadow-sm">
                                  <span className="text-xl font-bold">{usuario?.moneda?.slice(0, 3)}</span>
                                </div>
                                <span className="font-semibold text-center">Moneda Local</span>
                                <span className="text-xs text-muted-foreground text-center">Gestión simplificada en una sola moneda</span>
                              </div>
                            </div>

                            <div 
                              id={IDS_ELEMENTOS_CONFIGURACION.MODO_TRABAJO_USD}
                              className={cn("relative flex flex-col items-center justify-between rounded-xl border-2 bg-popover p-4 hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer", config_clinica.trabajar_con === 'usd' ? "border-primary bg-primary/5 shadow-sm" : "border-muted")}
                              onClick={() => setConfigClinica({ ...config_clinica, trabajar_con: 'usd' })}
                            >
                              <div className="cursor-pointer flex flex-col items-center gap-2 w-full">
                                <div className="p-2 rounded-full bg-background border shadow-sm">
                                  <DollarSign className="h-6 w-6 text-green-600" />
                                </div>
                                <span className="font-semibold text-center">Dólares</span>
                                <span className="text-xs text-muted-foreground text-center">Manejo dual (Local + USD) con tasa de cambio</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button
                            id={IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_DIVISAS}
                            className="w-full font-semibold"
                            onClick={manejarGuardarPreferenciasDivisas}
                            disabled={guardando_divisas || (() => {
                                const tasaCalculada = (parseFloat(cambio_manual_local) && parseFloat(cambio_manual_usd))
                                    ? (parseFloat(cambio_manual_local) / parseFloat(cambio_manual_usd))
                                    : config_clinica.cambio_dolar;
                                const tasaAlmacenada = config_clinica_inicial.cambio_dolar || 1;
                                const cambioTasa = Math.abs(tasaCalculada - tasaAlmacenada) > 0.0001; 
                                const cambioModo = config_clinica.trabajar_con !== config_clinica_inicial.trabajar_con;
                                return !cambioTasa && !cambioModo;
                            })()}
                          >
                            {guardando_divisas ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Preferencias de Divisas
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div id={IDS_ELEMENTOS_CONFIGURACION.SECCION_EXCHANGE_RATE} className="space-y-4 p-5 border rounded-xl bg-secondary/5 mt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          <Globe className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">API Tasa de Cambio</h3>
                          <p className="text-xs text-muted-foreground">Conexión con ExchangeRate-API</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {config_clinica.exchange_rate_verificado ? (
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold border border-green-200 uppercase tracking-widest">
                            Activo
                          </span>
                        ) : config_clinica.exchange_rate_api_key ? (
                          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold border border-yellow-200 uppercase tracking-widest">
                            Pendiente
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold border border-gray-200 uppercase tracking-widest">
                            Inactivo
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="exchange_rate_api_key" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">API Key (exchangerate-api.com)</Label>
                      <div className="relative">
                        <Input
                          id="exchange_rate_api_key"
                          type="password"
                          value={config_clinica.exchange_rate_api_key || ''}
                          onChange={(e) => setConfigClinica({ ...config_clinica, exchange_rate_api_key: e.target.value, exchange_rate_verificado: false })}
                          placeholder="Clave de API..."
                          className="bg-background pr-10"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {config_clinica.exchange_rate_verificado ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Obtén tu API Key gratuita en <a href="https://app.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">exchangerate-api.com</a>
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                         <div className="flex-1">
                            <Button
                              onClick={manejarGuardarYValidarDivisasApi}
                              disabled={guardando_divisas_api || !hayCambiosDivisasApi}
                              id={IDS_ELEMENTOS_CONFIGURACION.BTN_EXCHANGE_RATE_GUARDAR_VALIDAR}
                              size="sm"
                              className="w-full"
                              variant="default"
                            >
                              {guardando_divisas_api ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                              Guardar y Validar
                            </Button>
                        </div>
                    </div>
                  </div>

                  <div id={IDS_ELEMENTOS_CONFIGURACION.SECCION_HISTORICA} className="space-y-4 p-5 border rounded-xl bg-secondary/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          <History className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">Permitir Edición Histórica</h3>
                          <p className="text-xs text-muted-foreground">Crear citas y tratamientos en el pasado</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={!modo_edicion_historica ? 'default' : 'outline'}
                        onClick={() => manejarCambiarModoEdicionHistorica(false)}
                        disabled={guardando_modo_historico || !modo_edicion_historica}
                        id={IDS_ELEMENTOS_CONFIGURACION.BTN_MODO_NORMAL}
                        className="transition-all duration-200"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Modo normal
                      </Button>
                      <Button
                        type="button"
                        variant={modo_edicion_historica ? 'default' : 'outline'}
                        onClick={() => manejarCambiarModoEdicionHistorica(true)}
                        disabled={guardando_modo_historico || modo_edicion_historica}
                        id={IDS_ELEMENTOS_CONFIGURACION.BTN_MODO_HISTORICO}
                        className="transition-all duration-200"
                      >
                        <History className="mr-2 h-4 w-4" />
                        Edición histórica
                      </Button>
                    </div>

                    {guardando_modo_historico && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Actualizando configuración...
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Permite asignar el estado de pago al crear una cita.</p>
                      <p>Por seguridad, se desactiva automáticamente al iniciar sesión.</p>
                    </div>
                  </div>

                  <div id={IDS_ELEMENTOS_CONFIGURACION.SECCION_MODELO_ODONTOGRAMA} className="space-y-4 p-5 border rounded-xl bg-secondary/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">Modelo de dientes (Odontograma)</h3>
                          <p className="text-xs text-muted-foreground">Cambia el estilo de los dientes en todo el sistema</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={config_clinica.modelo_dientes_odontograma === 'cuadrado' ? 'default' : 'outline'}
                        onClick={() => manejarCambiarModeloOdontograma('cuadrado')}
                        disabled={guardando_modelo_odontograma}
                        id={IDS_ELEMENTOS_CONFIGURACION.BTN_MODELO_ODONTOGRAMA_CUADRADO}
                        className="transition-all duration-200"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md border bg-background">
                            <MolarCuadrado
                              baseSize={26}
                              modoAsignacion={false}
                              colores={{
                                top: 'white',
                                left: 'white',
                                right: 'white',
                                bottom: 'white',
                                center: 'white',
                                'root-1': 'white',
                                'root-2': 'white',
                                'root-3': 'white',
                              }}
                              eventos={{ onClick: () => {}, onEnter: () => {}, onLeave: () => {} }}
                            />
                          </div>
                          <span>Cuadrado</span>
                        </div>
                      </Button>

                      <Button
                        type="button"
                        variant={config_clinica.modelo_dientes_odontograma === 'circular' ? 'default' : 'outline'}
                        onClick={() => manejarCambiarModeloOdontograma('circular')}
                        disabled={guardando_modelo_odontograma}
                        id={IDS_ELEMENTOS_CONFIGURACION.BTN_MODELO_ODONTOGRAMA_CIRCULAR}
                        className="transition-all duration-200"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md border bg-background">
                            <MolarCircular
                              baseSize={26}
                              modoAsignacion={false}
                              colores={{
                                top: 'white',
                                left: 'white',
                                right: 'white',
                                bottom: 'white',
                                center: 'white',
                                'root-1': 'white',
                                'root-2': 'white',
                                'root-3': 'white',
                              }}
                              eventos={{ onClick: () => {}, onEnter: () => {}, onLeave: () => {} }}
                            />
                          </div>
                          <span>Circular</span>
                        </div>
                      </Button>
                    </div>

                    {guardando_modelo_odontograma && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Guardando modelo...
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>El modelo se guarda por clínica y se aplica al odontograma.</p>
                    </div>
                  </div>

                  <div id={IDS_ELEMENTOS_CONFIGURACION.SECCION_GEMINI} className="space-y-4 p-5 border rounded-xl bg-secondary/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                          <BrainCircuit className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">Inteligencia Artificial</h3>
                          <p className="text-xs text-muted-foreground">Conexión con Google Gemini</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {config_clinica.gemini_verificado ? (
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold border border-green-200 uppercase tracking-widest">
                            Activo
                          </span>
                        ) : (config_clinica.gemini_api_key || config_clinica.gemini_url_base) ? (
                          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold border border-yellow-200 uppercase tracking-widest">
                            Pendiente
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold border border-gray-200 uppercase tracking-widest">
                            Inactivo
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="gemini_api_key_extra" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Gemini API Key</Label>
                      <div className="relative">
                        <Input
                          id="gemini_api_key_extra"
                          type="password"
                          value={config_clinica.gemini_api_key || ''}
                          onChange={(e) => setConfigClinica({ ...config_clinica, gemini_api_key: e.target.value, gemini_verificado: false })}
                          placeholder="Clave de API..."
                          className="bg-background pr-10"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {config_clinica.gemini_verificado ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Necesaria para el asistente virtual y análisis de reportes.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <Label htmlFor="gemini_url_base_extra" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Endpoint del Modelo (URL Base)</Label>
                      <Input
                        id="gemini_url_base_extra"
                        value={config_clinica.gemini_url_base || ''}
                        onChange={(e) => setConfigClinica({ ...config_clinica, gemini_url_base: e.target.value, gemini_verificado: false })}
                        placeholder="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
                        className="bg-background text-xs font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        URL completa del endpoint de Gemini. Déjalo vacío para usar la predeterminada.
                      </p>
                    </div>

                    <Button
                      onClick={manejarGuardarConfiguracionIA}
                      disabled={guardando_ia || !hayCambiosIA}
                      id={IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_GEMINI}
                      size="sm"
                      className="w-full mt-2"
                      variant="secondary"
                    >
                      {guardando_ia ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Guardar Configuración IA
                    </Button>
                  </div>

                </CardContent>
              </Card>
              {!cargando_clinica && !config_clinica.moneda_configurada && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                  <Button
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.6)] bg-yellow-500 hover:bg-yellow-600 border-4 border-yellow-300 text-yellow-950"
                    onClick={() => {
                        moneda_ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setMonedaParpadeo(true);
                        setTimeout(() => setMonedaParpadeo(false), 2000);
                    }}
                  >
                    <ArrowDown className="h-8 w-8" />
                  </Button>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-lg font-bold shadow-md whitespace-nowrap border border-yellow-200">
                    ¡Configura tu moneda!
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="clinica" className="space-y-6 mt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card
                  id={IDS_ELEMENTOS_CONFIGURACION.CARD_CLINICA_CONFIG}
                  className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Personalización de la Clínica</CardTitle>
                        <CardDescription>Personaliza la identidad de tu consultorio</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {cargando_clinica ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-4">
                          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                          <p className="text-muted-foreground">Cargando configuración...</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3" id={IDS_ELEMENTOS_CONFIGURACION.SECCION_LOGO_CLINICA}>
                          <Label>Logo de la Clínica</Label>
                          <div className="flex items-center gap-4">
                            <div className="relative group">
                              <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200 overflow-hidden border-2 border-border">
                                {config_clinica.logo ? (
                                  <img src={config_clinica.logo} alt="Logo" className="h-full w-full object-contain" />
                                ) : (
                                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                              <label
                                id={IDS_ELEMENTOS_CONFIGURACION.BTN_CAMARA_LOGO}
                                htmlFor="logo-clinica-upload"
                                className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:scale-110 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-200"
                              >
                                <Camera className="h-4 w-4 text-primary-foreground" />
                              </label>
                              <input
                                ref={logo_clinica_input_ref}
                                id="logo-clinica-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={manejarSubirLogoClinica}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground mb-2">
                                Haz clic en el ícono de cámara para cambiar el logo
                              </p>
                              {config_clinica.logo && (
                                <Button
                                  id={IDS_ELEMENTOS_CONFIGURACION.BTN_QUITAR_LOGO}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setConfigClinica({ ...config_clinica, logo: '' });
                                    if (logo_clinica_input_ref.current) {
                                      logo_clinica_input_ref.current.value = '';
                                    }
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Quitar logo
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nombre_clinica">Nombre de la Clínica</Label>
                          <Input
                            id="nombre_clinica"
                            value={config_clinica.nombre_clinica}
                            onChange={(e) => setConfigClinica({ ...config_clinica, nombre_clinica: e.target.value })}
                            placeholder="Ej: Consultorio Dental Sonrisa"
                            className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                          />
                          <p className="text-xs text-muted-foreground">
                            Si está vacío, el mensaje de bienvenida no incluirá el nombre de la clínica
                          </p>
                        </div>
                        <div className="space-y-4">
                          <Label>Mensaje de Bienvenida</Label>
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="mensaje_antes" className="text-xs text-muted-foreground">Antes del nombre</Label>
                              <Input
                                id="mensaje_antes"
                                value={config_clinica.mensaje_bienvenida_antes}
                                onChange={(e) => setConfigClinica({ ...config_clinica, mensaje_bienvenida_antes: e.target.value })}
                                placeholder="Bienvenido,"
                                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mensaje_despues" className="text-xs text-muted-foreground">Después del nombre</Label>
                              <Input
                                id="mensaje_despues"
                                value={config_clinica.mensaje_bienvenida_despues}
                                onChange={(e) => setConfigClinica({ ...config_clinica, mensaje_bienvenida_despues: e.target.value })}
                                placeholder="¿qué haremos hoy?"
                                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                              />
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={manejarGuardarConfiguracionClinica}
                          disabled={guardando_clinica || !hayCambiosClinica}
                          className="w-full hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                          id={IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_CLINICA}
                        >
                          {guardando_clinica ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Guardar Configuración
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card
                  id={IDS_ELEMENTOS_CONFIGURACION.CARD_CLINICA_PREVIEW}
                  className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                        <Eye className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Vista Previa</CardTitle>
                        <CardDescription>Así se verá la página de inicio</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="p-6 rounded-xl bg-gradient-to-br from-background via-background to-secondary/20 border-2 border-border">
                      <div className="space-y-4">
                        {config_clinica.logo && (
                          <div className="flex justify-center mb-4" id={IDS_ELEMENTOS_CONFIGURACION.PREVIEW_LOGO}>
                            <div className="h-16 w-auto max-w-[200px] overflow-hidden">
                              <img
                                src={config_clinica.logo}
                                alt="Logo Preview"
                                className="h-full w-auto object-contain"
                              />
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <h1 className="text-2xl font-bold text-foreground tracking-tight">
                            {config_clinica.mensaje_bienvenida_antes}
                            <span className="text-primary">{usuario?.nombre}</span>
                            {config_clinica.mensaje_bienvenida_despues}
                          </h1>
                          <p className="text-lg text-muted-foreground">
                            Panel de control de tu consultorio dental
                            {config_clinica.nombre_clinica && (
                              <>
                                {' - '}
                                <span className="text-primary hover:text-yellow-500 transition-colors duration-200 cursor-default">
                                  {config_clinica.nombre_clinica}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                            <p className="text-xs text-muted-foreground">Pacientes</p>
                            <p className="text-lg font-bold text-foreground">--</p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                            <p className="text-xs text-muted-foreground">Citas Hoy</p>
                            <p className="text-lg font-bold text-foreground">--</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Los cambios se reflejarán en la página de inicio después de guardar
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card
                id={IDS_ELEMENTOS_CONFIGURACION.CARD_HORARIOS_LABORALES}
                className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Ajustes adicionales</CardTitle>
                        <CardDescription>Horarios laborables por día</CardDescription>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={manejarGuardarHorariosLaborales}
                      disabled={guardando_horarios || !hayCambiosHorarios || hay_errores_horarios}
                      id={IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_HORARIOS_LABORALES}
                      size="sm"
                      variant="secondary"
                      className="shrink-0"
                    >
                      {guardando_horarios ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Guardar horarios
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    {DIAS_SEMANA.map((dia) => {
                      const rangos = horarios_laborales[dia] || [];
                      const errorDia = errores_horarios[dia];

                      return (
                        <div
                          key={dia}
                          id={`config-clinica-horarios-dia-${dia}`}
                          className="space-y-3 p-4 rounded-xl border bg-background/50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold capitalize">{dia}</p>
                            {errorDia && (
                              <span className="text-xs text-destructive">{errorDia}</span>
                            )}
                          </div>

                          <div className="space-y-2">
                            {rangos.map((rango, indice) => (
                              <div
                                key={`${dia}-${indice}`}
                                className={
                                  `flex items-center gap-2 p-3 rounded-lg border bg-background transition-colors duration-700 ` +
                                  (intervalos_reordenados[dia]?.[indice]
                                    ? 'motion-reduce:animate-none animate-[pulse_2.6s_ease-in-out_1] border-green-500/30 bg-green-500/5'
                                    : '')
                                }
                              >
                                <div className="relative flex-1">
                                  <Input
                                    type="time"
                                    value={rango.inicio}
                                    onChange={(e) => actualizarIntervaloHorario(dia, indice, 'inicio', e.target.value)}
                                    className="w-full pr-9 input-hora-sin-reloj"
                                  />
                                  <Clock
                                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
                                    aria-hidden="true"
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">-</span>
                                <div className="relative flex-1">
                                  <Input
                                    type="time"
                                    value={rango.fin}
                                    onChange={(e) => actualizarIntervaloHorario(dia, indice, 'fin', e.target.value)}
                                    className="w-full pr-9 input-hora-sin-reloj"
                                  />
                                  <Clock
                                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
                                    aria-hidden="true"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => quitarIntervaloHorario(dia, indice)}
                                  className="text-muted-foreground hover:text-destructive"
                                  aria-label="Quitar horario"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => agregarIntervaloHorario(dia)}
                              id={`config-clinica-horarios-dia-${dia}-btn-agregar`}
                              className="w-full p-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/30 transition-all duration-200"
                            >
                              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Plus className="h-4 w-4" />
                                Agregar
                              </div>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Cada día inicia con 08:00–12:00 y 14:00–18:00. No se permiten horarios solapados.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="apariencia" className="space-y-6 mt-6">
              <Card id={IDS_ELEMENTOS_CONFIGURACION.CARD_APARIENCIA_TEMA} className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <Palette className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Tema de la Aplicación</CardTitle>
                      <CardDescription>
                        Selecciona el tema de colores que prefieras
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {Object.entries(temas_por_categoria).map(([categoria, temas]) => (
                    <div key={categoria} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-border"></div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-3">
                          {categoria}
                        </h3>
                        <div className="h-px flex-1 bg-border"></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {temas.map((tema_opcion) => {
                          const Icono = tema_opcion.icono;
                          const esta_activo = tema === tema_opcion.valor;

                          return (
                            <button
                              key={tema_opcion.valor}
                              onClick={() => cambiarTema(tema_opcion.valor as any)}
                              id={`config-apariencia-tema-${tema_opcion.valor}`}
                              className={`p-5 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${esta_activo
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg ${esta_activo ? 'bg-primary/20' : 'bg-secondary'
                                  }`}>
                                  <Icono className={`h-5 w-5 ${esta_activo ? 'text-primary' : 'text-muted-foreground'
                                    }`} />
                                </div>
                                <div className="text-left flex-1">
                                  <h4 className={`font-semibold text-base ${esta_activo ? 'text-primary' : 'text-foreground'
                                    }`}>
                                    {tema_opcion.nombre}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {tema_opcion.descripcion}
                                  </p>
                                </div>
                                {esta_activo && (
                                  <div className="bg-primary text-primary-foreground rounded-full p-1 flex-shrink-0">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {tema === 'personalizado' && (
                    <div id={IDS_ELEMENTOS_CONFIGURACION.PANEL_TEMA_PERSONALIZADO} className="p-4 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/20 p-2 rounded-lg">
                            <Settings2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Tema Personalizado Activo</h3>
                            <p className="text-sm text-muted-foreground">Haz clic para personalizar los colores</p>
                          </div>
                        </div>
                        <Button
                          id={IDS_ELEMENTOS_CONFIGURACION.BTN_PERSONALIZAR_COLORES}
                          onClick={() => {
                            setColoresTemporales({ ...colores_personalizados });
                            setTemaModificado(false);
                            setDialogoPersonalizadoAbierto(true);
                          }}
                          variant="outline"
                          className="hover:shadow-lg transition-all"
                        >
                          <Palette className="mr-2 h-4 w-4" />
                          Personalizar Colores
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-4">
                        {[
                          { color: colores_personalizados.background, tooltip: 'Fondo' },
                          { color: colores_personalizados.primary, tooltip: 'Primario' },
                          { color: colores_personalizados.secondary, tooltip: 'Secundario' },
                          { color: colores_personalizados.accent, tooltip: 'Acento' },
                          { color: colores_personalizados.muted, tooltip: 'Atenuado' },
                          { color: colores_personalizados.border, tooltip: 'Bordes' },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="h-6 w-6 rounded-md border border-border/50 shadow-sm"
                            style={{ backgroundColor: item.color }}
                            title={item.tooltip}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <Dialog
                    open={dialogo_personalizado_abierto}
                    onOpenChange={(open) => {
                      if (!open && tema_modificado) {
                        setDialogoConfirmarSalir(true);
                      } else {
                        setDialogoPersonalizadoAbierto(open);
                      }
                    }}
                  >
                    <DialogContent id={IDS_ELEMENTOS_CONFIGURACION.DIALOG_EDITOR_TEMA_PERSONALIZADO} className="max-w-5xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Settings2 className="h-5 w-5" />
                          Editor de Tema Personalizado
                        </DialogTitle>
                        <DialogDescription>
                          Los colores se aplican en tiempo real a la interfaz. Si cancelas, se revertirán automáticamente.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                          💡 Paletas de Inspiración
                        </h4>
                        <Tabs defaultValue="base" className="w-full">
                          <TabsList className="w-full grid grid-cols-6 mb-3">
                            <TabsTrigger value="base" className="text-xs">Base</TabsTrigger>
                            <TabsTrigger value="medico" className="text-xs">Médico</TabsTrigger>
                            <TabsTrigger value="claros" className="text-xs">Claros</TabsTrigger>
                            <TabsTrigger value="oscuros" className="text-xs">Oscuros</TabsTrigger>
                            <TabsTrigger value="especiales" className="text-xs">Especiales</TabsTrigger>
                            <TabsTrigger value="mono" className="text-xs">Mono</TabsTrigger>
                          </TabsList>

                          <TabsContent value="base" className="mt-0">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  nombre: 'Claro', colores: {
                                    background: '#ffffff', foreground: '#0a0a0a', primary: '#3b82f6', secondary: '#f1f5f9',
                                    accent: '#f1f5f9', muted: '#f1f5f9', border: '#e2e8f0',
                                    card: '#ffffff', cardForeground: '#0a0a0a', popover: '#ffffff', popoverForeground: '#0a0a0a',
                                    primaryForeground: '#f8fafc', secondaryForeground: '#1e293b', mutedForeground: '#64748b',
                                    accentForeground: '#1e293b', destructive: '#ef4444', destructiveForeground: '#f8fafc',
                                    input: '#e2e8f0', ring: '#3b82f6'
                                  }
                                },
                                {
                                  nombre: 'Oscuro', colores: {
                                    background: '#020817', foreground: '#e1e7ef', primary: '#f8fafc', secondary: '#1e293b',
                                    accent: '#1e3a5f', muted: '#1c1f26', border: '#1e3a5f',
                                    card: '#020817', cardForeground: '#e1e7ef', popover: '#020817', popoverForeground: '#e1e7ef',
                                    primaryForeground: '#1e293b', secondaryForeground: '#f8fafc', mutedForeground: '#8291a5',
                                    accentForeground: '#f8fafc', destructive: '#7f1d1d', destructiveForeground: '#f8fafc',
                                    input: '#1e3a5f', ring: '#1e3a5f'
                                  }
                                },
                                {
                                  nombre: 'Azul Océano', colores: {
                                    background: '#001a33', foreground: '#f5f9fc', primary: '#00bfff', secondary: '#0d2b47',
                                    accent: '#0f3354', muted: '#0d2b47', border: '#0f3354',
                                    card: '#002040', cardForeground: '#f5f9fc', popover: '#001a33', popoverForeground: '#f5f9fc',
                                    primaryForeground: '#001a33', secondaryForeground: '#f5f9fc', mutedForeground: '#8ab8d9',
                                    accentForeground: '#f5f9fc', destructive: '#e53e3e', destructiveForeground: '#f5f9fc',
                                    input: '#0d2b47', ring: '#00bfff'
                                  }
                                },
                              ].map((paleta) => (
                                <button key={paleta.nombre} onClick={() => { setColoresTemporales(paleta.colores); aplicarColoresPersonalizados(paleta.colores); setTemaModificado(true); }} className="p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left">
                                  <div className="flex gap-1 mb-1">{[paleta.colores.background, paleta.colores.primary, paleta.colores.secondary, paleta.colores.accent].map((c, i) => (<div key={i} className="h-4 w-4 rounded-sm border border-border/30" style={{ backgroundColor: c }} />))}</div>
                                  <span className="text-xs font-medium">{paleta.nombre}</span>
                                </button>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="medico" className="mt-0">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  nombre: 'Clínico Blanco', colores: {
                                    background: '#f7f9fb', foreground: '#1f2d3d', primary: '#0d8ccf', secondary: '#edf2f7',
                                    accent: '#c3e0f5', muted: '#edf2f7', border: '#d4dfe8',
                                    card: '#ffffff', cardForeground: '#1f2d3d', popover: '#ffffff', popoverForeground: '#1f2d3d',
                                    primaryForeground: '#ffffff', secondaryForeground: '#1f2d3d', mutedForeground: '#5c7185',
                                    accentForeground: '#1f2d3d', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#e6ecf2', ring: '#0d8ccf'
                                  }
                                },
                                {
                                  nombre: 'Menta Dental', colores: {
                                    background: '#0a1f1a', foreground: '#f2f7f5', primary: '#22c9a6', secondary: '#19332b',
                                    accent: '#1b3d32', muted: '#19332b', border: '#1b3d32',
                                    card: '#0d261f', cardForeground: '#f2f7f5', popover: '#0a1f1a', popoverForeground: '#f2f7f5',
                                    primaryForeground: '#0a1f1a', secondaryForeground: '#f2f7f5', mutedForeground: '#8ab3a5',
                                    accentForeground: '#f2f7f5', destructive: '#e53e3e', destructiveForeground: '#f2f7f5',
                                    input: '#19332b', ring: '#22c9a6'
                                  }
                                },
                                {
                                  nombre: 'Menta Claro', colores: {
                                    background: '#f5fbf9', foreground: '#133d31', primary: '#1b9e7d', secondary: '#e6f4f0',
                                    accent: '#d1ede4', muted: '#e6f4f0', border: '#c6e3da',
                                    card: '#ffffff', cardForeground: '#133d31', popover: '#ffffff', popoverForeground: '#133d31',
                                    primaryForeground: '#ffffff', secondaryForeground: '#133d31', mutedForeground: '#5c8576',
                                    accentForeground: '#133d31', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#d6ece5', ring: '#1b9e7d'
                                  }
                                },
                              ].map((paleta) => (
                                <button key={paleta.nombre} onClick={() => { setColoresTemporales(paleta.colores); aplicarColoresPersonalizados(paleta.colores); setTemaModificado(true); }} className="p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left">
                                  <div className="flex gap-1 mb-1">{[paleta.colores.background, paleta.colores.primary, paleta.colores.secondary, paleta.colores.accent].map((c, i) => (<div key={i} className="h-4 w-4 rounded-sm border border-border/30" style={{ backgroundColor: c }} />))}</div>
                                  <span className="text-xs font-medium">{paleta.nombre}</span>
                                </button>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="claros" className="mt-0">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  nombre: 'Azul Claro', colores: {
                                    background: '#f5faff', foreground: '#0a3a66', primary: '#0091e6', secondary: '#e6f4fc',
                                    accent: '#c2e5fa', muted: '#e6f4fc', border: '#c7e3f7',
                                    card: '#ffffff', cardForeground: '#0a3a66', popover: '#ffffff', popoverForeground: '#0a3a66',
                                    primaryForeground: '#ffffff', secondaryForeground: '#0a3a66', mutedForeground: '#5c7a94',
                                    accentForeground: '#0a3a66', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#e0f0fa', ring: '#0091e6'
                                  }
                                },
                                {
                                  nombre: 'Verde Claro', colores: {
                                    background: '#f5fcf7', foreground: '#133d1f', primary: '#22a352', secondary: '#e5f6eb',
                                    accent: '#c2ebd1', muted: '#e5f6eb', border: '#bce6cb',
                                    card: '#ffffff', cardForeground: '#133d1f', popover: '#ffffff', popoverForeground: '#133d1f',
                                    primaryForeground: '#ffffff', secondaryForeground: '#133d1f', mutedForeground: '#5c8568',
                                    accentForeground: '#133d1f', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#daf2e3', ring: '#22a352'
                                  }
                                },
                                {
                                  nombre: 'Rosa Claro', colores: {
                                    background: '#fdf5f8', foreground: '#3d1328', primary: '#db2778', secondary: '#fae6ed',
                                    accent: '#f5c7db', muted: '#fae6ed', border: '#f2bdd4',
                                    card: '#ffffff', cardForeground: '#3d1328', popover: '#ffffff', popoverForeground: '#3d1328',
                                    primaryForeground: '#ffffff', secondaryForeground: '#3d1328', mutedForeground: '#855c6e',
                                    accentForeground: '#3d1328', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#f5d9e5', ring: '#db2778'
                                  }
                                },
                                {
                                  nombre: 'Beige Claro', colores: {
                                    background: '#faf8f5', foreground: '#3d2914', primary: '#a36b2b', secondary: '#f2ebe2',
                                    accent: '#e0d1be', muted: '#f2ebe2', border: '#d9cab5',
                                    card: '#fcfaf8', cardForeground: '#3d2914', popover: '#fcfaf8', popoverForeground: '#3d2914',
                                    primaryForeground: '#ffffff', secondaryForeground: '#3d2914', mutedForeground: '#7a6652',
                                    accentForeground: '#3d2914', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#ede4d9', ring: '#a36b2b'
                                  }
                                },
                                {
                                  nombre: 'Morado Claro', colores: {
                                    background: '#faf5ff', foreground: '#3d1366', primary: '#9333ea', secondary: '#f0e6fa',
                                    accent: '#e0c7f5', muted: '#f0e6fa', border: '#d4b8f0',
                                    card: '#ffffff', cardForeground: '#3d1366', popover: '#ffffff', popoverForeground: '#3d1366',
                                    primaryForeground: '#ffffff', secondaryForeground: '#3d1366', mutedForeground: '#7a5c94',
                                    accentForeground: '#3d1366', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#e8d9f5', ring: '#9333ea'
                                  }
                                },
                                {
                                  nombre: 'Naranja Claro', colores: {
                                    background: '#fffbf5', foreground: '#662200', primary: '#ea580c', secondary: '#faeade',
                                    accent: '#f5d1b8', muted: '#faeade', border: '#f0c4a6',
                                    card: '#ffffff', cardForeground: '#662200', popover: '#ffffff', popoverForeground: '#662200',
                                    primaryForeground: '#ffffff', secondaryForeground: '#662200', mutedForeground: '#946652',
                                    accentForeground: '#662200', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#f5e0cc', ring: '#ea580c'
                                  }
                                },
                              ].map((paleta) => (
                                <button key={paleta.nombre} onClick={() => { setColoresTemporales(paleta.colores); aplicarColoresPersonalizados(paleta.colores); setTemaModificado(true); }} className="p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left">
                                  <div className="flex gap-1 mb-1">{[paleta.colores.background, paleta.colores.primary, paleta.colores.secondary, paleta.colores.accent].map((c, i) => (<div key={i} className="h-4 w-4 rounded-sm border border-border/30" style={{ backgroundColor: c }} />))}</div>
                                  <span className="text-xs font-medium">{paleta.nombre}</span>
                                </button>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="oscuros" className="mt-0">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  nombre: 'Verde Bosque', colores: {
                                    background: '#0f1a14', foreground: '#f0f5f2', primary: '#22c55e', secondary: '#152618',
                                    accent: '#1a321f', muted: '#152618', border: '#1a321f',
                                    card: '#142117', cardForeground: '#f0f5f2', popover: '#0f1a14', popoverForeground: '#f0f5f2',
                                    primaryForeground: '#0f1a14', secondaryForeground: '#f0f5f2', mutedForeground: '#8aab95',
                                    accentForeground: '#f0f5f2', destructive: '#e53e3e', destructiveForeground: '#f0f5f2',
                                    input: '#152618', ring: '#22c55e'
                                  }
                                },
                                {
                                  nombre: 'Rosa Elegante', colores: {
                                    background: '#1f0a14', foreground: '#f6e4ed', primary: '#e5619e', secondary: '#2e1220',
                                    accent: '#3a1629', muted: '#2e1220', border: '#3a1629',
                                    card: '#261019', cardForeground: '#f6e4ed', popover: '#1f0a14', popoverForeground: '#f6e4ed',
                                    primaryForeground: '#1f0a14', secondaryForeground: '#f6e4ed', mutedForeground: '#b38a9f',
                                    accentForeground: '#f6e4ed', destructive: '#e53e3e', destructiveForeground: '#f6e4ed',
                                    input: '#2e1220', ring: '#e5619e'
                                  }
                                },
                                {
                                  nombre: 'Morado Real', colores: {
                                    background: '#170a1f', foreground: '#f0e4f6', primary: '#a855f7', secondary: '#221231',
                                    accent: '#2c173f', muted: '#221231', border: '#2c173f',
                                    card: '#1c0e28', cardForeground: '#f0e4f6', popover: '#170a1f', popoverForeground: '#f0e4f6',
                                    primaryForeground: '#170a1f', secondaryForeground: '#f0e4f6', mutedForeground: '#a08ab3',
                                    accentForeground: '#f0e4f6', destructive: '#e53e3e', destructiveForeground: '#f0e4f6',
                                    input: '#221231', ring: '#a855f7'
                                  }
                                },
                                {
                                  nombre: 'Naranja Fuego', colores: {
                                    background: '#211108', foreground: '#f7ede4', primary: '#f97316', secondary: '#332011',
                                    accent: '#402715', muted: '#332011', border: '#402715',
                                    card: '#29160b', cardForeground: '#f7ede4', popover: '#211108', popoverForeground: '#f7ede4',
                                    primaryForeground: '#211108', secondaryForeground: '#f7ede4', mutedForeground: '#b3988a',
                                    accentForeground: '#f7ede4', destructive: '#e53e3e', destructiveForeground: '#f7ede4',
                                    input: '#332011', ring: '#f97316'
                                  }
                                },
                                {
                                  nombre: 'Gris Neutro', colores: {
                                    background: '#1a1a1a', foreground: '#f2f2f2', primary: '#bfbfbf', secondary: '#2e2e2e',
                                    accent: '#383838', muted: '#2e2e2e', border: '#383838',
                                    card: '#1f1f1f', cardForeground: '#f2f2f2', popover: '#1a1a1a', popoverForeground: '#f2f2f2',
                                    primaryForeground: '#1a1a1a', secondaryForeground: '#f2f2f2', mutedForeground: '#a6a6a6',
                                    accentForeground: '#f2f2f2', destructive: '#e53e3e', destructiveForeground: '#f2f2f2',
                                    input: '#2e2e2e', ring: '#bfbfbf'
                                  }
                                },
                              ].map((paleta) => (
                                <button key={paleta.nombre} onClick={() => { setColoresTemporales(paleta.colores); aplicarColoresPersonalizados(paleta.colores); setTemaModificado(true); }} className="p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left">
                                  <div className="flex gap-1 mb-1">{[paleta.colores.background, paleta.colores.primary, paleta.colores.secondary, paleta.colores.accent].map((c, i) => (<div key={i} className="h-4 w-4 rounded-sm border border-border/30" style={{ backgroundColor: c }} />))}</div>
                                  <span className="text-xs font-medium">{paleta.nombre}</span>
                                </button>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="especiales" className="mt-0">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  nombre: 'Cielo Abierto', colores: {
                                    background: '#f0fbff', foreground: '#0a3a52', primary: '#0099cc', secondary: '#d9f4fc',
                                    accent: '#a8e4f5', muted: '#f0fbff', border: '#66c9e6',
                                    card: '#ffffff', cardForeground: '#0a3a52', popover: '#ffffff', popoverForeground: '#0a3a52',
                                    primaryForeground: '#ffffff', secondaryForeground: '#0a3a52', mutedForeground: '#5c8a9e',
                                    accentForeground: '#0a3a52', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#d6f0fa', ring: '#0099cc'
                                  }
                                },
                                {
                                  nombre: 'Esmeralda', colores: {
                                    background: '#ecfdf5', foreground: '#064e3b', primary: '#10b981', secondary: '#d1fae5',
                                    accent: '#a7f3d0', muted: '#ecfdf5', border: '#6ee7b7',
                                    card: '#ffffff', cardForeground: '#064e3b', popover: '#ffffff', popoverForeground: '#064e3b',
                                    primaryForeground: '#ffffff', secondaryForeground: '#064e3b', mutedForeground: '#4d7c6b',
                                    accentForeground: '#064e3b', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#ccf5e7', ring: '#10b981'
                                  }
                                },
                                {
                                  nombre: 'Atardecer', colores: {
                                    background: '#1a1a2e', foreground: '#ebebeb', primary: '#e94560', secondary: '#16213e',
                                    accent: '#0f3460', muted: '#16213e', border: '#0f3460',
                                    card: '#1a1a2e', cardForeground: '#ebebeb', popover: '#1a1a2e', popoverForeground: '#ebebeb',
                                    primaryForeground: '#ffffff', secondaryForeground: '#ebebeb', mutedForeground: '#b3b3b3',
                                    accentForeground: '#ebebeb', destructive: '#7f1d1d', destructiveForeground: '#ffffff',
                                    input: '#0f3460', ring: '#e94560'
                                  }
                                },
                                {
                                  nombre: 'Café con Leche', colores: {
                                    background: '#faf6f1', foreground: '#3d2914', primary: '#8b5a2b', secondary: '#f5ebe0',
                                    accent: '#e6d5c3', muted: '#faf6f1', border: '#d4c4b0',
                                    card: '#fcfaf8', cardForeground: '#3d2914', popover: '#fcfaf8', popoverForeground: '#3d2914',
                                    primaryForeground: '#ffffff', secondaryForeground: '#3d2914', mutedForeground: '#7a6652',
                                    accentForeground: '#3d2914', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#ede4d9', ring: '#8b5a2b'
                                  }
                                },
                                {
                                  nombre: 'Ártico', colores: {
                                    background: '#f8fafc', foreground: '#1e293b', primary: '#0f172a', secondary: '#e2e8f0',
                                    accent: '#cbd5e1', muted: '#f1f5f9', border: '#94a3b8',
                                    card: '#f8fafc', cardForeground: '#1e293b', popover: '#f8fafc', popoverForeground: '#1e293b',
                                    primaryForeground: '#ffffff', secondaryForeground: '#1e293b', mutedForeground: '#64748b',
                                    accentForeground: '#1e293b', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#cbd5e1', ring: '#0f172a'
                                  }
                                },
                                {
                                  nombre: 'Neón Cyber', colores: {
                                    background: '#0d0d0d', foreground: '#00ff88', primary: '#00ff88', secondary: '#1a1a1a',
                                    accent: '#262626', muted: '#1a1a1a', border: '#333333',
                                    card: '#0d0d0d', cardForeground: '#00ff88', popover: '#0d0d0d', popoverForeground: '#00ff88',
                                    primaryForeground: '#000000', secondaryForeground: '#00ff88', mutedForeground: '#00b362',
                                    accentForeground: '#00ff88', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#262626', ring: '#00ff88'
                                  }
                                },
                                {
                                  nombre: 'Vintage Sepia', colores: {
                                    background: '#f5f0e8', foreground: '#4a3728', primary: '#8b4513', secondary: '#ebe5db',
                                    accent: '#ddd5c7', muted: '#f5f0e8', border: '#c9bfae',
                                    card: '#f5f0e8', cardForeground: '#4a3728', popover: '#f5f0e8', popoverForeground: '#4a3728',
                                    primaryForeground: '#ffffff', secondaryForeground: '#4a3728', mutedForeground: '#7a6b5c',
                                    accentForeground: '#4a3728', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#e0d8cc', ring: '#8b4513'
                                  }
                                },
                                {
                                  nombre: 'Azul Hielo', colores: {
                                    background: '#f0f8ff', foreground: '#1a365d', primary: '#1e90ff', secondary: '#e6f3ff',
                                    accent: '#b8dcff', muted: '#f0f8ff', border: '#87ceeb',
                                    card: '#ffffff', cardForeground: '#1a365d', popover: '#ffffff', popoverForeground: '#1a365d',
                                    primaryForeground: '#ffffff', secondaryForeground: '#1a365d', mutedForeground: '#5c7a99',
                                    accentForeground: '#1a365d', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#cce8ff', ring: '#1e90ff'
                                  }
                                },
                              ].map((paleta) => (
                                <button key={paleta.nombre} onClick={() => { setColoresTemporales(paleta.colores); aplicarColoresPersonalizados(paleta.colores); setTemaModificado(true); }} className="p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left">
                                  <div className="flex gap-1 mb-1">{[paleta.colores.background, paleta.colores.primary, paleta.colores.secondary, paleta.colores.accent].map((c, i) => (<div key={i} className="h-4 w-4 rounded-sm border border-border/30" style={{ backgroundColor: c }} />))}</div>
                                  <span className="text-xs font-medium">{paleta.nombre}</span>
                                </button>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="mono" className="mt-0">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  nombre: 'Monocromático Claro', colores: {
                                    background: '#ffffff', foreground: '#141414', primary: '#262626', secondary: '#f5f5f5',
                                    accent: '#ebebeb', muted: '#f5f5f5', border: '#e0e0e0',
                                    card: '#ffffff', cardForeground: '#141414', popover: '#ffffff', popoverForeground: '#141414',
                                    primaryForeground: '#ffffff', secondaryForeground: '#262626', mutedForeground: '#737373',
                                    accentForeground: '#262626', destructive: '#595959', destructiveForeground: '#ffffff',
                                    input: '#ebebeb', ring: '#404040'
                                  }
                                },
                                {
                                  nombre: 'Monocromático Oscuro', colores: {
                                    background: '#0a0a0a', foreground: '#f5f5f5', primary: '#e6e6e6', secondary: '#1f1f1f',
                                    accent: '#292929', muted: '#1f1f1f', border: '#333333',
                                    card: '#0f0f0f', cardForeground: '#f5f5f5', popover: '#0a0a0a', popoverForeground: '#f5f5f5',
                                    primaryForeground: '#0a0a0a', secondaryForeground: '#e6e6e6', mutedForeground: '#999999',
                                    accentForeground: '#e6e6e6', destructive: '#b3b3b3', destructiveForeground: '#0a0a0a',
                                    input: '#262626', ring: '#cccccc'
                                  }
                                },
                              ].map((paleta) => (
                                <button key={paleta.nombre} onClick={() => { setColoresTemporales(paleta.colores); aplicarColoresPersonalizados(paleta.colores); setTemaModificado(true); }} className="p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left">
                                  <div className="flex gap-1 mb-1">{[paleta.colores.background, paleta.colores.primary, paleta.colores.secondary, paleta.colores.accent].map((c, i) => (<div key={i} className="h-4 w-4 rounded-sm border border-border/30" style={{ backgroundColor: c }} />))}</div>
                                  <span className="text-xs font-medium">{paleta.nombre}</span>
                                </button>
                              ))}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Ajustar Colores</h4>
                          {colores_temporales && [
                            { campo: 'background' as const, nombre: 'Fondo', descripcion: 'Fondo principal de toda la app' },
                            { campo: 'foreground' as const, nombre: 'Texto', descripcion: 'Color del texto e iconos' },
                            { campo: 'primary' as const, nombre: 'Primario', descripcion: 'Botones principales, enlaces activos' },
                            { campo: 'secondary' as const, nombre: 'Secundario', descripcion: 'Tarjetas, áreas destacadas' },
                            { campo: 'accent' as const, nombre: 'Acento', descripcion: 'Hover, elementos seleccionados' },
                            { campo: 'muted' as const, nombre: 'Atenuado', descripcion: 'Fondos sutiles, placeholders' },
                            { campo: 'border' as const, nombre: 'Bordes', descripcion: 'Líneas divisorias, contornos' },
                          ].map(({ campo, nombre, descripcion }) => (
                            <div key={campo} className="flex items-start gap-3">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    className="h-10 w-10 rounded-lg border-2 border-border shadow-md cursor-pointer flex-shrink-0 hover:scale-105 transition-transform"
                                    style={{ backgroundColor: colores_temporales[campo] }}
                                  />
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3" align="start">
                                  <HexColorPicker
                                    color={colores_temporales[campo]}
                                    onChange={(color) => {
                                      const nuevos = { ...colores_temporales, [campo]: color };
                                      setColoresTemporales(nuevos);
                                      aplicarColoresPersonalizados(nuevos);
                                      setTemaModificado(true);
                                    }}
                                  />
                                  <Input
                                    value={colores_temporales[campo]}
                                    onChange={(e) => {
                                      const nuevos = { ...colores_temporales, [campo]: e.target.value };
                                      setColoresTemporales(nuevos);
                                      aplicarColoresPersonalizados(nuevos);
                                      setTemaModificado(true);
                                    }}
                                    className="mt-2 font-mono text-xs"
                                    placeholder="#000000"
                                  />
                                </PopoverContent>
                              </Popover>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{nombre}</span>
                                  <span className="text-xs font-mono text-muted-foreground">{colores_temporales[campo]}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{descripcion}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Vista Previa (También mira la interfaz real)
                          </h4>
                          {colores_temporales && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colores_temporales.background, border: `1px solid ${colores_temporales.border}` }}>
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: colores_temporales.background, border: '1px solid #888' }} />
                                  <span style={{ color: colores_temporales.foreground || '#000' }}>Fondo</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colores_temporales.primary }}>
                                  <div className="w-3 h-3 rounded bg-white/30" />
                                  <span className="text-white">Primario</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colores_temporales.secondary, border: `1px solid ${colores_temporales.border}` }}>
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: colores_temporales.secondary, border: '1px solid #888' }} />
                                  <span style={{ color: colores_temporales.foreground || '#000' }}>Secundario</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colores_temporales.accent, border: `1px solid ${colores_temporales.border}` }}>
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: colores_temporales.accent, border: '1px solid #888' }} />
                                  <span style={{ color: colores_temporales.foreground || '#000' }}>Acento</span>
                                </div>
                              </div>
                              <div
                                className="rounded-xl border-2 overflow-hidden shadow-lg"
                                style={{
                                  backgroundColor: colores_temporales.background,
                                  borderColor: colores_temporales.border
                                }}
                              >
                                <div className="flex">
                                  <div
                                    className="w-12 p-2 flex flex-col gap-2 border-r"
                                    style={{ backgroundColor: colores_temporales.secondary, borderColor: colores_temporales.border }}
                                  >
                                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: colores_temporales.primary }} />
                                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: colores_temporales.muted }} />
                                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: colores_temporales.accent }} />
                                  </div>
                                  <div className="flex-1 p-3">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="font-semibold text-sm" style={{ color: colores_temporales.foreground || (colores_temporales.background === '#ffffff' ? '#0a0a0a' : '#fafafa') }}>
                                        Panel Principal
                                      </span>
                                      <button
                                        className="px-2 py-1 text-xs rounded"
                                        style={{ backgroundColor: colores_temporales.primary, color: '#fff' }}
                                      >
                                        Acción
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                      <div
                                        className="p-2 rounded-lg border"
                                        style={{ backgroundColor: colores_temporales.secondary, borderColor: colores_temporales.border }}
                                      >
                                        <div className="text-xs font-medium mb-1" style={{ color: colores_temporales.foreground || '#000' }}>Tarjeta</div>
                                        <div className="text-[10px]" style={{ color: colores_temporales.foreground ? `${colores_temporales.foreground}99` : '#666' }}>Contenido</div>
                                      </div>
                                      <div
                                        className="p-2 rounded-lg"
                                        style={{ backgroundColor: colores_temporales.accent }}
                                      >
                                        <div className="text-xs font-medium mb-1" style={{ color: colores_temporales.foreground || '#000' }}>Activo</div>
                                        <div className="text-[10px]" style={{ color: colores_temporales.foreground ? `${colores_temporales.foreground}99` : '#666' }}>Seleccionado</div>
                                      </div>
                                    </div>
                                    <div
                                      className="p-2 rounded border text-xs"
                                      style={{
                                        backgroundColor: colores_temporales.muted,
                                        borderColor: colores_temporales.border,
                                        color: colores_temporales.foreground ? `${colores_temporales.foreground}66` : '#999'
                                      }}
                                    >
                                      Campo de texto...
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-muted-foreground text-center">
                                👆 Mira también la interfaz real detrás de este diálogo
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <DialogFooter className="mt-6 flex gap-2">
                        <Button
                          id={IDS_ELEMENTOS_CONFIGURACION.BTN_CANCELAR_EDITOR_TEMA}
                          variant="outline"
                          onClick={() => {
                            if (tema_modificado) {
                              setDialogoConfirmarSalir(true);
                            } else {
                              setDialogoPersonalizadoAbierto(false);
                            }
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={async () => {
                            if (colores_temporales) {
                              await guardarTemaPersonalizado(colores_temporales);
                              setTemaModificado(false);
                              setDialogoPersonalizadoAbierto(false);
                            }
                          }}
                          disabled={guardando_tema}
                        >
                          {guardando_tema ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Guardar y Aplicar
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={dialogo_confirmar_salir} onOpenChange={setDialogoConfirmarSalir}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>¿Descartar cambios?</DialogTitle>
                        <DialogDescription>
                          Tienes cambios sin guardar en tu tema personalizado. ¿Estás seguro de que quieres salir?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDialogoConfirmarSalir(false)}
                        >
                          Volver al editor
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            aplicarColoresPersonalizados(colores_personalizados);
                            setDialogoConfirmarSalir(false);
                            setDialogoPersonalizadoAbierto(false);
                            setTemaModificado(false);
                          }}
                        >
                          Descartar cambios
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg mt-1">
                        <Palette className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-foreground mb-1">
                          Tema Actual: {temas_disponibles.find(t => t.valor === tema)?.nombre}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Tema efectivo: {obtenerNombreTemaEfectivo()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Los cambios de tema se aplican inmediatamente y se guardan automáticamente.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catalogos" className="space-y-6 mt-6">
              <Card id={IDS_ELEMENTOS_CONFIGURACION.CARD_CATALOGOS_GESTION} className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Gestión de Catálogos</CardTitle>
                      <CardDescription>
                        Administra las opciones predefinidas para tus pacientes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <GestionTamanosPapel
                    seccionExpandida={esSeccionCatalogosAbierta('config-catalogos-tamanos-hoja')}
                    onCambiarSeccionExpandida={(abierta) =>
                      setSeccionCatalogosAbierta('config-catalogos-tamanos-hoja', abierta)
                    }
                  />
                  <div className="border-t border-border" />
                  <GestionCatalogo
                    idBase="config-catalogos-alergias"
                    titulo="Alergias"
                    items={alergias}
                    cargando={cargando_catalogos}
                    seccionExpandida={esSeccionCatalogosAbierta('config-catalogos-alergias')}
                    onCambiarSeccionExpandida={(abierta) =>
                      setSeccionCatalogosAbierta('config-catalogos-alergias', abierta)
                    }
                    onCrear={(datos) => catalogoApi.crearAlergia(datos)}
                    onActualizar={(id, datos) => catalogoApi.actualizarAlergia(id, datos)}
                    onEliminar={(id) => catalogoApi.eliminarAlergia(id)}
                    onRecargar={cargarCatalogos}
                    placeholderNombre="Ej: Penicilina, Polen, Mariscos"
                    placeholderDescripcion="Describe los síntomas o severidad de la alergia..."
                    ayudaNombre="Ingresa el nombre de la alergia del paciente"
                    ayudaDescripcion="Opcional: Agrega información adicional como reacciones o nivel de gravedad"
                  />

                  <div className="border-t border-border" />

                  <GestionCatalogo
                    idBase="config-catalogos-enfermedades"
                    titulo="Enfermedades"
                    items={enfermedades}
                    cargando={cargando_catalogos}
                    seccionExpandida={esSeccionCatalogosAbierta('config-catalogos-enfermedades')}
                    onCambiarSeccionExpandida={(abierta) =>
                      setSeccionCatalogosAbierta('config-catalogos-enfermedades', abierta)
                    }
                    onCrear={(datos) => catalogoApi.crearEnfermedad(datos)}
                    onActualizar={(id, datos) => catalogoApi.actualizarEnfermedad(id, datos)}
                    onEliminar={(id) => catalogoApi.eliminarEnfermedad(id)}
                    onRecargar={cargarCatalogos}
                    placeholderNombre="Ej: Diabetes, Hipertensión, Asma"
                    placeholderDescripcion="Describe el tipo o características de la enfermedad..."
                    ayudaNombre="Ingresa el nombre de la enfermedad o condición médica"
                    ayudaDescripcion="Opcional: Agrega información sobre tipo, grado o control de la enfermedad"
                  />

                  <div className="border-t border-border" />

                  <GestionCatalogo
                    idBase="config-catalogos-medicamentos"
                    titulo="Medicamentos"
                    items={medicamentos}
                    cargando={cargando_catalogos}
                    seccionExpandida={esSeccionCatalogosAbierta('config-catalogos-medicamentos')}
                    onCambiarSeccionExpandida={(abierta) =>
                      setSeccionCatalogosAbierta('config-catalogos-medicamentos', abierta)
                    }
                    onCrear={(datos) => catalogoApi.crearMedicamento(datos)}
                    onActualizar={(id, datos) => catalogoApi.actualizarMedicamento(id, datos)}
                    onEliminar={(id) => catalogoApi.eliminarMedicamento(id)}
                    onRecargar={cargarCatalogos}
                    placeholderNombre="Ej: Ibuprofeno, Amoxicilina, Losartán"
                    placeholderDescripcion="Describe la dosis, frecuencia o indicaciones..."
                    ayudaNombre="Ingresa el nombre del medicamento"
                    ayudaDescripcion="Opcional: Agrega información sobre presentación, dosis típica o uso común"
                  />



                  <div className="border-t border-border" />

                  <GestionCatalogo
                    idBase="config-catalogos-colores"
                    titulo="Colores de Categoría"
                    items={colores}
                    cargando={cargando_catalogos}
                    seccionExpandida={esSeccionCatalogosAbierta('config-catalogos-colores')}
                    onCambiarSeccionExpandida={(abierta) => setSeccionCatalogosAbierta('config-catalogos-colores', abierta)}
                    onCrear={(datos) => catalogoApi.crearColor(datos)}
                    onActualizar={(id, datos) => catalogoApi.actualizarColor(id, datos)}
                    onEliminar={(id) => catalogoApi.eliminarColor(id)}
                    onRecargar={cargarCatalogos}
                    permitirColor={true}
                    placeholderNombre="Ej: Urgente, Seguimiento, Revisión"
                    placeholderDescripcion="Describe cuándo usar esta categoría..."
                    ayudaNombre="Ingresa el nombre de la categoría o estado"
                    ayudaDescripcion="Opcional: Explica el propósito o cuándo aplicar este color"
                  />

                  <div className="border-t border-border" />

                  <GestionCatalogo
                    idBase="config-catalogos-etiquetas-plantillas"
                    titulo="Etiquetas de Plantillas"
                    items={etiquetas_plantillas}
                    cargando={cargando_catalogos}
                    seccionExpandida={esSeccionCatalogosAbierta('config-catalogos-etiquetas-plantillas')}
                    onCambiarSeccionExpandida={(abierta) =>
                      setSeccionCatalogosAbierta('config-catalogos-etiquetas-plantillas', abierta)
                    }
                    onCrear={(datos) => catalogoApi.crearEtiquetaPlantilla(datos)}
                    onActualizar={(id, datos) => catalogoApi.actualizarEtiquetaPlantilla(id, datos)}
                    onEliminar={(id) => catalogoApi.eliminarEtiquetaPlantilla(id)}
                    onRecargar={cargarCatalogos}
                    permitirCodigo={true}
                    placeholderNombre="Ej: Nombre del Paciente, Fecha de Nacimiento"
                    placeholderDescripcion="Describe qué información reemplazará esta etiqueta..."
                    placeholderCodigo="Ej: [PACIENTE_NOMBRE], [FECHA_NAC]"
                    ayudaNombre="Ingresa un nombre descriptivo para esta etiqueta"
                    ayudaDescripcion="Opcional: Explica qué tipo de información dinámica representa esta etiqueta"
                  />

                  <div className="border-t border-border" />

                  <GestionSimbologia
                    seccionExpandida={esSeccionCatalogosAbierta('config-catalogos-simbologia')}
                    onCambiarSeccionExpandida={(abierta) =>
                      setSeccionCatalogosAbierta('config-catalogos-simbologia', abierta)
                    }
                  />
                </CardContent>
              </Card>

              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <DownloadCloud className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Migración de Datos</CardTitle>
                      <CardDescription>
                        Exporta docs-0d3nt y la base de datos en un solo archivo
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/40 transition-colors"
                    onClick={() =>
                      setSeccionCatalogosAbierta(
                        'config-catalogos-migracion-datos',
                        !seccion_migracion_datos_abierta,
                      )
                    }
                  >
                    <div className="text-left">
                      <div className="font-semibold text-foreground">Migración de Datos</div>
                      <div className="text-xs text-muted-foreground">
                        Genera un archivo migracion-0d3nt-… en Descargas
                      </div>
                    </div>
                    <ArrowDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform',
                        seccion_migracion_datos_abierta ? 'rotate-180' : 'rotate-0',
                      )}
                    />
                  </button>

                  {seccion_migracion_datos_abierta && (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                          Se generará un archivo de migración con todos los documentos (docs-0d3nt)
                          y un export de la base de datos en formato SQL.
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:shrink-0">
                          <Button
                            onClick={() => setDialogoMigracionFormatoAbierto(true)}
                            disabled={!!estado_migracion?.en_progreso}
                          >
                            <DownloadCloud className="h-4 w-4 mr-2" />
                            Migrar
                          </Button>

                          {!!estado_migracion?.en_progreso && (
                            <Button
                              variant="outline"
                              onClick={() => setDialogoMigracionProgresoAbierto(true)}
                            >
                              Ver progreso
                            </Button>
                          )}
                        </div>
                      </div>

                      {!!estado_migracion?.en_progreso && (
                        <div className="text-xs text-muted-foreground">
                          Migración en curso: se bloquearán operaciones de escritura hasta finalizar.
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Dialog
                open={dialogo_migracion_formato_abierto}
                onOpenChange={(abierto) => {
                  if (migracion_iniciando) return;
                  setDialogoMigracionFormatoAbierto(abierto);
                }}
              >
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Migración de Datos</DialogTitle>
                    <DialogDescription>
                      Elige el formato del archivo de migración. En Windows se recomienda .zip.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <Select
                      value={formato_migracion}
                      onValueChange={(v) => setFormatoMigracion(v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zip">.zip (recomendado)</SelectItem>
                        <SelectItem value="rar">.rar</SelectItem>
                        <SelectItem value="tar.gz">.tar.gz</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      Si el formato elegido no está disponible, se usará el más compatible y se avisará.
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDialogoMigracionFormatoAbierto(false)}
                      disabled={migracion_iniciando}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={iniciarMigracion} disabled={migracion_iniciando}>
                      {migracion_iniciando ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Iniciando…
                        </>
                      ) : (
                        <>
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Migrar
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={dialogo_migracion_progreso_abierto}
                onOpenChange={(abierto) => {
                  if (!abierto && migracion_bloquea_cierre) return;
                  setDialogoMigracionProgresoAbierto(abierto);
                }}
              >
                <DialogContent
                  className="sm:max-w-lg"
                  closeDisabled={migracion_bloquea_cierre}
                  onEscapeKeyDown={(e) => {
                    if (migracion_bloquea_cierre) e.preventDefault();
                  }}
                  onInteractOutside={(e) => {
                    if (migracion_bloquea_cierre) e.preventDefault();
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>Migración en progreso</DialogTitle>
                    <DialogDescription>
                      Este proceso no puede cerrarse hasta que finalice.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <Progress value={estado_migracion?.progreso ?? 0} />
                    <div className="text-sm text-foreground">
                      {estado_migracion?.mensaje ||
                        (estado_migracion?.en_progreso
                          ? 'Procesando…'
                          : estado_migracion?.error
                            ? 'Ocurrió un error.'
                            : 'Listo.')}
                    </div>

                    {!!estado_migracion?.advertencias?.length && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        {estado_migracion.advertencias.map((w, idx) => (
                          <div key={idx}>• {w}</div>
                        ))}
                      </div>
                    )}

                    {!!estado_migracion?.error && (
                      <div className="text-sm text-destructive">{estado_migracion.error}</div>
                    )}

                    {!!estado_migracion?.archivo_salida && !estado_migracion?.en_progreso && (
                      <div className="text-xs text-muted-foreground break-all">
                        Archivo generado: {estado_migracion.archivo_salida}
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={() => setDialogoMigracionProgresoAbierto(false)}
                      disabled={migracion_bloquea_cierre}
                    >
                      Cerrar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
          </div>
        </div>

        <TutorialModalWrapper tema="Configuración" />
      </div>
    </ProveedorTutorialesPagina>
  );
}
