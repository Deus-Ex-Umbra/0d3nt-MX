import { useAutenticacion } from "@/contextos/autenticacion-contexto";
import { useState, useEffect, useMemo, useCallback } from "react";
import { MenuLateral } from "@/componentes/MenuLateral";
import { TituloAccionable } from "@/componentes/tutoriales/titulo-accionable";
import { TutorialModalWrapper } from '@/componentes/tutoriales/tutorial-modal-wrapper';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/componentes/ui/card";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/componentes/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/componentes/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/componentes/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/componentes/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/componentes/ui/select";
import { ScrollArea } from "@/componentes/ui/scroll-area";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  Eye,
  Clock,
  User,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Package,
  Check,
  ArrowRight,
  XCircle,
  Coins,
  UserPlus,
} from "lucide-react";
import { tratamientosApi, planesTratamientoApi, pacientesApi, agendaApi, inventarioApi, finanzasApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/componentes/ui/toaster";
import { Badge } from "@/componentes/ui/badge";
import { Switch } from "@/componentes/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/componentes/ui/radio-group";
import { Combobox, OpcionCombobox } from "@/componentes/ui/combobox";
import { SearchInput } from "@/componentes/ui/search-input";
import {
  Tratamiento,

  Inventario,
  Producto,
  Paciente,
} from '@/tipos';


import WizardConsumibles from '@/componentes/materiales/wizard-consumibles';
import { obtenerMensajeError, formatearConflictoHorariosDesdeRespuesta } from '@/lib/utilidades';
import DialogoGestionCita from '@/componentes/citas/dialogo-gestion-cita';
import DialogoConfirmacionCita from '@/componentes/citas/dialogo-confirmacion-cita';
import DialogoAsignarTratamiento from '@/componentes/tratamientos/dialogo-asignar-tratamiento';
import InputMoneda from '@/componentes/ui/input-moneda';
import { useClinica } from '@/contextos/clinica-contexto';
import { useMoneda } from '@/hooks/use-moneda';
import { useSafeClose } from '@/hooks/use-safe-close';
import { useBusquedaPaginacion } from '@/hooks/use-busqueda-paginacion';
import { ProveedorTutorialesPagina } from '@/contextos/tutoriales';
import { TUTORIALES_TRATAMIENTOS, IDS_ELEMENTOS_TRATAMIENTOS } from '@/tutoriales/tratamientos';
import { useTratamientosUI, type TabTratamientos, type TabEstadoPlan } from '@/contextos/tratamientos-contexto';

interface PlanTratamiento {
  id: number;
  costo_total: number;
  costo_total_usd?: number;
  total_abonado: number;
  total_abonado_usd?: number;
  auto_completar_al_100?: boolean;
  paciente: {
    id: number;
    nombre: string;
    apellidos: string;
  };
  tratamiento: {
    id: number;
    nombre: string;
    numero_citas: number;
    intervalo_dias?: number;
    intervalo_semanas?: number;
    intervalo_meses?: number;
    horas_aproximadas_citas?: number;
    minutos_aproximados_citas?: number;
    auto_completar_al_100?: boolean;
  };
  fecha_inicio: Date;
  estado: string;
  citas: Array<{
    id: number;
    fecha: Date;
    descripcion: string;
    estado_pago: string;
    monto_esperado: number;
    horas_aproximadas: number;
    minutos_aproximados: number;
    materiales_confirmados?: boolean;
  }>;
  pagos: Array<{
    id: number;
    fecha: Date;
    monto: number;
    monto_usd?: number;
    tasa_cambio?: number;
    concepto?: string;
  }>;

  egresos?: Array<{
    id: number;
    fecha: Date;
    monto: number;
    monto_usd?: number;
    tasa_cambio?: number;
    concepto?: string;
    cita?: { id: number } | null;
  }>;
}

export default function Tratamientos() {
    const { usuario } = useAutenticacion();
    const modo_edicion_historica_activo = !!usuario?.modo_edicion_historica;
  const { config_clinica } = useClinica();
  const usarUSD = config_clinica?.trabajar_con === 'usd';
  const cambio_dolar = config_clinica.cambio_dolar || 1;
  const { formatearMonedaJSX } = useMoneda();

  const {
    tabActiva,
    setTabActiva,
    paciente_filtro,
    setPacienteFiltro,
    busqueda_plantillas,
    setBusquedaPlantillas,
    busqueda_planes,
    setBusquedaPlanes,
    tab_estado_plan,
    setTabEstadoPlan,
    items_por_pagina_planes,
    setItemsPorPaginaPlanes,
  } = useTratamientosUI();

  const formatearUSD = (monto: number): React.ReactNode => {
    const n = Number(monto);
    return <>USD {(isNaN(n) ? 0 : n).toFixed(2)}</>;
  };

  const obtenerUSDDesdeLocal = (monto_local: number): number => {
    const local = Number(monto_local) || 0;
    const tasa = Number(cambio_dolar) || 1;
    if (!tasa || isNaN(tasa) || tasa <= 0) return Number(local.toFixed(2));
    return Number((local / tasa).toFixed(2));
  };
  const formatearMonto = (monto_local: number, monto_usd?: number): React.ReactNode => {
    if (!usarUSD) return formatearMonedaJSX(monto_local);
    const usd = Number(monto_usd);
    if (usd && !isNaN(usd) && usd > 0) return formatearUSD(usd);
    return formatearUSD(obtenerUSDDesdeLocal(monto_local));
  };

  const obtenerMontosPlan = (plan: PlanTratamiento) => {
    const costo_local = Number(plan.costo_total) || 0;
    const costo_usd = Number(plan.costo_total_usd) || 0;
    const abonado_local = Number(plan.total_abonado) || 0;
    const abonado_usd = Number(plan.total_abonado_usd) || 0;

    const costo = usarUSD ? (costo_usd > 0 ? costo_usd : obtenerUSDDesdeLocal(costo_local)) : costo_local;
    const abonado = usarUSD ? (abonado_usd > 0 ? abonado_usd : obtenerUSDDesdeLocal(abonado_local)) : abonado_local;
    const pendiente = Number((costo - abonado).toFixed(2));
    return { costo, abonado, pendiente };
  };

  const formatearMontoActual = (monto: number): React.ReactNode => {
    return usarUSD ? formatearUSD(monto) : formatearMonedaJSX(monto);
  };

  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [planes, setPlanes] = useState<PlanTratamiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargando_planes, setCargandoPlanes] = useState(false);
  const [dialogo_plantilla_abierto, setDialogoPlantillaAbierto] = useState(false);
  const [dialogo_asignar_abierto, setDialogoAsignarAbierto] = useState(false);
  const [dialogo_detalle_plan_abierto, setDialogoDetallePlanAbierto] = useState(false);
  const [dialogo_cita_abierto, setDialogoCitaAbierto] = useState(false);
    const [solo_visualizar_cita, setSoloVisualizarCita] = useState(false);
    const [mensaje_visualizacion_cita, setMensajeVisualizacionCita] = useState<string | null>(null);
    const [recursos_solo_lectura_cita, setRecursosSoloLecturaCita] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [dialogo_pago_adelantado_abierto, setDialogoPagoAdelantadoAbierto] = useState(false);
  const [dialogo_egreso_tratamiento_abierto, setDialogoEgresoTratamientoAbierto] = useState(false);
  const [dialogo_editar_costo_abierto, setDialogoEditarCostoAbierto] = useState(false);
  const [dialogo_confirmar_materiales_abierto, setDialogoConfirmarMaterialesAbierto] = useState(false);
  const [modo_edicion, setModoEdicion] = useState(false);
  const [modo_edicion_cita, setModoEdicionCita] = useState(false);
  const [tratamiento_seleccionado, setTratamientoSeleccionado] = useState<Tratamiento | null>(null);
  const [plan_seleccionado, setPlanSeleccionado] = useState<PlanTratamiento | null>(null);
  const [cita_seleccionada, setCitaSeleccionada] = useState<any>(null);
  const [cita_a_eliminar, setCitaAEliminar] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardando_pago_adelantado, setGuardandoPagoAdelantado] = useState(false);
  const [plan_a_eliminar, setPlanAEliminar] = useState<PlanTratamiento | null>(null);
  const [accion_citas_eliminar_plan, setAccionCitasEliminarPlan] = useState<'borrar' | 'mantener'>('borrar');
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [productos_por_inventario, setProductosPorInventario] = useState<Record<number, Producto[]>>({});
  const [cargando_materiales, setCargandoMateriales] = useState(false);
  const [accion_pago_edicion, setAccionPagoEdicion] = useState<'mantener' | 'reembolsar' | 'eliminar'>('mantener');
  const [accion_pago_confirmacion, setAccionPagoConfirmacion] = useState<'mantener' | 'reembolsar' | 'eliminar'>('mantener');
  const [confirmar_eliminar_pago_abierto, setConfirmarEliminarPagoAbierto] = useState(false);
  const [contexto_eliminar_pago, setContextoEliminarPago] = useState<'edicion' | 'confirmacion' | null>(null);

  const [formulario_pago_adelantado, setFormularioPagoAdelantado] = useState({
    concepto: '',
    monto: '0.00',
    monto_usd: '0.00',
    marcar_citas_pagadas: false,
  });

  const [formulario_egreso_tratamiento, setFormularioEgresoTratamiento] = useState({
    concepto: 'Devolución',
    monto: '0.00',
    monto_usd: '0.00',
  });

  const construirSufijoTratamiento = (plan: PlanTratamiento): string => {
    const nombreTratamiento = plan?.tratamiento?.nombre || 'Sin nombre';
    const nombrePaciente = `${plan?.paciente?.nombre || ''} ${plan?.paciente?.apellidos || ''}`.trim();
    const partes = [`Tratamiento ${nombreTratamiento}`, `#${plan.id}`];
    if (nombrePaciente) partes.push(nombrePaciente);
    return ` - ${partes.join(' - ')}`;
  };

  const asegurarSufijoTratamiento = (concepto: string, plan: PlanTratamiento): string => {
    const base = (concepto || '').trim();
    const sufijo = construirSufijoTratamiento(plan);
    if (!base) return sufijo.trim();
    if (base.endsWith(sufijo)) return base;
    if (/\s-\sTratamiento\s/i.test(base) && /#\d+/.test(base)) return base;
    return `${base}${sufijo}`;
  };

  const abrirDialogoPagoAdelantado = () => {
    if (!plan_seleccionado) return;
    setFormularioPagoAdelantado({
      concepto: '',
      monto: '0.00',
      monto_usd: '0.00',
      marcar_citas_pagadas: false,
    });
    setDialogoPagoAdelantadoAbierto(true);
  };

  const abrirDialogoEgresoTratamiento = () => {
    if (!plan_seleccionado) return;
    if (planEsSoloLectura(plan_seleccionado)) return;
    setFormularioEgresoTratamiento({
      concepto: 'Devolución',
      monto: '0.00',
      monto_usd: '0.00',
    });
    setDialogoEgresoTratamientoAbierto(true);
  };

  const manejarRegistrarPagoAdelantado = async () => {
    if (!plan_seleccionado) return;
    if (planEsSoloLectura(plan_seleccionado)) return;

    const monto_local = Number(parseFloat(formulario_pago_adelantado.monto || '0'));
    const monto_usd = Number(parseFloat(formulario_pago_adelantado.monto_usd || '0'));
    const monto_actual = usarUSD ? monto_usd : monto_local;
    if (!monto_actual || isNaN(monto_actual) || monto_actual <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser un número positivo.',
        variant: 'destructive',
      });
      return;
    }

    const { pendiente } = obtenerMontosPlan(plan_seleccionado);
    const pendiente_norm = Number(pendiente) || 0;
    const puede_marcar_citas = pendiente_norm > 0 && monto_actual >= pendiente_norm;
    const marcar_citas = !!formulario_pago_adelantado.marcar_citas_pagadas && puede_marcar_citas;

    const concepto_final = asegurarSufijoTratamiento(formulario_pago_adelantado.concepto || 'Pago', plan_seleccionado);

    setGuardandoPagoAdelantado(true);
    try {
      await finanzasApi.registrarPago({
        plan_tratamiento_id: plan_seleccionado.id,
        fecha: new Date(),
        monto: usarUSD ? Number((monto_usd * Number(cambio_dolar || 1)).toFixed(2)) : monto_local,
        monto_usd: usarUSD ? monto_usd : Number((monto_local / Number(cambio_dolar || 1)).toFixed(2)),
        tasa_cambio: Number(cambio_dolar || 1),
        concepto: concepto_final,
      });

      if (marcar_citas) {
        const citas = plan_seleccionado.citas || [];
        for (const cita of citas) {
          const estado_norm = (cita.estado_pago || '').toLowerCase();
          if (estado_norm === 'pagado') continue;
          await agendaApi.actualizar(cita.id, {
            estado_pago: 'pagado',
            monto_esperado: 0,
            monto_esperado_usd: 0,
            tasa_cambio: Number(cambio_dolar || 1),
          });
        }
      }

      toast({
        title: 'Éxito',
        description: marcar_citas
          ? 'Pago registrado. Las citas se marcaron como pagadas.'
          : 'Pago adelantado registrado correctamente.',
      });

      setDialogoPagoAdelantadoAbierto(false);
      await recargarPlanSeleccionado();
    } catch (error: any) {
      console.error('Error al registrar pago adelantado:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo registrar el pago adelantado',
        variant: 'destructive',
      });
    } finally {
      setGuardandoPagoAdelantado(false);
    }
  };

  const manejarRegistrarEgresoTratamiento = async () => {
    if (!plan_seleccionado) return;
    if (planEsSoloLectura(plan_seleccionado)) return;

    const monto_local = Number(parseFloat(formulario_egreso_tratamiento.monto || '0'));
    const monto_usd = Number(parseFloat(formulario_egreso_tratamiento.monto_usd || '0'));
    const monto_actual = usarUSD ? monto_usd : monto_local;
    if (!monto_actual || isNaN(monto_actual) || monto_actual <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser un número positivo.',
        variant: 'destructive',
      });
      return;
    }

    const concepto_final = asegurarSufijoTratamiento(formulario_egreso_tratamiento.concepto || 'Devolución', plan_seleccionado);

    setGuardando(true);
    try {
      await finanzasApi.registrarEgreso({
        plan_tratamiento_id: plan_seleccionado.id,
        fecha: new Date(),
        monto: usarUSD ? Number((monto_usd * Number(cambio_dolar || 1)).toFixed(2)) : monto_local,
        monto_usd: usarUSD ? monto_usd : Number((monto_local / Number(cambio_dolar || 1)).toFixed(2)),
        tasa_cambio: Number(cambio_dolar || 1),
        concepto: concepto_final,
      });

      toast({
        title: 'Éxito',
        description: 'Egreso registrado correctamente.',
      });

      setDialogoEgresoTratamientoAbierto(false);
      await recargarPlanSeleccionado();
    } catch (error: any) {
      console.error('Error al registrar egreso:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo registrar el egreso',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const [consumibles_confirmacion, setConsumiblesConfirmacion] = useState<any[]>([]);
  const [activos_confirmacion, setActivosConfirmacion] = useState<any[]>([]);
  const [estado_pago_confirmacion, setEstadoPagoConfirmacion] = useState<string>('pendiente');
  const [monto_confirmacion, setMontoConfirmacion] = useState<string>('');
  const [monto_confirmacion_usd, setMontoConfirmacionUsd] = useState<string>('');

  useEffect(() => {
    const onNavegarTratamientos = (event: Event) => {
      const custom = event as CustomEvent<{ tab?: 'planes' | 'plantillas' }>;
      const tab = custom.detail?.tab;
      if (tab) setTabActiva(tab);
    };

    window.addEventListener('tutorial:navegar-tratamientos', onNavegarTratamientos as EventListener);
    return () => {
      window.removeEventListener('tutorial:navegar-tratamientos', onNavegarTratamientos as EventListener);
    };
  }, []);

  const [consumibles_seleccionados_cita, setConsumiblesSeleccionadosCita] = useState<Array<{
    inventario_id: number;
    inventario_nombre: string;
    producto_id: number;
    producto_nombre: string;
    material_id: number;
    nro_lote?: string;
    cantidad: number;
    stock_disponible: number;
    unidad_medida?: string;
    permite_decimales?: boolean;
  }>>([]);
  const [activos_seleccionados_cita, setActivosSeleccionadosCita] = useState<Array<{
    inventario_id: number;
    inventario_nombre: string;
    producto_id: number;
    producto_nombre: string;
    activo_id: number;
    codigo_interno?: string;
    nro_serie?: string;
    nombre_asignado?: string;
    estado: string;
  }>>([]);

  const [consumibles_seleccionados_cita_inicial, setConsumiblesSeleccionadosCitaInicial] = useState<any[]>([]);
  const [activos_seleccionados_cita_inicial, setActivosSeleccionadosCitaInicial] = useState<any[]>([]);

  const [consumibles_plantilla, setConsumiblesPlantilla] = useState<Array<{
    inventario_id: number;
    inventario_nombre: string;
    producto_id: number;
    producto_nombre: string;
    material_id: number;
    nro_lote?: string;
    cantidad: number;
    stock_disponible: number;
    unidad_medida?: string;
    permite_decimales?: boolean;
  }>>([]);
  const [activos_plantilla, setActivosPlantilla] = useState<Array<{
    inventario_id: number;
    inventario_nombre: string;
    producto_id: number;
    producto_nombre: string;
    activo_id: number;
    codigo_interno?: string;
    nro_serie?: string;
    nombre_asignado?: string;
    estado: string;
  }>>([]);

  const [consumibles_plantilla_inicial, setConsumiblesPlantillaInicial] = useState<any[]>([]);
  const [activos_plantilla_inicial, setActivosPlantillaInicial] = useState<any[]>([]);
  const [consumibles_confirmacion_inicial, setConsumiblesConfirmacionInicial] = useState<any[]>([]);
  const [estado_pago_confirmacion_inicial, setEstadoPagoConfirmacionInicial] = useState<string>('pendiente');
  const [monto_confirmacion_inicial, setMontoConfirmacionInicial] = useState<string>('');
  const [monto_confirmacion_usd_inicial, setMontoConfirmacionUsdInicial] = useState<string>('');

  const [formulario_plantilla_inicial, setFormularioPlantillaInicial] = useState({
    nombre: "",
    numero_citas: "",
    costo_total: "0.00",
    costo_total_usd: "0.00",
    intervalo_dias: "0",
    intervalo_semanas: "0",
    intervalo_meses: "0",
    horas_aproximadas_citas: "0",
    minutos_aproximados_citas: "30",
    auto_completar_al_100: true,
  });

  const [formulario_cita_inicial, setFormularioCitaInicial] = useState({
    paciente_id: "",
    fecha: undefined as Date | undefined,
    descripcion: "",
    estado_pago: "pendiente",
    monto_esperado: "0.00",
    monto_esperado_usd: "0.00",
    horas_aproximadas: "0",
    minutos_aproximados: "30",
  });


  const [formulario_plantilla, setFormularioPlantilla] = useState({
    nombre: "",
    numero_citas: "",
    costo_total: "0.00",
    costo_total_usd: "0.00",
    intervalo_dias: "0",
    intervalo_semanas: "0",
    intervalo_meses: "0",
    horas_aproximadas_citas: "0",
    minutos_aproximados_citas: "30",
    auto_completar_al_100: true,
  });

  const [formulario_cita, setFormularioCita] = useState({
    paciente_id: "",
    fecha: undefined as Date | undefined,
    descripcion: "",
    estado_pago: "pendiente",
    monto_esperado: "0.00",
    monto_esperado_usd: "0.00",
    horas_aproximadas: "0",
    minutos_aproximados: "30",
  });

  const [formulario_editar_costo, setFormularioEditarCosto] = useState({
    costo_total: "",
    costo_total_usd: "",
  });
  const [formulario_editar_costo_inicial, setFormularioEditarCostoInicial] = useState({
    costo_total: "",
    costo_total_usd: "",
  });


  const estados_pago = [
    { valor: 'pendiente', etiqueta: 'Pendiente', color: 'bg-yellow-500' },
    { valor: 'pagado', etiqueta: 'Pagado', color: 'bg-green-500' },
    { valor: 'cancelado', etiqueta: 'Cancelado', color: 'bg-red-500' },
  ];
  const estados_pago_validos = estados_pago.map(e => e.valor);

  useEffect(() => {
    cargarDatos();
    cargarPlanes();
  }, []);

  const citaHaFinalizado = (cita: any): boolean => {
    const ahora = new Date();
    const fecha_inicio = new Date(cita.fecha);
    const fecha_fin = new Date(fecha_inicio);
    fecha_fin.setHours(fecha_fin.getHours() + (cita.horas_aproximadas || 0));
    fecha_fin.setMinutes(fecha_fin.getMinutes() + (cita.minutos_aproximados || 30));
    return ahora > fecha_fin;
  };

  const planEsSoloLectura = (plan: PlanTratamiento): boolean => {
    const estado = (plan.estado || '').toLowerCase();
    return estado === 'completado' || estado === 'cancelado';
  };

  const obtenerAutoCompletarPlan = (plan: PlanTratamiento): { habilitado: boolean; fuente: 'plan' | 'plantilla' | 'default' } => {
    if (typeof plan.auto_completar_al_100 === 'boolean') {
      return { habilitado: plan.auto_completar_al_100 !== false, fuente: 'plan' };
    }
    if (typeof plan.tratamiento?.auto_completar_al_100 === 'boolean') {
      return { habilitado: plan.tratamiento.auto_completar_al_100 !== false, fuente: 'plantilla' };
    }
    return { habilitado: true, fuente: 'default' };
  };

  const formularioPlantillaCambio = (): boolean => {
    const datos_cambiaron = JSON.stringify(formulario_plantilla) !== JSON.stringify(formulario_plantilla_inicial);
    const consumibles_cambiaron = JSON.stringify(consumibles_plantilla) !== JSON.stringify(consumibles_plantilla_inicial);
    const activos_cambiaron = JSON.stringify(activos_plantilla) !== JSON.stringify(activos_plantilla_inicial);

    return datos_cambiaron || consumibles_cambiaron || activos_cambiaron;
  };

  const formularioCitaCambio = (): boolean => {
    const fecha_actual = formulario_cita.fecha?.getTime();
    const fecha_inicial = formulario_cita_inicial.fecha?.getTime();
    if (fecha_actual !== fecha_inicial) return true;

    return formulario_cita.descripcion !== formulario_cita_inicial.descripcion ||
      formulario_cita.estado_pago !== formulario_cita_inicial.estado_pago ||
      formulario_cita.monto_esperado !== formulario_cita_inicial.monto_esperado ||
      formulario_cita.horas_aproximadas !== formulario_cita_inicial.horas_aproximadas ||
      formulario_cita.minutos_aproximados !== formulario_cita_inicial.minutos_aproximados;
  };

  const materialesCitaCambiaron = () => {
    if (!modo_edicion_cita) {
      return consumibles_seleccionados_cita.length > 0 || activos_seleccionados_cita.length > 0;
    }
    const consumibles_cambiaron = JSON.stringify(consumibles_seleccionados_cita) !== JSON.stringify(consumibles_seleccionados_cita_inicial);
    const activos_cambiaron = JSON.stringify(activos_seleccionados_cita) !== JSON.stringify(activos_seleccionados_cita_inicial);
    return consumibles_cambiaron || activos_cambiaron;
  };


  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [datos_tratamientos, datos_pacientes] = await Promise.all([
        tratamientosApi.obtenerTodos(),
        pacientesApi.obtenerTodos(),
      ]);
      setTratamientos(datos_tratamientos);
      setPacientes(datos_pacientes);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarPlanes = async () => {
    setCargandoPlanes(true);
    try {
      const planes_totales = await planesTratamientoApi.obtenerTodos();
      setPlanes(planes_totales.filter((p: PlanTratamiento) => p.paciente && p.tratamiento));
    } catch (error) {
      console.error("Error al cargar planes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes de tratamiento",
        variant: "destructive",
      });
    } finally {
      setCargandoPlanes(false);
    }
  };

  const recargarPlanSeleccionado = async () => {
    if (!plan_seleccionado) return;

    try {
      const planes_actualizados = await planesTratamientoApi.obtenerTodos();
      const plan_actualizado = planes_actualizados.find((p: PlanTratamiento) => p.id === plan_seleccionado.id);

      if (plan_actualizado) {
        if (plan_actualizado.citas) {
          plan_actualizado.citas.sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        }
        setPlanSeleccionado(plan_actualizado);
        setPlanes(planes_actualizados.filter((p: PlanTratamiento) => p.paciente && p.tratamiento));
      }
    } catch (error) {
      console.error("Error al recargar plan:", error);
    }
  };

  const cargarInventarios = async () => {
    if (inventarios.length > 0) return;

    try {
      const datos_inventarios = await inventarioApi.obtenerInventarios();
      setInventarios(datos_inventarios);
    } catch (error) {
      console.error("Error al cargar inventarios:", error);
    }
  };

  const cargarProductosInventario = async (inventario_id: number) => {
    if (productos_por_inventario[inventario_id]) {
      return;
    }

    setCargandoMateriales(true);
    try {
      const productos = await inventarioApi.obtenerProductos(inventario_id);
      setProductosPorInventario(prev => ({
        ...prev,
        [inventario_id]: productos
      }));
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos del inventario",
        variant: "destructive",
      });
    } finally {
      setCargandoMateriales(false);
    }
  };












  const abrirDialogoNuevo = async () => {
    const valor_inicial = {
      nombre: "",
      numero_citas: "",
      costo_total: "0.00",
      costo_total_usd: "0.00",
      intervalo_dias: "0",
      intervalo_semanas: "0",
      intervalo_meses: "0",
      horas_aproximadas_citas: "0",
      minutos_aproximados_citas: "30",
      auto_completar_al_100: true,
    };
    setFormularioPlantilla(valor_inicial);
    setFormularioPlantillaInicial(valor_inicial);

    setConsumiblesPlantilla([]);
    setActivosPlantilla([]);
    setConsumiblesPlantillaInicial([]);
    setActivosPlantillaInicial([]);
    setProductosPorInventario({});
    setModoEdicion(false);

    if (inventarios.length === 0) {
      try {
        const datos_inventarios = await inventarioApi.obtenerInventarios();
        setInventarios(datos_inventarios);
      } catch (error) {
        console.error("Error al cargar inventarios:", error);
      }
    }

    setDialogoPlantillaAbierto(true);
  };

  const abrirDialogoEditar = async (tratamiento: Tratamiento) => {
    const costo_local = Number(tratamiento.costo_total) || 0;
    const costo_usd_guardado = Number((tratamiento as any).costo_total_usd) || 0;
    const costo_usd_inicial = costo_usd_guardado > 0 ? costo_usd_guardado : obtenerUSDDesdeLocal(costo_local);

    const formulario_inicial = {
      nombre: tratamiento.nombre,
      numero_citas: tratamiento.numero_citas.toString(),
      costo_total: tratamiento.costo_total.toString(),
      costo_total_usd: costo_usd_inicial.toFixed(2),
      intervalo_dias: (tratamiento.intervalo_dias || 0).toString(),
      intervalo_semanas: (tratamiento.intervalo_semanas || 0).toString(),
      intervalo_meses: (tratamiento.intervalo_meses || 0).toString(),
      horas_aproximadas_citas: ((tratamiento as any).horas_aproximadas_citas || 0).toString(),
      minutos_aproximados_citas: ((tratamiento as any).minutos_aproximados_citas || 30).toString(),
      auto_completar_al_100: (tratamiento as any).auto_completar_al_100 !== false,
    };
    setFormularioPlantilla(formulario_inicial);
    setFormularioPlantillaInicial(formulario_inicial);
    setConsumiblesPlantilla([]);
    setActivosPlantilla([]);
    setConsumiblesPlantillaInicial([]);
    setActivosPlantillaInicial([]);
    setProductosPorInventario({});
    setTratamientoSeleccionado(tratamiento);
    setModoEdicion(true);
    setCargandoMateriales(true);

    if (inventarios.length === 0) {
      try {
        const datos_inventarios = await inventarioApi.obtenerInventarios();
        setInventarios(datos_inventarios);
      } catch (error) {
        console.error("Error al cargar inventarios:", error);
      }
    }

    setDialogoPlantillaAbierto(true);

    try {
      const materiales = await tratamientosApi.obtenerMaterialesPlantilla(tratamiento.id);

      if (materiales && materiales.length > 0) {
        const porCita = materiales.filter((m: any) => m.tipo_material === 'por_cita' || (!m.es_general && m.tipo_material !== 'general'));
        const cons = porCita.filter((m: any) => m.tipo_producto === 'material' || !m.tipo_producto);
        const acts = porCita.filter((m: any) => m.tipo_producto === 'activo_fijo');

        setConsumiblesPlantilla(cons.map((m: any) => ({
          inventario_id: m.inventario_id,
          inventario_nombre: m.inventario_nombre || 'Inventario',
          producto_id: m.producto_id,
          producto_nombre: m.producto_nombre || 'Producto',
          material_id: m.material_id || 0,
          cantidad: m.cantidad,
          nombre_producto: m.producto_nombre || 'Producto',
          stock_disponible: m.stock_disponible || 0,
          unidad_medida: m.unidad_medida || 'unidades',
          permite_decimales: m.permite_decimales ?? false,
        })));

        setActivosPlantilla(acts.map((m: any) => ({
          inventario_id: m.inventario_id,
          inventario_nombre: m.inventario_nombre || 'Inventario',
          producto_id: m.producto_id,
          producto_nombre: m.producto_nombre || 'Activo',
          activo_id: m.activo_id || 0,
          codigo: m.codigo || '',
          nombre_producto: m.producto_nombre || 'Activo',
          estado: 'disponible'
        })));
        setConsumiblesPlantillaInicial(JSON.parse(JSON.stringify(cons.map((m: any) => ({
          inventario_id: m.inventario_id,
          inventario_nombre: m.inventario_nombre || 'Inventario',
          producto_id: m.producto_id,
          producto_nombre: m.producto_nombre || 'Producto',
          material_id: m.material_id || 0,
          cantidad: m.cantidad,
          nombre_producto: m.producto_nombre || 'Producto',
          stock_disponible: m.stock_disponible || 0,
          unidad_medida: m.unidad_medida || 'unidades',
          permite_decimales: m.permite_decimales ?? false,
        })))));
        setActivosPlantillaInicial(JSON.parse(JSON.stringify(acts.map((m: any) => ({
          inventario_id: m.inventario_id,
          inventario_nombre: m.inventario_nombre || 'Inventario',
          producto_id: m.producto_id,
          producto_nombre: m.producto_nombre || 'Activo',
          activo_id: m.activo_id || 0,
          codigo: m.codigo || '',
          nombre_producto: m.producto_nombre || 'Activo',
          estado: 'disponible'
        })))));
      }
    } catch (error) {
      console.error('Error al cargar materiales de la plantilla:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales de la plantilla.",
        variant: "destructive",
      });
    } finally {
      setCargandoMateriales(false);
    }
  };

  const manejarGuardarPlantilla = async () => {
    if (
      !formulario_plantilla.nombre ||
      !formulario_plantilla.numero_citas ||
      !formulario_plantilla.costo_total
    ) {
      toast({
        title: "Error",
        description: "Nombre, número de citas y costo son obligatorios",
        variant: "destructive",
      });
      return;
    }

    const numero_citas = parseInt(formulario_plantilla.numero_citas);
    const costo_total = parseFloat(formulario_plantilla.costo_total);
    let costo_total_usd = parseFloat(formulario_plantilla.costo_total_usd || '0');
    const intervalo_dias = parseInt(formulario_plantilla.intervalo_dias);
    const intervalo_semanas = parseInt(formulario_plantilla.intervalo_semanas);
    const intervalo_meses = parseInt(formulario_plantilla.intervalo_meses);
    const horas_aproximadas_citas = parseInt(formulario_plantilla.horas_aproximadas_citas);
    const minutos_aproximados_citas = parseInt(formulario_plantilla.minutos_aproximados_citas);

    if (
      isNaN(numero_citas) ||
      numero_citas <= 0 ||
      isNaN(costo_total) ||
      costo_total <= 0 ||
      isNaN(intervalo_dias) ||
      intervalo_dias < 0 ||
      isNaN(intervalo_semanas) ||
      intervalo_semanas < 0 ||
      isNaN(intervalo_meses) ||
      intervalo_meses < 0 ||
      isNaN(horas_aproximadas_citas) ||
      horas_aproximadas_citas < 0 ||
      horas_aproximadas_citas > 23 ||
      isNaN(minutos_aproximados_citas) ||
      minutos_aproximados_citas < 0 ||
      minutos_aproximados_citas > 59
    ) {
      toast({
        title: "Error",
        description: "Los valores numéricos deben ser válidos. Horas (0-23) y minutos (0-59)",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(costo_total_usd) || costo_total_usd <= 0) {
      costo_total_usd = obtenerUSDDesdeLocal(costo_total);
    }

    if (horas_aproximadas_citas + minutos_aproximados_citas <= 0) {
      toast({
        title: "Error",
        description: "La duración total de la cita debe ser de al menos 1 minuto",
        variant: "destructive",
      });
      return;
    }

    if (intervalo_dias === 0 && intervalo_semanas === 0 && intervalo_meses === 0) {
      toast({
        title: "Error",
        description: "Los intervalos entre citas no pueden ser todos 0. Define al menos uno (días, semanas o meses).",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        nombre: formulario_plantilla.nombre,
        numero_citas,
        costo_total,
        costo_total_usd,
        tasa_cambio: Number(cambio_dolar),
        intervalo_dias,
        intervalo_semanas,
        intervalo_meses,
        horas_aproximadas_citas,
        minutos_aproximados_citas,
        auto_completar_al_100: (formulario_plantilla as any).auto_completar_al_100 !== false,
        recursos_por_cita: [
          ...consumibles_plantilla.map(c => ({
            producto_id: c.producto_id,
            cantidad: c.cantidad,
            tipo: 'material'
          })),
          ...activos_plantilla.map(a => ({
            producto_id: a.producto_id,
            cantidad: 1,
            tipo: 'activo_fijo'
          }))
        ],
      };

      if (modo_edicion && tratamiento_seleccionado) {
        await tratamientosApi.actualizar(tratamiento_seleccionado.id, datos);
        toast({
          title: "Éxito",
          description: "Tratamiento actualizado correctamente",
        });
      } else {
        await tratamientosApi.crear(datos);
        toast({
          title: "Éxito",
          description: "Tratamiento creado correctamente",
        });
      }
      setDialogoPlantillaAbierto(false);
      cargarDatos();
    } catch (error: any) {
      console.error("Error al guardar tratamiento:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo guardar el tratamiento",
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const redondearA15Minutos = (fecha: Date): Date => {
    const nueva_fecha = new Date(fecha);
    nueva_fecha.setMinutes(nueva_fecha.getMinutes() + 5);
    const minutos = nueva_fecha.getMinutes();
    const minutos_redondeados = Math.ceil(minutos / 15) * 15;
    if (minutos_redondeados === 60) {
      nueva_fecha.setHours(nueva_fecha.getHours() + 1);
      nueva_fecha.setMinutes(0);
    } else {
      nueva_fecha.setMinutes(minutos_redondeados);
    }
    nueva_fecha.setSeconds(0);
    nueva_fecha.setMilliseconds(0);

    return nueva_fecha;
  };

  const abrirDialogoConfirmarEliminarPlantilla = (tratamiento: Tratamiento) => {
    setTratamientoSeleccionado(tratamiento);
    setDialogoConfirmarEliminarAbierto(true);
  };

  const confirmarEliminarPlantilla = async () => {
    if (!tratamiento_seleccionado) return;

    try {
      await tratamientosApi.eliminar(tratamiento_seleccionado.id);
      toast({
        title: "Éxito",
        description: "Tratamiento eliminado correctamente",
      });
      setDialogoConfirmarEliminarAbierto(false);
      setTratamientoSeleccionado(null);
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar tratamiento:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el tratamiento",
        variant: "destructive",
      });
    }
  };

  const abrirDialogoAsignar = (tratamiento?: Tratamiento) => {
    setTratamientoSeleccionado(tratamiento || null);
    setDialogoAsignarAbierto(true);
  };

  const formatearFechaParaBackend = (fecha: Date): string => {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  const formatearHoraParaBackend = (fecha: Date): string => {
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  };

  const manejarAsignarTratamiento = async (datos: { paciente_id: number; tratamiento_id: number; fecha_inicio: Date }) => {
    try {
      await planesTratamientoApi.asignar({
        paciente_id: datos.paciente_id,
        tratamiento_id: datos.tratamiento_id,
        fecha_inicio: formatearFechaParaBackend(datos.fecha_inicio),
        hora_inicio: formatearHoraParaBackend(datos.fecha_inicio),
        fecha_inicio_iso: datos.fecha_inicio.toISOString(),
      });
      toast({
        title: "Éxito",
        description: "Plan de tratamiento asignado correctamente",
      });
      setDialogoAsignarAbierto(false);
      cargarPlanes();
    } catch (error: any) {
      console.error("Error al asignar tratamiento:", error);

      const data = (error as any)?.response?.data;
      const mensaje_error = formatearConflictoHorariosDesdeRespuesta(data)
        || data?.message
        || "No se pudo asignar el tratamiento";

      toast({
        title: "Error - Conflicto de Horarios",
        description: (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <pre className="text-sm whitespace-pre-wrap font-mono">{mensaje_error}</pre>
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 15000,
      });
      throw error;
    }
  };

  const verDetallePlan = async (plan: PlanTratamiento) => {
    const plan_ordenado = {
      ...plan,
      citas: [...(plan.citas || [])].sort((a, b) =>
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      )
    };
    setPlanSeleccionado(plan_ordenado);
    setDialogoDetallePlanAbierto(true);
  };

  const abrirDialogoNuevaCita = () => {
    const paciente_eliminado =
      Boolean((plan_seleccionado as any)?.paciente_eliminado) ||
      Boolean((plan_seleccionado as any)?.paciente?.paciente_eliminado);

    if (paciente_eliminado) {
      toast({
        title: 'Solo lectura',
        description: 'El paciente fue eliminado. No se pueden crear ni modificar citas o tratamientos asociados.',
        variant: 'warning',
      });
      return;
    }

    const valor_inicial = {
      paciente_id: plan_seleccionado?.paciente.id.toString() || "",
      fecha: redondearA15Minutos(new Date()),
      descripcion: "",
      estado_pago: "pendiente",
      monto_esperado: "0.00",
      monto_esperado_usd: "0.00",
      horas_aproximadas: "0",
      minutos_aproximados: "30",
    };
    setFormularioCita(valor_inicial);
    setFormularioCitaInicial(valor_inicial);
    setModoEdicionCita(false);
    setConsumiblesSeleccionadosCita([]);
    setActivosSeleccionadosCita([]);
    setConsumiblesSeleccionadosCitaInicial([]);
    setActivosSeleccionadosCitaInicial([]);
    setAccionPagoEdicion('mantener');
    setSoloVisualizarCita(false);
    setMensajeVisualizacionCita(null);
    setRecursosSoloLecturaCita(false);
    setDialogoCitaAbierto(true);
  };

  const abrirDialogoEditarCita = async (cita: any) => {
    const paciente_eliminado =
      Boolean((cita as any)?.paciente_eliminado) ||
      Boolean((plan_seleccionado as any)?.paciente_eliminado) ||
      Boolean((plan_seleccionado as any)?.paciente?.paciente_eliminado);
    const mensaje_paciente_eliminado =
      'Este paciente fue eliminado. Esta cita se mantiene visible solo para consulta y no puede modificarse.';

    const formulario_inicial = {
      paciente_id: plan_seleccionado?.paciente.id.toString() || "",
      fecha: new Date(cita.fecha),
      descripcion: cita.descripcion,
      estado_pago: cita.estado_pago || 'pendiente',
      monto_esperado: cita.monto_esperado?.toString() || "",
      monto_esperado_usd: cita.monto_esperado_usd?.toString() || "0.00",
      horas_aproximadas: (cita.horas_aproximadas || 0).toString(),
      minutos_aproximados: (cita.minutos_aproximados || 30).toString(),
    };
    setFormularioCita(formulario_inicial);
    setFormularioCitaInicial(formulario_inicial);
    setCitaSeleccionada(cita);
    setModoEdicionCita(true);
    setSoloVisualizarCita(paciente_eliminado);
    setMensajeVisualizacionCita(paciente_eliminado ? mensaje_paciente_eliminado : null);
    setRecursosSoloLecturaCita(paciente_eliminado || !!cita.materiales_confirmados);
    setConsumiblesSeleccionadosCita([]);
    setActivosSeleccionadosCita([]);
    setConsumiblesSeleccionadosCitaInicial([]);
    setActivosSeleccionadosCitaInicial([]);
    setAccionPagoEdicion('mantener');
    if (inventarios.length === 0) {
      try {
        const datos_inventarios = await inventarioApi.obtenerInventarios();
        setInventarios(datos_inventarios);
      } catch (error) {
        console.error("Error al cargar inventarios:", error);
      }
    }

    if (cita.id) {
      setCargandoMateriales(true);
      try {
        const cita_completa = await agendaApi.obtenerPorIdCompleto(cita.id);
        const consumibles_mapped = (cita_completa.reservas_materiales || []).map((rm: any) => ({
          inventario_id: rm.material?.producto?.inventario?.id || 0,
          inventario_nombre: rm.material?.producto?.inventario?.nombre || 'Inventario',
          producto_id: rm.material?.producto?.id || 0,
          producto_nombre: rm.material?.producto?.nombre || 'Producto',
          material_id: rm.material?.id || 0,
          nro_lote: rm.material?.nro_lote,
          cantidad: Number(rm.cantidad_confirmada ?? rm.cantidad_reservada ?? rm.cantidad ?? 0),
          stock_disponible: Number(rm.material?.cantidad_actual || 0),
          unidad_medida: rm.material?.producto?.unidad_medida || 'unidades',
          permite_decimales: rm.material?.producto?.permite_decimales ?? true,
        }));
        const activos_mapped = (cita_completa.reservas_activos || []).map((ra: any) => ({
          inventario_id: ra.activo?.producto?.inventario?.id || 0,
          inventario_nombre: ra.activo?.producto?.inventario?.nombre || 'Inventario',
          producto_id: ra.activo?.producto?.id || 0,
          producto_nombre: ra.activo?.producto?.nombre || 'Producto',
          activo_id: ra.activo?.id || 0,
          codigo_interno: ra.activo?.codigo_interno,
          nro_serie: ra.activo?.nro_serie,
          nombre_asignado: ra.activo?.nombre_asignado,
          estado: ra.activo?.estado || 'disponible',
        }));
        setConsumiblesSeleccionadosCita(consumibles_mapped);
        setActivosSeleccionadosCita(activos_mapped);
        setConsumiblesSeleccionadosCitaInicial(JSON.parse(JSON.stringify(consumibles_mapped)));
        setActivosSeleccionadosCitaInicial(JSON.parse(JSON.stringify(activos_mapped)));

      } catch (error) {
        console.error('Error al cargar materiales de la cita:', error);
      } finally {
        setCargandoMateriales(false);
      }
    }
    setDialogoCitaAbierto(true);
  };

  const citaEstaOcurriendo = (cita: any): boolean => {
    const ahora = new Date();
    const fecha_inicio = new Date(cita.fecha);
    const fecha_fin = new Date(fecha_inicio);
    fecha_fin.setHours(fecha_fin.getHours() + (cita.horas_aproximadas || 0));
    fecha_fin.setMinutes(fecha_fin.getMinutes() + (cita.minutos_aproximados || 30));
    return ahora >= fecha_inicio && ahora < fecha_fin;
  };

  const abrirDialogoVerCita = async (cita: any, motivo: 'ocurriendo' | 'finalizada') => {
    const paciente_eliminado =
      Boolean((cita as any)?.paciente_eliminado) ||
      Boolean((plan_seleccionado as any)?.paciente_eliminado) ||
      Boolean((plan_seleccionado as any)?.paciente?.paciente_eliminado);

    const mensaje_base = motivo === 'ocurriendo'
      ? 'Esta cita está ocurriendo, por ahora solo puede visualizarse'
      : 'Ésta cita ya ha finalizado, por ahora solo puede visualizarse';

    const mensaje = paciente_eliminado
      ? `${mensaje_base}\n\nNota: el paciente fue eliminado, esta cita no se puede modificar.`
      : mensaje_base;

    await abrirDialogoEditarCita(cita);
    setSoloVisualizarCita(true);
    setMensajeVisualizacionCita(mensaje);
  };


  const manejarGuardarCita = async (confirmado_pago: boolean = false, accion_pago_param?: 'mantener' | 'reembolsar' | 'eliminar') => {
    if (!plan_seleccionado || !formulario_cita.fecha || !formulario_cita.descripcion) {
      toast({
        title: "Error",
        description: "Fecha y descripción son obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (!estados_pago_validos.includes(formulario_cita.estado_pago)) {
      toast({
        title: "Error",
        description: "Selecciona un estado de pago válido",
        variant: "destructive",
      });
      return;
    }

    const horas = parseInt(formulario_cita.horas_aproximadas);
    const minutos = parseInt(formulario_cita.minutos_aproximados);

    if (
      isNaN(horas) ||
      horas < 0 ||
      horas > 23 ||
      isNaN(minutos) ||
      minutos < 0 ||
      minutos > 59
    ) {
      toast({
        title: "Error",
        description: "Horas debe estar entre 0 y 23, y minutos entre 0 y 59",
        variant: "destructive",
      });
      return;
    }

    if (horas + minutos <= 0) {
      toast({
        title: "Error",
        description: "La duración total (horas + minutos) debe ser de al menos 1 minuto",
        variant: "destructive",
      });
      return;
    }

    let accion_cancelacion_pago: 'mantener' | 'reembolsar' | 'eliminar' | undefined;

    if (modo_edicion_cita && cita_seleccionada) {
      const estado_actual = (cita_seleccionada.estado_pago || '').toLowerCase();
      const nuevo_estado = (formulario_cita.estado_pago || '').toLowerCase();
      const requiere_accion_pago = estado_actual === 'pagado' && (nuevo_estado === 'cancelado' || nuevo_estado === 'pendiente');
      accion_cancelacion_pago = requiere_accion_pago ? (accion_pago_param ?? accion_pago_edicion) : undefined;

      if (accion_cancelacion_pago === 'eliminar' && !confirmado_pago) {
        setContextoEliminarPago('edicion');
        setConfirmarEliminarPagoAbierto(true);
        setGuardando(false);
        return;
      }
    }

    setGuardando(true);
    try {
      const consumibles = consumibles_seleccionados_cita.map(c => ({
        material_id: c.material_id,
        producto_id: c.producto_id,
        cantidad: c.cantidad
      }));

      const activos_fijos = activos_seleccionados_cita.map(a => ({
        activo_id: a.activo_id,
        producto_id: a.producto_id
      }));

      let cita_id: number;

      if (modo_edicion_cita && cita_seleccionada) {
        const datos_actualizar: any = {};

        if (materialesCitaCambiaron()) {
          datos_actualizar.consumibles = consumibles;
          datos_actualizar.activos_fijos = activos_fijos;
        }

        const fecha_inicial = formulario_cita_inicial.fecha ? new Date(formulario_cita_inicial.fecha).getTime() : null;
        const fecha_nueva = formulario_cita.fecha ? new Date(formulario_cita.fecha).getTime() : null;
        if (fecha_inicial !== fecha_nueva) {
          datos_actualizar.fecha = formulario_cita.fecha;
        }

        if (formulario_cita_inicial.descripcion !== formulario_cita.descripcion) {
          datos_actualizar.descripcion = formulario_cita.descripcion;
        }

        const horas_inicial = parseInt(formulario_cita_inicial.horas_aproximadas);
        const minutos_inicial = parseInt(formulario_cita_inicial.minutos_aproximados);
        if (horas_inicial !== horas || minutos_inicial !== minutos) {
          datos_actualizar.horas_aproximadas = horas;
          datos_actualizar.minutos_aproximados = minutos;
        }

        if (formulario_cita_inicial.estado_pago !== formulario_cita.estado_pago) {
          datos_actualizar.estado_pago = formulario_cita.estado_pago;
        }

        if (formulario_cita_inicial.monto_esperado !== formulario_cita.monto_esperado) {
          datos_actualizar.monto_esperado = formulario_cita.monto_esperado ? parseFloat(formulario_cita.monto_esperado) : 0;
        }

        if (formulario_cita_inicial.monto_esperado_usd !== formulario_cita.monto_esperado_usd) {
          datos_actualizar.monto_esperado_usd = formulario_cita.monto_esperado_usd ? parseFloat(formulario_cita.monto_esperado_usd) : 0;
        }

        if (
          datos_actualizar.estado_pago !== undefined ||
          datos_actualizar.monto_esperado !== undefined ||
          datos_actualizar.monto_esperado_usd !== undefined
        ) {
          datos_actualizar.tasa_cambio = Number(cambio_dolar);
        }

        if (accion_cancelacion_pago) {
          datos_actualizar.accion_cancelacion_pago = accion_cancelacion_pago;
        }

        await agendaApi.actualizar(cita_seleccionada.id, datos_actualizar);
        cita_id = cita_seleccionada.id;

        const estado_actual = (cita_seleccionada.estado_pago || '').toLowerCase();
        const nuevo_estado = (formulario_cita.estado_pago || '').toLowerCase();
        const cambio_desde_pagado = estado_actual === 'pagado' && nuevo_estado !== 'pagado';

        let mensaje_desc = 'Cita actualizada correctamente.';
        if (cambio_desde_pagado && (nuevo_estado === 'cancelado' || nuevo_estado === 'pendiente') && confirmado_pago && accion_pago_param) {
          if (accion_pago_param === 'reembolsar') mensaje_desc += ' Se ha registrado el reembolso.';
          else if (accion_pago_param === 'eliminar') mensaje_desc += ' El pago ha sido eliminado.';
          else mensaje_desc += ' El pago se ha mantenido desvinculado.';
        }

        toast({
          title: "Éxito",
          description: mensaje_desc,
        });
      } else {
        const datos_crear: any = {
          paciente_id: plan_seleccionado.paciente.id,
          plan_tratamiento_id: plan_seleccionado.id,
          fecha: formulario_cita.fecha,
          descripcion: formulario_cita.descripcion,
          estado_pago: formulario_cita.estado_pago,
          monto_esperado: formulario_cita.monto_esperado ? parseFloat(formulario_cita.monto_esperado) : 0,
          monto_esperado_usd: formulario_cita.monto_esperado_usd ? parseFloat(formulario_cita.monto_esperado_usd) : 0,
          tasa_cambio: Number(cambio_dolar),
          horas_aproximadas: horas,
          minutos_aproximados: minutos,
          consumibles,
          activos_fijos,
        };

        const respuesta = await agendaApi.crear(datos_crear);
        cita_id = respuesta.id;
        toast({
          title: "Éxito",
          description: "Cita creada correctamente",
        });
      }

      if (cita_id && (consumibles_seleccionados_cita.length > 0 || activos_seleccionados_cita.length > 0)) {
        try {
          await inventarioApi.asignarMaterialesCita(cita_id, {
            materiales: consumibles_seleccionados_cita.map(c => ({
              producto_id: c.producto_id,
              cantidad_planeada: c.cantidad
            }))
          });
        } catch (e) {
          console.warn("No se pudieron asignar materiales adicionales", e);
        }
      }

      setDialogoCitaAbierto(false);
      await recargarPlanSeleccionado();
    } catch (error: any) {
      console.error("Error al guardar cita:", error);
      toast({
        title: "Error",
        description: obtenerMensajeError(error) || "No se pudo guardar la cita",
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoConfirmarEliminarCita = (cita: any) => {
    setCitaAEliminar(cita);
    setDialogoConfirmarEliminarAbierto(true);
  };

  const confirmarEliminarCita = async () => {
    if (!cita_a_eliminar) return;
    try {
      await agendaApi.eliminar(cita_a_eliminar.id);
      toast({
        title: "Éxito",
        description: "Cita eliminada correctamente",
      });

      setDialogoConfirmarEliminarAbierto(false);
      setCitaAEliminar(null);
      await recargarPlanSeleccionado();
    } catch (error) {
      console.error("Error al eliminar cita:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la cita",
        variant: "destructive",
      });
    }
  };

  const confirmarEliminarPlan = async () => {
    if (!plan_a_eliminar) return;
    try {
      await planesTratamientoApi.eliminar(plan_a_eliminar.id, accion_citas_eliminar_plan);
      toast({
        title: "Éxito",
        description: "Plan de tratamiento eliminado correctamente",
      });
      setDialogoConfirmarEliminarAbierto(false);
      setPlanAEliminar(null);
      setDialogoDetallePlanAbierto(false);
      cargarPlanes();
    } catch (error: any) {
      console.error("Error al eliminar plan:", error);
      const mensaje = obtenerMensajeError(error) || "No se pudo eliminar el plan de tratamiento.";
      toast({
        title: "Error",
        description: mensaje,
        variant: "destructive",
      });
    }
  };

  const abrirDialogoConfirmarEliminarPlan = (plan: PlanTratamiento) => {
    setPlanAEliminar(plan);
    setAccionCitasEliminarPlan('borrar');
    setDialogoConfirmarEliminarAbierto(true);
  };

  const abrirDialogoEditarCosto = async () => {
    if (!plan_seleccionado) return;

    const paciente_eliminado =
      Boolean((plan_seleccionado as any)?.paciente_eliminado) ||
      Boolean((plan_seleccionado as any)?.paciente?.paciente_eliminado);

    if (paciente_eliminado) {
      toast({
        title: 'Solo lectura',
        description: 'El paciente fue eliminado. No se puede modificar el costo del plan.',
        variant: 'warning',
      });
      return;
    }

    const valor_inicial = {
      costo_total: plan_seleccionado.costo_total.toString(),
      costo_total_usd: (Number(plan_seleccionado.costo_total_usd) > 0
        ? Number(plan_seleccionado.costo_total_usd)
        : obtenerUSDDesdeLocal(plan_seleccionado.costo_total)
      ).toFixed(2)
    };
    setFormularioEditarCosto(valor_inicial);
    setFormularioEditarCostoInicial(valor_inicial);
    setDialogoEditarCostoAbierto(true);
  };

  const manejarGuardarCosto = async () => {
    if (!plan_seleccionado || !formulario_editar_costo.costo_total) {
      toast({
        title: "Error",
        description: "El costo total es obligatorio",
        variant: "destructive",
      });
      return;
    }

    const paciente_eliminado =
      Boolean((plan_seleccionado as any)?.paciente_eliminado) ||
      Boolean((plan_seleccionado as any)?.paciente?.paciente_eliminado);

    if (paciente_eliminado) {
      toast({
        title: 'Solo lectura',
        description: 'El paciente fue eliminado. No se puede modificar el costo del plan.',
        variant: 'warning',
      });
      return;
    }

    const nuevo_costo = parseFloat(formulario_editar_costo.costo_total);
    if (isNaN(nuevo_costo) || nuevo_costo <= 0) {
      toast({
        title: "Error",
        description: "El costo debe ser un número positivo",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);
    try {
      let costo_total_usd = parseFloat(formulario_editar_costo.costo_total_usd || '0');
      if (isNaN(costo_total_usd) || costo_total_usd <= 0) {
        costo_total_usd = obtenerUSDDesdeLocal(nuevo_costo);
      }

      await planesTratamientoApi.actualizar(plan_seleccionado.id, {
        costo_total: nuevo_costo,
        costo_total_usd,
        tasa_cambio: Number(cambio_dolar)
      });



      toast({
        title: "Éxito",
        description: "Tratamiento actualizado correctamente",
      });

      setDialogoEditarCostoAbierto(false);
      await recargarPlanSeleccionado();
      await cargarPlanes();
    } catch (error: any) {
      console.error("Error al actualizar tratamiento:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo actualizar el tratamiento",
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoConfirmarMaterialesCita = async (cita: any) => {
    if (!cita.id) return;

    const paciente_eliminado =
      Boolean((cita as any)?.paciente_eliminado) ||
      Boolean((plan_seleccionado as any)?.paciente_eliminado) ||
      Boolean((plan_seleccionado as any)?.paciente?.paciente_eliminado);

    if (paciente_eliminado) {
      toast({
        title: 'Solo lectura',
        description: 'El paciente fue eliminado. No se pueden confirmar materiales ni editar el pago de esta cita.',
        variant: 'warning',
      });
      return;
    }

    setCitaSeleccionada(cita);
    setCargandoMateriales(true);
    setEstadoPagoConfirmacion(cita.estado_pago || 'pendiente');
    const tasa = Number(cambio_dolar || 1);
    const localRaw = cita.monto_esperado;
    const usdRaw = (cita as any).monto_esperado_usd;
    const local = (localRaw ?? '') === null ? '' : (localRaw !== undefined && localRaw !== null ? String(localRaw) : '');
    const usd = (usdRaw ?? '') === null ? '' : (usdRaw !== undefined && usdRaw !== null ? String(usdRaw) : '');
    const localFinal = local !== '' ? local : (usd !== '' && !Number.isNaN(parseFloat(usd)) ? (parseFloat(usd) * tasa).toFixed(2) : '');
    const usdFinal = usd !== '' ? usd : (local !== '' && !Number.isNaN(parseFloat(local)) ? (parseFloat(local) / tasa).toFixed(2) : '');

    setMontoConfirmacion(localFinal);
    setMontoConfirmacionUsd(usdFinal);
    setConsumiblesConfirmacion([]);
    setActivosConfirmacion([]);

    try {
      const respuesta = await inventarioApi.obtenerMaterialesCita(cita.id);
      const materiales_raw = respuesta.materiales || [];

      const consumibles: any[] = [];
      const activos: any[] = [];

      for (const material of materiales_raw) {
        const es_activo = material.tipo_gestion === 'activo_fijo' || material.tipo_gestion === 'activo_serializado';

        if (material.items && material.items.length > 0) {
          for (const item of material.items) {
            const cant_planeada = Math.max(0, parseFloat(item.cantidad_planeada?.toString() || '0'));
            const obj = {
              material_cita_id: material.id,
              producto_nombre: material.producto_nombre,
              inventario_nombre: material.inventario_nombre,
              tipo_gestion: material.tipo_gestion,
              cantidad_planeada: cant_planeada,
              cantidad_usada: cant_planeada,
              cantidad: cant_planeada,
              lote_id: item.lote_id,
              activo_id: item.activo_id,
              nro_lote: item.nro_lote,
              nro_serie: item.nro_serie,
              nombre_asignado: item.nombre_asignado,
              unidad_medida: material.unidad_medida,
              inventario_id: material.inventario_id,
              producto_id: material.producto_id,
              material_id: item.material_id
            };

            if (es_activo) activos.push(obj);
            else consumibles.push(obj);
          }
        } else {
          const cant_planeada = Math.max(0, parseFloat(material.cantidad_planeada?.toString() || '0'));
          const obj = {
            material_cita_id: material.id,
            producto_nombre: material.producto_nombre,
            inventario_nombre: material.inventario_nombre,
            tipo_gestion: material.tipo_gestion,
            cantidad_planeada: cant_planeada,
            cantidad_usada: cant_planeada,
            cantidad: cant_planeada,
            unidad_medida: material.unidad_medida,
            inventario_id: material.inventario_id,
            producto_id: material.producto_id,
            material_id: material.material_id
          };

          if (es_activo) activos.push(obj);
          else consumibles.push(obj);
        }
      }

      setConsumiblesConfirmacion(consumibles);
      setActivosConfirmacion(activos);

      setConsumiblesConfirmacionInicial(JSON.parse(JSON.stringify(consumibles)));
      setEstadoPagoConfirmacionInicial(cita.estado_pago || 'pendiente');
      setMontoConfirmacionInicial(localFinal);
      setMontoConfirmacionUsdInicial(usdFinal);

      setAccionPagoConfirmacion('mantener');
      setDialogoConfirmarMaterialesAbierto(true);
    } catch (error) {
      console.error('Error al cargar materiales:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los materiales de la cita',
        variant: 'destructive',
      });
    } finally {
      setCargandoMateriales(false);
    }
  };

  const manejarConfirmarMaterialesCita = async (confirmado_pago: boolean = false, accion_pago?: 'mantener' | 'reembolsar' | 'eliminar') => {
    if (!cita_seleccionada?.id) return;

    const estado_actual = (cita_seleccionada.estado_pago || '').toLowerCase();
    const nuevo_estado = (estado_pago_confirmacion || '').toLowerCase();
    if (!estados_pago_validos.includes(estado_pago_confirmacion)) {
      toast({
        title: 'Error',
        description: 'Selecciona un estado de pago válido',
        variant: 'destructive',
      });
      return;
    }
    const requiere_accion_pago = estado_actual === 'pagado' && (nuevo_estado === 'cancelado' || nuevo_estado === 'pendiente');
    const accion_cancelacion_pago = requiere_accion_pago ? (accion_pago ?? accion_pago_confirmacion) : undefined;

    if (accion_cancelacion_pago === 'eliminar' && !confirmado_pago) {
      setContextoEliminarPago('confirmacion');
      setConfirmarEliminarPagoAbierto(true);
      setGuardando(false);
      return;
    }

    setGuardando(true);
    try {
      await agendaApi.actualizar(cita_seleccionada.id, {
        estado_pago: estado_pago_confirmacion,
        monto_esperado: monto_confirmacion ? parseFloat(monto_confirmacion) : 0,
        monto_esperado_usd: monto_confirmacion_usd ? parseFloat(monto_confirmacion_usd) : 0,
        tasa_cambio: Number(cambio_dolar || 1),
        ...(accion_cancelacion_pago ? { accion_cancelacion_pago: accion_cancelacion_pago } : {}),
      });

      const consumibles_nuevos = consumibles_confirmacion.filter(m => !m.material_cita_id);
      const consumibles_existentes = consumibles_confirmacion.filter(m => m.material_cita_id);

      const activos_nuevos = activos_confirmacion.filter(a => !a.material_cita_id);
      const activos_existentes = activos_confirmacion.filter(a => a.material_cita_id);
      const materiales_a_agregar = [];

      for (const m of consumibles_nuevos) {
        materiales_a_agregar.push({
          producto_id: m.producto_id,
          inventario_id: m.inventario_id,
          lote_id: m.material_id,
          cantidad_planeada: m.cantidad
        });
      }

      for (const a of activos_nuevos) {
        materiales_a_agregar.push({
          producto_id: a.producto_id,
          inventario_id: a.inventario_id,
          activo_id: a.activo_id,
          cantidad_planeada: 1
        });
      }

      if (materiales_a_agregar.length > 0) {
        await inventarioApi.agregarMaterialesCita(cita_seleccionada.id, {
          materiales: materiales_a_agregar
        });
      }

      const materiales_a_confirmar = [];

      for (const m of consumibles_existentes) {
        materiales_a_confirmar.push({
          material_cita_id: m.material_cita_id,
          cantidad_usada: Number(m.cantidad),
          lote_id: m.lote_id,
          inventario_id: m.inventario_id
        });
      }

      for (const a of activos_existentes) {
        materiales_a_confirmar.push({
          material_cita_id: a.material_cita_id,
          cantidad_usada: 1,
          activo_id: a.activo_id,
          inventario_id: a.inventario_id
        });
      }

      if (materiales_a_confirmar.length > 0) {
        await inventarioApi.confirmarMaterialesCita(cita_seleccionada.id, {
          materiales: materiales_a_confirmar
        });
      }

      toast({
        title: 'Éxito',
        description: 'Cita confirmada correctamente (estado, monto y materiales)',
      });

      setDialogoConfirmarMaterialesAbierto(false);
      await recargarPlanSeleccionado();
    } catch (error: any) {
      console.error('Error al confirmar cita:', error);
      toast({
        title: 'Error',
        description: obtenerMensajeError(error) || 'No se pudo confirmar la cita',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };


  const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];


  const formatearFecha = (fecha: Date): string => {
    const f = new Date(fecha);
    const dia = String(f.getDate()).padStart(2, "0");
    const mes = MESES_CORTOS[f.getMonth()] ?? "";
    const anio = f.getFullYear();
    return `${dia} ${mes} ${anio}`.trim();
  };

  const formatearFechaHora = (fecha: Date): string => {
    const f = new Date(fecha);
    const dia = String(f.getDate()).padStart(2, "0");
    const mes = MESES_CORTOS[f.getMonth()] ?? "";
    const anio = f.getFullYear();
    const horas = String(f.getHours()).padStart(2, "0");
    const minutos = String(f.getMinutes()).padStart(2, "0");
    return `${dia} ${mes} ${anio} ${horas}:${minutos}`.trim();
  };

  const formatearDuracion = (horas: number, minutos: number): string => {
    if (horas > 0 && minutos > 0) {
      return `${horas}h ${minutos}min`;
    } else if (horas > 0) {
      return `${horas}h`;
    } else {
      return `${minutos}min`;
    }
  };

  const calcularProgreso = (plan: PlanTratamiento): number => {
    const montos = obtenerMontosPlan(plan);
    if (montos.costo === 0) return 0;
    return (montos.abonado / montos.costo) * 100;
  };

  const obtenerColorEstado = (estado: string): string => {
    const estado_encontrado = estados_pago.find(e => e.valor === estado);
    return estado_encontrado?.color || 'bg-gray-500';
  };

  const obtenerEtiquetaEstado = (estado: string): string => {
    const estado_encontrado = estados_pago.find(e => e.valor === estado);
    return estado_encontrado?.etiqueta || estado;
  };

  const obtenerTextoIntervalo = (tratamiento: Tratamiento): string => {
    const dias = tratamiento.intervalo_dias || 0;
    const semanas = tratamiento.intervalo_semanas || 0;
    const meses = tratamiento.intervalo_meses || 0;

    const partes: string[] = [];

    if (meses > 0) {
      partes.push(`${meses} mes${meses !== 1 ? 'es' : ''}`);
    }
    if (semanas > 0) {
      partes.push(`${semanas} semana${semanas !== 1 ? 's' : ''}`);
    }
    if (dias > 0) {
      partes.push(`${dias} día${dias !== 1 ? 's' : ''}`);
    }

    if (partes.length === 0) {
      return 'Sin intervalo (mismo día)';
    }

    return `Cada ${partes.join(', ')}`;
  };

  const obtenerTextoBusquedaPlantilla = useCallback((tratamiento: Tratamiento): string => {
    return `${tratamiento?.nombre ?? ''}`;
  }, []);

  const obtenerTextoBusquedaPlan = useCallback((plan: PlanTratamiento): string => {
    const nombre_paciente = `${plan?.paciente?.nombre ?? ''} ${plan?.paciente?.apellidos ?? ''}`.trim();
    const nombre_tratamiento = `${plan?.tratamiento?.nombre ?? ''}`;
    return `${plan?.id ?? ''} ${nombre_paciente} ${nombre_tratamiento}`.trim();
  }, []);

  const opciones_pacientes: OpcionCombobox[] = [
    { valor: "todos", etiqueta: "Todos los pacientes" },
    ...pacientes.map(p => ({
      valor: p.id.toString(),
      etiqueta: `${p.nombre} ${p.apellidos}`
    }))
  ];

  const { handleOpenChange: handleOpenChangePlantilla, closeConfirmationProps: closeConfirmationPropsPlantilla } = useSafeClose({
    isOpen: dialogo_plantilla_abierto,
    onOpenChange: setDialogoPlantillaAbierto,
    isDirty: formularioPlantillaCambio(),
  });

  const { handleOpenChange: handleOpenChangeCita, closeConfirmationProps: closeConfirmationPropsCita } = useSafeClose({
    isOpen: dialogo_cita_abierto,
    onOpenChange: setDialogoCitaAbierto,
    isDirty: materialesCitaCambiaron() || formularioCitaCambio(),
  });

  const hay_cambios_confirmacion_materiales = estado_pago_confirmacion !== estado_pago_confirmacion_inicial ||
    monto_confirmacion !== monto_confirmacion_inicial ||
    monto_confirmacion_usd !== monto_confirmacion_usd_inicial ||
    JSON.stringify(consumibles_confirmacion) !== JSON.stringify(consumibles_confirmacion_inicial);

  const { handleOpenChange: handleOpenChangeConfirmacion, closeConfirmationProps: closeConfirmationPropsConfirmacion } = useSafeClose({
    isOpen: dialogo_confirmar_materiales_abierto,
    onOpenChange: setDialogoConfirmarMaterialesAbierto,
    isDirty: hay_cambios_confirmacion_materiales,
  });

  const { handleOpenChange: handleOpenChangeCosto, closeConfirmationProps: closeConfirmationPropsCosto } = useSafeClose({
    isOpen: dialogo_editar_costo_abierto,
    onOpenChange: setDialogoEditarCostoAbierto,
    isDirty: JSON.stringify(formulario_editar_costo) !== JSON.stringify(formulario_editar_costo_inicial),
  });

  const {
    items_filtrados: tratamientos_filtrados,
    items_paginados: tratamientos_paginados,
    pagina_actual: pagina_plantillas,
    setPaginaActual: setPaginaPlantillas,
    items_por_pagina: items_por_pagina_plantillas,
    setItemsPorPagina: setItemsPorPaginaPlantillas,
    total_paginas: total_paginas_plantillas,
  } = useBusquedaPaginacion({
    items: tratamientos,
    busqueda: busqueda_plantillas,
    obtenerTexto: obtenerTextoBusquedaPlantilla,
    items_por_pagina_inicial: 10,
  });

  const planes_por_paciente = useMemo(() => {
    if (paciente_filtro === 'todos') return planes;
    return planes.filter((p) => p.paciente?.id?.toString() === paciente_filtro);
  }, [paciente_filtro, planes]);

  const planes_base_en_curso = useMemo(
    () => planes_por_paciente.filter((p) => !p.estado || p.estado === 'pendiente'),
    [planes_por_paciente],
  );
  const planes_base_completados = useMemo(
    () => planes_por_paciente.filter((p) => p.estado === 'completado'),
    [planes_por_paciente],
  );
  const planes_base_cancelados = useMemo(
    () => planes_por_paciente.filter((p) => p.estado === 'cancelado'),
    [planes_por_paciente],
  );

  const {
    items_filtrados: planes_en_curso_filtrados,
    items_paginados: planes_en_curso_paginados,
    pagina_actual: pagina_planes_en_curso,
    setPaginaActual: setPaginaPlanesEnCurso,
    setItemsPorPagina: setItemsPorPaginaPlanesEnCurso,
    total_paginas: total_paginas_planes_en_curso,
  } = useBusquedaPaginacion({
    items: planes_base_en_curso,
    busqueda: busqueda_planes,
    obtenerTexto: obtenerTextoBusquedaPlan,
    items_por_pagina_inicial: items_por_pagina_planes,
  });

  const {
    items_filtrados: planes_completados_filtrados,
    items_paginados: planes_completados_paginados,
    pagina_actual: pagina_planes_completados,
    setPaginaActual: setPaginaPlanesCompletados,
    setItemsPorPagina: setItemsPorPaginaPlanesCompletados,
    total_paginas: total_paginas_planes_completados,
  } = useBusquedaPaginacion({
    items: planes_base_completados,
    busqueda: busqueda_planes,
    obtenerTexto: obtenerTextoBusquedaPlan,
    items_por_pagina_inicial: items_por_pagina_planes,
  });

  const {
    items_filtrados: planes_cancelados_filtrados,
    items_paginados: planes_cancelados_paginados,
    pagina_actual: pagina_planes_cancelados,
    setPaginaActual: setPaginaPlanesCancelados,
    setItemsPorPagina: setItemsPorPaginaPlanesCancelados,
    total_paginas: total_paginas_planes_cancelados,
  } = useBusquedaPaginacion({
    items: planes_base_cancelados,
    busqueda: busqueda_planes,
    obtenerTexto: obtenerTextoBusquedaPlan,
    items_por_pagina_inicial: items_por_pagina_planes,
  });

  const total_planes_filtrados =
    planes_en_curso_filtrados.length +
    planes_completados_filtrados.length +
    planes_cancelados_filtrados.length;

  useEffect(() => {
    setItemsPorPaginaPlanesEnCurso(items_por_pagina_planes);
    setItemsPorPaginaPlanesCompletados(items_por_pagina_planes);
    setItemsPorPaginaPlanesCancelados(items_por_pagina_planes);
  }, [
    items_por_pagina_planes,
    setItemsPorPaginaPlanesEnCurso,
    setItemsPorPaginaPlanesCompletados,
    setItemsPorPaginaPlanesCancelados,
  ]);

  useEffect(() => {
    setPaginaPlanesEnCurso(1);
    setPaginaPlanesCompletados(1);
    setPaginaPlanesCancelados(1);
  }, [paciente_filtro, setPaginaPlanesEnCurso, setPaginaPlanesCompletados, setPaginaPlanesCancelados]);

  const condicionesBloqueoTutoriales = useMemo(() => {
    const tienePacientes = pacientes.length > 0;
    const tienePlantillas = tratamientos.length > 0;
    const tienePlanesEnCurso = planes_base_en_curso.length > 0;

    const bloqueadoAsignar = !(tienePacientes && tienePlantillas);
    const mensajeAsignar = !tienePacientes
      ? 'Requiere crear al menos un paciente para realizar este tutorial.'
      : !tienePlantillas
        ? 'Requiere crear al menos una plantilla de tratamiento para realizar este tutorial.'
        : undefined;

    return {
      'tratamientos-asignar-tratamiento': {
        bloqueado: bloqueadoAsignar,
        mensaje: mensajeAsignar,
      },
      'tratamientos-gestionar-plan': {
        bloqueado: !tienePlanesEnCurso,
        mensaje: !tienePlanesEnCurso ? 'Requiere tener al menos un plan de tratamiento en curso para realizar este tutorial.' : undefined,
      },
    };
  }, [pacientes.length, tratamientos.length, planes_base_en_curso.length]);

  const definicionesTutorialesTratamientos = useMemo(() => {
    const tienePacientes = pacientes.length > 0;
    const tienePlantillas = tratamientos.length > 0;
    const tienePlanesEnCurso = planes_base_en_curso.length > 0;

    return TUTORIALES_TRATAMIENTOS.map((t) => {
      if (!t.condicionBloqueo?.condicionesPrevias) return t;

      if (t.nombre === 'tratamientos-asignar-tratamiento') {
        const condicionesPrevias = t.condicionBloqueo.condicionesPrevias.map((c) => {
          if (c.id === 'tiene-pacientes') return { ...c, completada: tienePacientes };
          if (c.id === 'tiene-plantillas') return { ...c, completada: tienePlantillas };
          return c;
        });

        return {
          ...t,
          condicionBloqueo: {
            ...t.condicionBloqueo,
            condicionesPrevias,
          },
        };
      }

      if (t.nombre === 'tratamientos-gestionar-plan') {
        const condicionesPrevias = t.condicionBloqueo.condicionesPrevias.map((c) => {
          if (c.id === 'tiene-planes-en-curso') return { ...c, completada: tienePlanesEnCurso };
          return c;
        });

        return {
          ...t,
          condicionBloqueo: {
            ...t.condicionBloqueo,
            condicionesPrevias,
          },
        };
      }

      return t;
    });
  }, [pacientes.length, tratamientos.length, planes_base_en_curso.length]);

  const manejarCambiarEstado = async (plan_id: number, nuevo_estado: string) => {
    const plan = (planes || []).find((p) => p.id === plan_id);
    const paciente_eliminado =
      Boolean((plan as any)?.paciente_eliminado) ||
      Boolean((plan as any)?.paciente?.paciente_eliminado);

    if (paciente_eliminado) {
      toast({
        title: 'Solo lectura',
        description: 'El paciente fue eliminado. No se puede modificar ni reactivar este plan de tratamiento.',
        variant: 'warning',
      });
      return;
    }

    try {
      await planesTratamientoApi.cambiarEstado(plan_id, nuevo_estado);
      toast({
        title: "Éxito",
        description: nuevo_estado === 'completado'
          ? "Plan marcado como completado"
          : nuevo_estado === 'cancelado'
            ? "Plan cancelado. Las citas pendientes han sido canceladas."
            : "Plan reactivado. Las citas han sido restauradas.",
      });
      cargarPlanes();
      if (plan_seleccionado?.id === plan_id) {
        recargarPlanSeleccionado();
      }
    } catch (error: any) {
      console.error("Error al cambiar estado:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo cambiar el estado del plan",
        variant: "destructive",
      });
    }
  };

  const hay_cambios_cita = modo_edicion_cita && (materialesCitaCambiaron() || formularioCitaCambio());

  const requiere_accion_pago_edicion = modo_edicion_cita && cita_seleccionada &&
    (cita_seleccionada.estado_pago || '').toLowerCase() === 'pagado' &&
    ((formulario_cita.estado_pago || '').toLowerCase() === 'cancelado' || (formulario_cita.estado_pago || '').toLowerCase() === 'pendiente');

  const requiere_accion_pago_confirmacion = cita_seleccionada &&
    (cita_seleccionada.estado_pago || '').toLowerCase() === 'pagado' &&
    ((estado_pago_confirmacion || '').toLowerCase() === 'cancelado' || (estado_pago_confirmacion || '').toLowerCase() === 'pendiente');

  const renderSelectorAccionPago = (
    valor: 'mantener' | 'reembolsar' | 'eliminar',
    setValor: (v: 'mantener' | 'reembolsar' | 'eliminar') => void,
    id: string
  ) => (
    <details className="mt-3 border rounded-md bg-muted/40" open>
      <summary className="px-3 py-2 text-sm font-semibold cursor-pointer">Acción sobre el pago</summary>
      <div className="px-4 pb-4 pt-2 space-y-3">
        <p className="text-xs text-muted-foreground">Selecciona qué hacer con el pago al cambiar el estado desde Pagado.</p>
        {([
          { key: 'mantener', titulo: 'Desasociar el pago (mantenerlo)', desc: 'Quita el enlace a la cita pero conserva el pago registrado.' },
          { key: 'reembolsar', titulo: 'Registrar devolución', desc: 'Crea un egreso de reembolso por cancelación.' },
          { key: 'eliminar', titulo: 'Eliminar el pago', desc: 'Borra el registro financiero si fue un error.' }
        ] as const).map(op => (
          <label key={`${id}-${op.key}`} className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name={`accion-pago-${id}`}
              className={`mt-1 h-4 w-4 ${op.key === 'eliminar' ? 'accent-red-500' : 'accent-primary'}`}
              checked={valor === op.key}
              onChange={() => setValor(op.key)}
            />
            <div>
              <div className={`text-sm font-medium ${op.key === 'eliminar' ? 'text-red-600' : ''}`}>{op.titulo}</div>
              <div className="text-xs text-muted-foreground">{op.desc}</div>
            </div>
          </label>
        ))}
        {valor === 'eliminar' && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            Se eliminará el registro financiero. Esta acción es irreversible.
          </div>
        )}
      </div>
    </details>
  );

  if (cargando) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando tratamientos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProveedorTutorialesPagina
      pagina="/tratamientos"
      definicionesTutoriales={definicionesTutorialesTratamientos}
      condicionesBloqueo={condicionesBloqueoTutoriales}
    >
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h1 id={IDS_ELEMENTOS_TRATAMIENTOS.TITULO_PAGINA} className="text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
                  <TituloAccionable titulo="Tratamientos">Tratamientos</TituloAccionable>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Gestiona plantillas y planes de tratamiento
                </p>
              </div>

              <Button
                id={IDS_ELEMENTOS_TRATAMIENTOS.BTN_ACCION_SUPERIOR}
                size="lg"
                className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                onClick={tabActiva === 'planes' ? () => abrirDialogoAsignar() : abrirDialogoNuevo}
              >
              {tabActiva === 'planes' ? (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Asignar Tratamiento
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Nueva Plantilla
                </>
              )}
              </Button>
            </div>

          <Tabs
            value={tabActiva}
            onValueChange={(value) => {
              setTabActiva(value as TabTratamientos);
              if (value === "planes") {
                cargarPlanes();
              }
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger id={IDS_ELEMENTOS_TRATAMIENTOS.TAB_PLANES} value="planes" className="text-base">
                Planes Asignados
              </TabsTrigger>
              <TabsTrigger id={IDS_ELEMENTOS_TRATAMIENTOS.TAB_PLANTILLAS} value="plantillas" className="text-base">
                Plantillas de Tratamiento
              </TabsTrigger>
            </TabsList>

            <TabsContent value="planes" className="space-y-6 mt-6">
              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          Planes de Tratamiento Asignados
                        </CardTitle>
                        <CardDescription>
                          {total_planes_filtrados} de {planes.length} planes
                          {(paciente_filtro !== 'todos' || busqueda_planes) && ' (filtrados)'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-64">
                        <Combobox
                          opciones={opciones_pacientes}
                          valor={paciente_filtro}
                          onChange={setPacienteFiltro}
                          placeholder="Filtrar por paciente"
                        />
                      </div>
                      <div className="w-80">
                        <SearchInput
                          valor={busqueda_planes}
                          onChange={setBusquedaPlanes}
                          placeholder="Buscar por paciente o tratamiento..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Mostrar</span>
                        <Select
                          value={String(items_por_pagina_planes)}
                          onValueChange={(v) => setItemsPorPaginaPlanes(Number(v))}
                        >
                          <SelectTrigger className="w-[96px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {cargando_planes ? (
                    <div className="text-center py-12 space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                      <p className="text-muted-foreground">
                        Cargando planes...
                      </p>
                    </div>
                  ) : total_planes_filtrados === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {busqueda_planes || paciente_filtro !== 'todos'
                            ? 'No se encontraron planes'
                            : 'No hay planes de tratamiento asignados'
                          }
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          {busqueda_planes || paciente_filtro !== 'todos'
                            ? 'Intenta con otro filtro de búsqueda'
                            : 'Asigna plantillas de tratamiento a tus pacientes desde la pestaña de Plantillas'
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Tabs value={tab_estado_plan} onValueChange={(v) => setTabEstadoPlan(v as TabEstadoPlan)} className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="pendiente" className="text-sm">
                          <Clock className="h-4 w-4 mr-2" />
                          En Curso ({planes_en_curso_filtrados.length})
                        </TabsTrigger>
                        <TabsTrigger value="completado" className="text-sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completados ({planes_completados_filtrados.length})
                        </TabsTrigger>
                        <TabsTrigger value="cancelado" className="text-sm">
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancelados ({planes_cancelados_filtrados.length})
                        </TabsTrigger>
                      </TabsList>

                      {['pendiente', 'completado', 'cancelado'].map((estado_tab) => (
                        <TabsContent key={estado_tab} value={estado_tab} className="space-y-4">
                          {(
                            estado_tab === 'pendiente'
                              ? planes_en_curso_filtrados
                              : estado_tab === 'completado'
                                ? planes_completados_filtrados
                                : planes_cancelados_filtrados
                          ).length === 0 ? (
                            <div className="text-center py-8 space-y-3">
                              <div className="mx-auto w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center">
                                {estado_tab === 'pendiente' ? <Clock className="h-6 w-6 text-muted-foreground" /> :
                                  estado_tab === 'completado' ? <CheckCircle className="h-6 w-6 text-muted-foreground" /> :
                                    <XCircle className="h-6 w-6 text-muted-foreground" />}
                              </div>
                              <p className="text-muted-foreground">
                                {estado_tab === 'pendiente' ? 'No hay planes en curso' :
                                  estado_tab === 'completado' ? 'No hay planes completados' :
                                    'No hay planes cancelados'}
                              </p>
                            </div>
                          ) : (
                            <>
                              {(estado_tab === 'pendiente'
                                ? planes_en_curso_paginados
                                : estado_tab === 'completado'
                                  ? planes_completados_paginados
                                  : planes_cancelados_paginados
                              ).map((plan, idx) => {
                              const progreso = calcularProgreso(plan);
                              const montos_plan = obtenerMontosPlan(plan);
                              const saldo_pendiente = montos_plan.pendiente;
                              const estado_actual = plan.estado || 'pendiente';

                              return (
                                <div
                                  key={plan.id}
                                  id={
                                    estado_tab === 'pendiente' && idx === 0 && pagina_planes_en_curso === 1
                                      ? IDS_ELEMENTOS_TRATAMIENTOS.CARD_PRIMER_PLAN
                                      : undefined
                                  }
                                  className={`p-6 rounded-lg border-2 border-border bg-secondary/30 hover:bg-secondary/50 hover:scale-[1.01] hover:shadow-md transition-all duration-200 cursor-pointer ${estado_actual === 'cancelado' ? 'opacity-60' : ''}`}
                                  onClick={() => verDetallePlan(plan)}
                                >
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <User className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-bold text-foreground">
                                          {plan.paciente.nombre}{" "}
                                          {plan.paciente.apellidos}
                                        </h3>
                                        {estado_actual === 'completado' && (
                                          <Badge variant="default" className="bg-green-500 text-white">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Completado
                                          </Badge>
                                        )}
                                        {estado_actual === 'cancelado' && (
                                          <Badge variant="destructive">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Cancelado
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        {plan.tratamiento.nombre}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={progreso >= 100 ? "default" : "secondary"}
                                        className="text-sm hover:scale-110 transition-transform duration-200"
                                      >
                                        {progreso >= 100 ? (
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                        ) : null}
                                        {progreso.toFixed(0)}% pagado
                                      </Badge>
                                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                        {estado_actual === 'pendiente' && (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                manejarCambiarEstado(plan.id, 'completado');
                                              }}
                                              className="h-8 w-8 hover:bg-green-500/20 hover:text-green-500 hover:scale-110 transition-all duration-200"
                                              title="Marcar como Completado"
                                            >
                                              <CheckCircle2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                manejarCambiarEstado(plan.id, 'cancelado');
                                              }}
                                              className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500 hover:scale-110 transition-all duration-200"
                                              title="Cancelar Plan"
                                            >
                                              <XCircle className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPlanSeleccionado(plan);
                                                abrirDialogoEditarCosto();
                                              }}
                                              className="h-8 w-8 hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                                              title="Editar Costo"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                abrirDialogoConfirmarEliminarPlan(plan);
                                              }}
                                              className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                                              title="Eliminar Plan"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </>
                                        )}
                                        {estado_actual === 'completado' && (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                manejarCambiarEstado(plan.id, 'pendiente');
                                              }}
                                              className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-500 hover:scale-110 transition-all duration-200"
                                              title="Reactivar Plan"
                                            >
                                              <ArrowRight className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                abrirDialogoConfirmarEliminarPlan(plan);
                                              }}
                                              className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                                              title="Eliminar Plan"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </>
                                        )}
                                        {estado_actual === 'cancelado' && (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                manejarCambiarEstado(plan.id, 'pendiente');
                                              }}
                                              className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-500 hover:scale-110 transition-all duration-200"
                                              title="Reactivar Plan"
                                            >
                                              <ArrowRight className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                abrirDialogoConfirmarEliminarPlan(plan);
                                              }}
                                              className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                                              title="Eliminar Plan"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-500 ${estado_actual === 'cancelado'
                                          ? 'bg-gradient-to-r from-gray-500 to-gray-400'
                                          : 'bg-gradient-to-r from-green-500 to-green-400'
                                          }`}
                                        style={{ width: `${Math.min(progreso, 100)}%` }}
                                      />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div className="space-y-1">
                                        <p className="text-muted-foreground">
                                          Costo Total
                                        </p>
                                        <p className="font-semibold text-foreground">
                                          {formatearMonto(plan.costo_total, plan.costo_total_usd)}
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-muted-foreground">
                                          Abonado
                                        </p>
                                        <p className="font-semibold text-green-500">
                                          {formatearMonto(plan.total_abonado, plan.total_abonado_usd)}
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-muted-foreground">Pendiente</p>
                                        <p
                                          className={`font-semibold ${saldo_pendiente > 0 ? "text-red-500" : "text-green-500"}`}
                                        >
                                          {formatearMontoActual(saldo_pendiente)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {plan.citas?.length || 0} citas programadas
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Coins className="h-3 w-3" />
                                        {plan.pagos?.length || 0} pagos registrados
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                  <div className="text-sm text-muted-foreground">
                                    Página{' '}
                                    {estado_tab === 'pendiente'
                                      ? pagina_planes_en_curso
                                      : estado_tab === 'completado'
                                        ? pagina_planes_completados
                                        : pagina_planes_cancelados}{' '}
                                    de{' '}
                                    {Math.max(
                                      1,
                                      estado_tab === 'pendiente'
                                        ? total_paginas_planes_en_curso
                                        : estado_tab === 'completado'
                                          ? total_paginas_planes_completados
                                          : total_paginas_planes_cancelados,
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={
                                        (estado_tab === 'pendiente'
                                          ? pagina_planes_en_curso
                                          : estado_tab === 'completado'
                                            ? pagina_planes_completados
                                            : pagina_planes_cancelados) <= 1
                                      }
                                      onClick={() =>
                                        (estado_tab === 'pendiente'
                                          ? setPaginaPlanesEnCurso
                                          : estado_tab === 'completado'
                                            ? setPaginaPlanesCompletados
                                            : setPaginaPlanesCancelados)((p: number) => Math.max(1, p - 1))
                                      }
                                    >
                                      Anterior
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={
                                        (estado_tab === 'pendiente'
                                          ? pagina_planes_en_curso
                                          : estado_tab === 'completado'
                                            ? pagina_planes_completados
                                            : pagina_planes_cancelados) >=
                                        (estado_tab === 'pendiente'
                                          ? total_paginas_planes_en_curso
                                          : estado_tab === 'completado'
                                            ? total_paginas_planes_completados
                                            : total_paginas_planes_cancelados)
                                      }
                                      onClick={() =>
                                        (estado_tab === 'pendiente'
                                          ? setPaginaPlanesEnCurso
                                          : estado_tab === 'completado'
                                            ? setPaginaPlanesCompletados
                                            : setPaginaPlanesCancelados)((p: number) => p + 1)
                                      }
                                    >
                                      Siguiente
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </TabsContent>
                      ))}
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plantillas" className="space-y-6 mt-6">
              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          Plantillas de Tratamiento
                        </CardTitle>
                        <CardDescription>
                          {tratamientos_filtrados.length} de {tratamientos.length} plantillas
                          {busqueda_plantillas && ' (filtradas)'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="w-80">
                      <SearchInput
                        valor={busqueda_plantillas}
                        onChange={setBusquedaPlantillas}
                        placeholder="Buscar plantilla por nombre..."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Mostrar</span>
                      <Select
                        value={String(items_por_pagina_plantillas)}
                        onValueChange={(v) => setItemsPorPaginaPlantillas(Number(v))}
                      >
                        <SelectTrigger className="w-[96px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {tratamientos_filtrados.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {busqueda_plantillas
                            ? 'No se encontraron plantillas'
                            : 'No hay plantillas registradas'
                          }
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          {busqueda_plantillas
                            ? 'Intenta con otro término de búsqueda'
                            : 'Crea plantillas de tratamientos comunes para agilizar tu trabajo'
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div id={IDS_ELEMENTOS_TRATAMIENTOS.LISTA_PLANTILLAS}>
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre del Tratamiento</TableHead>
                          <TableHead>Número de Citas</TableHead>
                          <TableHead>Intervalo</TableHead>
                          <TableHead>Duración por Cita</TableHead>
                          <TableHead>Costo Total</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tratamientos_paginados.map((tratamiento, idx) => (
                          <TableRow
                            key={tratamiento.id}
                            className="hover:bg-secondary/50 transition-colors duration-200"
                          >
                            <TableCell className="font-medium">
                              {tratamiento.nombre}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {tratamiento.numero_citas} citas
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {obtenerTextoIntervalo(tratamiento)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {formatearDuracion(tratamiento.horas_aproximadas_citas, tratamiento.minutos_aproximados_citas)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-green-500 font-semibold">
                                <Coins className="h-4 w-4" />
                                {usarUSD
                                  ? formatearUSD(obtenerUSDDesdeLocal(tratamiento.costo_total))
                                  : formatearMonedaJSX(tratamiento.costo_total)
                                }
                              </div>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                id={
                                  pagina_plantillas === 1 && idx === 0
                                    ? IDS_ELEMENTOS_TRATAMIENTOS.BTN_ASIGNAR_PRIMERA_PLANTILLA
                                    : undefined
                                }
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirDialogoAsignar(tratamiento)}
                                className="hover:bg-green-500/20 hover:text-green-500 hover:scale-110 transition-all duration-200"
                                title="Asignar a paciente"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirDialogoEditar(tratamiento)}
                                className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirDialogoConfirmarEliminarPlantilla(tratamiento)}
                                className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <div className="text-sm text-muted-foreground">
                            Página {pagina_plantillas} de {Math.max(1, total_paginas_plantillas)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={pagina_plantillas <= 1}
                              onClick={() => setPaginaPlantillas((p) => Math.max(1, p - 1))}
                            >
                              Anterior
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={pagina_plantillas >= total_paginas_plantillas}
                              onClick={() => setPaginaPlantillas((p) => p + 1)}
                            >
                              Siguiente
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog
        open={dialogo_plantilla_abierto}
        onOpenChange={handleOpenChangePlantilla}
      >
        <DialogContent id={IDS_ELEMENTOS_TRATAMIENTOS.DIALOG_PLANTILLA} className="sm:max-w-[900px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion
                ? "Editar Plantilla de Tratamiento"
                : "Nueva Plantilla de Tratamiento"}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion
                ? "Modifica la información de la plantilla"
                : "Crea una plantilla para tratamientos comunes"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
            <Tabs defaultValue="datos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger id={IDS_ELEMENTOS_TRATAMIENTOS.TAB_PLANTILLA_DATOS} value="datos" className="flex items-center gap-1 text-sm">
                  <FileText className="h-4 w-4" />
                  Datos del Plan
                </TabsTrigger>
                <TabsTrigger id={IDS_ELEMENTOS_TRATAMIENTOS.TAB_PLANTILLA_RECURSOS} value="recursos" className="flex items-center gap-1 text-sm" onClick={() => cargarInventarios()}>
                  <Package className="h-4 w-4" />
                  Recursos por Cita
                  {consumibles_plantilla.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{consumibles_plantilla.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="datos" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={IDS_ELEMENTOS_TRATAMIENTOS.INPUT_PLANTILLA_NOMBRE}>Nombre del Tratamiento *</Label>
                  <Input
                    id={IDS_ELEMENTOS_TRATAMIENTOS.INPUT_PLANTILLA_NOMBRE}
                    value={formulario_plantilla.nombre}
                    onChange={(e) =>
                      setFormularioPlantilla({
                        ...formulario_plantilla,
                        nombre: e.target.value,
                      })
                    }
                    placeholder="Ej: Endodoncia, Ortodoncia, Blanqueamiento"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={IDS_ELEMENTOS_TRATAMIENTOS.INPUT_PLANTILLA_NUMERO_CITAS}>Número de Citas *</Label>
                    <Input
                      id={IDS_ELEMENTOS_TRATAMIENTOS.INPUT_PLANTILLA_NUMERO_CITAS}
                      type="number"
                      min="1"
                      max="100"
                      value={formulario_plantilla.numero_citas}
                      onChange={(e) =>
                        setFormularioPlantilla({
                          ...formulario_plantilla,
                          numero_citas: e.target.value,
                        })
                      }
                      onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') e.preventDefault(); }}
                      placeholder="Ej: 25"
                      className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                    />
                  </div>

                  <div id={IDS_ELEMENTOS_TRATAMIENTOS.SECCION_PLANTILLA_COSTO} className="space-y-2">
                    <InputMoneda
                      label="Costo Total"
                      valorLocal={formulario_plantilla.costo_total}
                      valorUSD={formulario_plantilla.costo_total_usd}
                      onMontoChange={(local, usd) => 
                        setFormularioPlantilla(prev => ({ 
                          ...prev, 
                          costo_total: local,
                          costo_total_usd: usd 
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto_completar_al_100">Finalizar Automáticamente al Completar Pagos</Label>
                    <p className="text-sm text-muted-foreground">
                      Si está activo, los planes se marcarán como completados al llegar al 100% abonado.
                    </p>
                  </div>
                  <Switch
                    id="auto_completar_al_100"
                    checked={!!(formulario_plantilla as any).auto_completar_al_100}
                    onCheckedChange={(checked) =>
                      setFormularioPlantilla({
                        ...formulario_plantilla,
                        auto_completar_al_100: checked,
                      } as any)
                    }
                  />
                </div>

                <div id={IDS_ELEMENTOS_TRATAMIENTOS.SECCION_PLANTILLA_INTERVALO} className="space-y-2">
                  <Label>Intervalo entre Citas</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="intervalo_meses" className="text-xs text-muted-foreground">
                        Meses (máx 101)
                      </Label>
                      <Input
                        id="intervalo_meses"
                        type="number"
                        min="0"
                        max="101"
                        step="1"
                        value={formulario_plantilla.intervalo_meses}
                        onChange={(e) => {
                          let valor = e.target.value;
                          if (valor === '') {
                            setFormularioPlantilla({
                              ...formulario_plantilla,
                              intervalo_meses: '0',
                            });
                          } else {
                            const num = parseInt(valor, 10);
                            if (!isNaN(num) && num >= 0 && num <= 101) {
                              setFormularioPlantilla({
                                ...formulario_plantilla,
                                intervalo_meses: num.toString(),
                              });
                            }
                          }
                        }}
                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') e.preventDefault(); }}
                        placeholder="0"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="intervalo_semanas" className="text-xs text-muted-foreground">
                        Semanas (máx 62)
                      </Label>
                      <Input
                        id="intervalo_semanas"
                        type="number"
                        min="0"
                        max="62"
                        step="1"
                        value={formulario_plantilla.intervalo_semanas}
                        onChange={(e) => {
                          let valor = e.target.value;
                          if (valor === '') {
                            setFormularioPlantilla({
                              ...formulario_plantilla,
                              intervalo_semanas: '0',
                            });
                          } else {
                            const num = parseInt(valor, 10);
                            if (!isNaN(num) && num >= 0 && num <= 62) {
                              setFormularioPlantilla({
                                ...formulario_plantilla,
                                intervalo_semanas: num.toString(),
                              });
                            }
                          }
                        }}
                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') e.preventDefault(); }}
                        placeholder="0"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="intervalo_dias" className="text-xs text-muted-foreground">
                        Días (máx 91)
                      </Label>
                      <Input
                        id="intervalo_dias"
                        type="number"
                        min="0"
                        max="91"
                        step="1"
                        value={formulario_plantilla.intervalo_dias}
                        onChange={(e) => {
                          let valor = e.target.value;
                          if (valor === '') {
                            setFormularioPlantilla({
                              ...formulario_plantilla,
                              intervalo_dias: '0',
                            });
                          } else {
                            const num = parseInt(valor, 10);
                            if (!isNaN(num) && num >= 0 && num <= 91) {
                              setFormularioPlantilla({
                                ...formulario_plantilla,
                                intervalo_dias: num.toString(),
                              });
                            }
                          }
                        }}
                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') e.preventDefault(); }}
                        placeholder="0"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Las citas se programarán automáticamente con este intervalo
                  </p>
                </div>

                <div id={IDS_ELEMENTOS_TRATAMIENTOS.SECCION_PLANTILLA_DURACION} className="space-y-2">
                  <Label>Duración Aproximada de Cada Cita</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="horas_aproximadas_citas" className="text-xs text-muted-foreground">
                        Horas
                      </Label>
                      <Input
                        id="horas_aproximadas_citas"
                        type="number"
                        min="0"
                        max="23"
                        value={formulario_plantilla.horas_aproximadas_citas}
                        onChange={(e) => {
                          const valor = e.target.value;
                          if (valor === '') {
                            setFormularioPlantilla({
                              ...formulario_plantilla,
                              horas_aproximadas_citas: '0',
                            });
                            return;
                          }
                          const num = parseInt(valor, 10);
                          if (Number.isNaN(num)) return;
                          const clamped = Math.min(23, Math.max(0, num));
                          setFormularioPlantilla({
                            ...formulario_plantilla,
                            horas_aproximadas_citas: clamped.toString(),
                          });
                        }}
                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') e.preventDefault(); }}
                        placeholder="0"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minutos_aproximados_citas" className="text-xs text-muted-foreground">
                        Minutos
                      </Label>
                      <Input
                        id="minutos_aproximados_citas"
                        type="number"
                        min="0"
                        max="59"
                        value={formulario_plantilla.minutos_aproximados_citas}
                        onChange={(e) => {
                          const valor = e.target.value;
                          if (valor === '') {
                            setFormularioPlantilla({
                              ...formulario_plantilla,
                              minutos_aproximados_citas: '0',
                            });
                            return;
                          }
                          const num = parseInt(valor, 10);
                          if (Number.isNaN(num)) return;
                          const clamped = Math.min(59, Math.max(0, num));
                          setFormularioPlantilla({
                            ...formulario_plantilla,
                            minutos_aproximados_citas: clamped.toString(),
                          });
                        }}
                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') e.preventDefault(); }}
                        placeholder="30"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todas las citas del plan tendrán esta duración estimada
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="recursos" className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Consumibles y activos fijos que se asignarán a cada cita del tratamiento.
                    Estos recursos se configuran aquí en la plantilla y se replican en todas las citas que se crearán al asignar el tratamiento.
                  </p>
                </div>

                <div id={IDS_ELEMENTOS_TRATAMIENTOS.SECCION_PLANTILLA_RECURSOS_WIZARD}>
                  <WizardConsumibles
                    inventarios={inventarios}
                    productos_por_inventario={productos_por_inventario}
                    cargarProductos={cargarProductosInventario}
                    materialesSeleccionados={consumibles_plantilla}
                    onAgregarMaterial={(material) => setConsumiblesPlantilla(prev => [...prev, material])}
                    onEliminarMaterial={(index) => setConsumiblesPlantilla(prev => prev.filter((_, i) => i !== index))}
                    onActualizarCantidad={(index, cantidad) => setConsumiblesPlantilla(prev => prev.map((m, i) => i === index ? { ...m, cantidad } : m))}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>


          <DialogFooter>
            <Button
              id={IDS_ELEMENTOS_TRATAMIENTOS.BTN_PLANTILLA_CANCELAR}
              variant="outline"
              onClick={() => handleOpenChangePlantilla(false)}
              disabled={guardando}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              id={IDS_ELEMENTOS_TRATAMIENTOS.BTN_PLANTILLA_GUARDAR}
              onClick={manejarGuardarPlantilla}
              disabled={guardando || (modo_edicion && !formularioPlantillaCambio())}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogo_detalle_plan_abierto}
        onOpenChange={setDialogoDetallePlanAbierto}
      >
        <DialogContent id={IDS_ELEMENTOS_TRATAMIENTOS.DIALOG_DETALLE_PLAN} className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestión del Plan de Tratamiento</DialogTitle>
            <DialogDescription>
              Administra las citas y pagos del plan
            </DialogDescription>
          </DialogHeader>

          {plan_seleccionado && (
            <div className="space-y-6">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {plan_seleccionado.paciente.nombre}{" "}
                  {plan_seleccionado.paciente.apellidos}
                </h3>
                <p className="text-muted-foreground">
                  {plan_seleccionado.tratamiento.nombre}
                </p>

                {(() => {
                  const auto = obtenerAutoCompletarPlan(plan_seleccionado);
                  return (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={auto.habilitado
                          ? 'bg-green-500/10 text-green-600 border-green-500/30'
                          : 'bg-red-500/10 text-red-600 border-red-500/30'
                        }
                      >
                        Finalizar al Completar Pagos: {auto.habilitado ? 'Sí' : 'No'}
                      </Badge>
                      {auto.fuente === 'default' && (
                        <span className="text-xs text-muted-foreground">(por defecto)</span>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">
                      Costo Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {formatearMonto(plan_seleccionado.costo_total, plan_seleccionado.costo_total_usd)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">
                      Abonado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-500">
                      {formatearMonto(plan_seleccionado.total_abonado, plan_seleccionado.total_abonado_usd)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">
                      Pendiente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-500">
                      {(() => {
                        const m = obtenerMontosPlan(plan_seleccionado);
                        return formatearMontoActual(m.pendiente);
                      })()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="citas" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger id={IDS_ELEMENTOS_TRATAMIENTOS.TAB_DETALLE_PLAN_CITAS} value="citas">
                    Citas ({plan_seleccionado.citas.length})
                  </TabsTrigger>
                  <TabsTrigger id={IDS_ELEMENTOS_TRATAMIENTOS.TAB_DETALLE_PLAN_PAGOS} value="pagos">
                    Pagos ({(plan_seleccionado.pagos?.length || 0) + (plan_seleccionado.egresos?.length || 0)})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="citas" className="space-y-3 mt-4">
                  {plan_seleccionado.citas.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-muted-foreground">
                        No hay citas programadas
                      </p>
                      {!planEsSoloLectura(plan_seleccionado) && (
                        <div
                          id={IDS_ELEMENTOS_TRATAMIENTOS.BTN_DETALLE_PLAN_AGREGAR_CITA}
                          className="p-6 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all duration-200 cursor-pointer mx-auto max-w-sm"
                          onClick={abrirDialogoNuevaCita}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Plus className="h-10 w-10 text-primary" />
                            <p className="font-medium text-primary">Agregar Primera Cita</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {plan_seleccionado.citas.map((cita) => {
                        const es_solo_lectura = planEsSoloLectura(plan_seleccionado);
                        const es_confirmada = !!cita.materiales_confirmados;
                        const finalizada = citaHaFinalizado(cita);
                        const ocurriendo = citaEstaOcurriendo(cita);
                        const debe_cerrarse = finalizada && !es_confirmada;

                          const permite_eye = !modo_edicion_historica_activo && es_confirmada;
                          const permite_confirmar = debe_cerrarse;
                          const permite_editar = modo_edicion_historica_activo
                            ? true
                            : (!finalizada && !es_confirmada);
                        const permite_eliminar = modo_edicion_historica_activo
                          ? true
                          : (!finalizada && !ocurriendo && !es_confirmada);

                        return (
                          <div
                            key={cita.id}
                            className={`p-4 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-all duration-200 ${cita.materiales_confirmados ? 'opacity-60 grayscale-[0.3]' : ''
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <p className="font-medium text-foreground">
                                    {formatearFechaHora(cita.fecha)}
                                  </p>
                                  <Badge className={`${obtenerColorEstado(cita.estado_pago)} text-white`}>
                                    {obtenerEtiquetaEstado(cita.estado_pago)}
                                  </Badge>
                                  {cita.materiales_confirmados && (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                      <Check className="h-3 w-3 mr-1" />
                                      Materiales confirmados
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground ml-7">
                                  {cita.descripcion}
                                </p>
                                <div className="flex items-center gap-3 ml-7 mt-1">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Duración: {formatearDuracion(cita.horas_aproximadas, cita.minutos_aproximados)}
                                  </p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Coins className="h-3 w-3" />
                                    Monto:{' '}
                                    {usarUSD
                                      ? <>USD {Number((cita as any).monto_esperado_usd || 0).toFixed(2)}</>
                                      : formatearMonedaJSX(cita.monto_esperado || 0)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {!es_solo_lectura && (
                                  <>
                                    {permite_eye && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => abrirDialogoVerCita(cita, ocurriendo ? 'ocurriendo' : 'finalizada')}
                                        className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                                        title="Ver detalles"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    )}

                                    {permite_confirmar && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => abrirDialogoConfirmarMaterialesCita(cita)}
                                        className="hover:bg-green-500/20 hover:text-green-600 hover:scale-110 transition-all duration-200 ring-2 ring-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                        title="Confirmar Materiales"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                      </Button>
                                    )}

                                    {permite_editar && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => abrirDialogoEditarCita(cita)}
                                        className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                                        title="Editar"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}

                                    {permite_eliminar && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => abrirDialogoConfirmarEliminarCita(cita)}
                                        className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {!planEsSoloLectura(plan_seleccionado) && (
                        <div
                          id={IDS_ELEMENTOS_TRATAMIENTOS.BTN_DETALLE_PLAN_AGREGAR_CITA}
                          className="p-4 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all duration-200 cursor-pointer"
                          onClick={abrirDialogoNuevaCita}
                        >
                          <div className="flex items-center justify-center gap-3">
                            <Plus className="h-8 w-8 text-primary" />
                            <p className="font-medium text-primary text-lg">Agregar Cita</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pagos" className="space-y-3 mt-4">
                  {!planEsSoloLectura(plan_seleccionado) && (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        id={IDS_ELEMENTOS_TRATAMIENTOS.BTN_DETALLE_PLAN_REGISTRAR_PAGO}
                        onClick={abrirDialogoPagoAdelantado}
                        className="bg-green-600 hover:bg-green-700 text-white hover:scale-105 transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Pago
                      </Button>

                      <Button
                        id={IDS_ELEMENTOS_TRATAMIENTOS.BTN_DETALLE_PLAN_REGISTRAR_EGRESO}
                        onClick={abrirDialogoEgresoTratamiento}
                        className="bg-red-600 hover:bg-red-700 text-white hover:scale-105 transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Egreso
                      </Button>
                    </div>
                  )}

                  {((plan_seleccionado.pagos?.length || 0) + (plan_seleccionado.egresos?.length || 0)) === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay movimientos registrados
                    </p>
                  ) : (
                    (() => {
                      const pagos = (plan_seleccionado.pagos || []).map((p) => ({
                        id: `pago-${p.id}`,
                        tipo: 'pago' as const,
                        fecha: p.fecha,
                        monto: p.monto,
                        monto_usd: p.monto_usd,
                        concepto: p.concepto,
                      }));
                      const egresos = (plan_seleccionado.egresos || []).map((e) => ({
                        id: `egreso-${e.id}`,
                        tipo: 'egreso' as const,
                        fecha: e.fecha,
                        monto: e.monto,
                        monto_usd: e.monto_usd,
                        concepto: e.concepto,
                      }));
                      const movimientos = [...pagos, ...egresos].sort(
                        (a, b) => new Date(b.fecha as any).getTime() - new Date(a.fecha as any).getTime()
                      );

                      return movimientos.map((mov) => (
                        <div
                          key={mov.id}
                          className="p-3 rounded-lg bg-secondary/30 border border-border"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-semibold ${mov.tipo === 'pago' ? 'text-green-500' : 'text-red-500'}`}>
                                {mov.tipo === 'pago'
                                  ? formatearMonto(mov.monto, mov.monto_usd)
                                  : <>-{formatearMonto(mov.monto, mov.monto_usd)}</>
                                }
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatearFecha(mov.fecha)}
                              </p>
                              {mov.concepto && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {mov.concepto}
                                </p>
                              )}
                            </div>
                            <Coins className={`h-5 w-5 ${mov.tipo === 'pago' ? 'text-green-500' : 'text-red-500'}`} />
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DialogoAsignarTratamiento
        abierto={dialogo_asignar_abierto}
        onCerrar={() => setDialogoAsignarAbierto(false)}
        tratamientos={tratamientos}
        pacientes={pacientes}
        tratamientoPreseleccionado={tratamiento_seleccionado}
        onAsignar={manejarAsignarTratamiento}
      />

      <Dialog open={dialogo_pago_adelantado_abierto} onOpenChange={setDialogoPagoAdelantadoAbierto}>
        <DialogContent id={IDS_ELEMENTOS_TRATAMIENTOS.DIALOG_PAGO_TRATAMIENTO} className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear pago adelantado</DialogTitle>
            <DialogDescription>
              Registra un ingreso asociado al plan de tratamiento.
            </DialogDescription>
          </DialogHeader>

          {plan_seleccionado && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Glosa</Label>
                <Input
                  value={formulario_pago_adelantado.concepto}
                  onChange={(e) => setFormularioPagoAdelantado(prev => ({ ...prev, concepto: e.target.value }))}
                  placeholder="Ej: Abono"
                />
              </div>

              <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                <p className="text-sm text-muted-foreground">Pendiente actual</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatearMontoActual(obtenerMontosPlan(plan_seleccionado).pendiente)}
                </p>
              </div>

              <InputMoneda
                label="Monto"
                valorLocal={formulario_pago_adelantado.monto}
                valorUSD={formulario_pago_adelantado.monto_usd}
                onMontoChange={(local, usd) => {
                  setFormularioPagoAdelantado(prev => {
                    const { pendiente } = plan_seleccionado ? obtenerMontosPlan(plan_seleccionado) : { pendiente: 0 };
                    const monto_local = Number(parseFloat(local || '0'));
                    const monto_usd = Number(parseFloat(usd || '0'));
                    const monto_actual = usarUSD ? monto_usd : monto_local;
                    const puede_marcar = Number(pendiente) > 0 && monto_actual >= Number(pendiente);
                    return {
                      ...prev,
                      monto: local,
                      monto_usd: usd,
                      marcar_citas_pagadas: puede_marcar ? prev.marcar_citas_pagadas : false,
                    };
                  });
                }}
              />

              {(() => {
                const { pendiente } = obtenerMontosPlan(plan_seleccionado);
                const monto_local = Number(parseFloat(formulario_pago_adelantado.monto || '0'));
                const monto_usd = Number(parseFloat(formulario_pago_adelantado.monto_usd || '0'));
                const monto_actual = usarUSD ? monto_usd : monto_local;
                const puede_marcar = Number(pendiente) > 0 && monto_actual >= Number(pendiente);

                if (!puede_marcar) return null;

                return (
                  <div className="p-3 rounded-lg border border-border bg-secondary/20 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm">Marcar todas las citas como pagadas</Label>
                        <p className="text-xs text-muted-foreground">
                          Se marcarán como pagadas para registro, pero aún deben confirmarse.
                        </p>
                      </div>
                      <Switch
                        checked={!!formulario_pago_adelantado.marcar_citas_pagadas}
                        onCheckedChange={(v) => {
                          setFormularioPagoAdelantado(prev => ({ ...prev, marcar_citas_pagadas: v }));
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoPagoAdelantadoAbierto(false)}
              disabled={guardando_pago_adelantado}
            >
              Cancelar
            </Button>
            <Button
              onClick={manejarRegistrarPagoAdelantado}
              disabled={guardando_pago_adelantado || !plan_seleccionado || (plan_seleccionado ? planEsSoloLectura(plan_seleccionado) : true) || (() => {
                const monto_local = Number(parseFloat(formulario_pago_adelantado.monto || '0'));
                const monto_usd = Number(parseFloat(formulario_pago_adelantado.monto_usd || '0'));
                const monto_actual = usarUSD ? monto_usd : monto_local;
                return !monto_actual || isNaN(monto_actual) || monto_actual <= 0;
              })()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {guardando_pago_adelantado && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_egreso_tratamiento_abierto} onOpenChange={setDialogoEgresoTratamientoAbierto}>
        <DialogContent id={IDS_ELEMENTOS_TRATAMIENTOS.DIALOG_EGRESO_TRATAMIENTO} className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar egreso</DialogTitle>
            <DialogDescription>
              Registra un egreso asociado al plan de tratamiento.
            </DialogDescription>
          </DialogHeader>

          {plan_seleccionado && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Glosa</Label>
                <Input
                  value={formulario_egreso_tratamiento.concepto}
                  onChange={(e) => setFormularioEgresoTratamiento(prev => ({ ...prev, concepto: e.target.value }))}
                  placeholder="Ej: Devolución"
                />
              </div>

              <InputMoneda
                label="Monto"
                valorLocal={formulario_egreso_tratamiento.monto}
                valorUSD={formulario_egreso_tratamiento.monto_usd}
                onMontoChange={(local, usd) => {
                  setFormularioEgresoTratamiento(prev => ({
                    ...prev,
                    monto: local,
                    monto_usd: usd,
                  }));
                }}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogoEgresoTratamientoAbierto(false)} disabled={guardando}>
                  Cancelar
                </Button>
                <Button
                  onClick={manejarRegistrarEgresoTratamiento}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Registrar Egreso'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DialogoGestionCita
        abierto={dialogo_cita_abierto}
        onCerrar={() => {
          setSoloVisualizarCita(false);
          setMensajeVisualizacionCita(null);
          setRecursosSoloLecturaCita(false);
          handleOpenChangeCita(false);
        }}
        modoEdicion={modo_edicion_cita}
        soloVisualizar={solo_visualizar_cita}
        mensajeVisualizacion={mensaje_visualizacion_cita}
        recursosSoloLectura={recursos_solo_lectura_cita}
        planTratamiento={plan_seleccionado}
        tienePlanTratamiento={!!plan_seleccionado?.id}
        formulario={formulario_cita}
        setFormulario={setFormularioCita}
        pacientes={pacientes}
        inventarios={inventarios}
        productosPorInventario={productos_por_inventario}
        cargarInventarios={cargarInventarios}
        cargarProductosInventario={cargarProductosInventario}
        consumiblesSeleccionados={consumibles_seleccionados_cita}
        setConsumiblesSeleccionados={setConsumiblesSeleccionadosCita}
        guardando={guardando}
        hayCambios={hay_cambios_cita}
        manejarGuardar={manejarGuardarCita}
        opcionesEstadosPago={estados_pago}
        pacienteDeshabilitado={true}
        accionPagoUI={
          requiere_accion_pago_edicion ? renderSelectorAccionPago(accion_pago_edicion, setAccionPagoEdicion, 'edicion-cita') : null
        }
      />

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              {cita_a_eliminar
                ? `¿Estás seguro de que deseas eliminar esta cita del plan?`
                : plan_a_eliminar
                  ? `¿Estás seguro de que deseas eliminar este plan de tratamiento asignado?`
                  : tratamiento_seleccionado
                    ? `¿Estás seguro de que deseas eliminar esta plantilla de tratamiento?`
                    : `¿Estás seguro de que deseas eliminar este elemento?`
              }
            </DialogDescription>
          </DialogHeader>

          {cita_a_eliminar && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
              <p className="font-semibold text-foreground">{cita_a_eliminar.descripcion}</p>
              <p className="text-sm text-muted-foreground">
                {formatearFechaHora(cita_a_eliminar.fecha)}
              </p>
              <Badge className={`${obtenerColorEstado(cita_a_eliminar.estado_pago)} text-white`}>
                {obtenerEtiquetaEstado(cita_a_eliminar.estado_pago)}
              </Badge>
            </div>
          )}

          {plan_a_eliminar && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
              <p className="font-semibold text-foreground">{plan_a_eliminar.tratamiento.nombre}</p>
              <p className="text-sm text-muted-foreground">
                Paciente: {plan_a_eliminar.paciente.nombre} {plan_a_eliminar.paciente.apellidos}
              </p>
              <p className="text-sm text-muted-foreground">
                {plan_a_eliminar.citas.length} citas - {formatearMonto(plan_a_eliminar.costo_total, plan_a_eliminar.costo_total_usd)}
              </p>

              <div className="pt-2 space-y-2">
                <Label className="text-sm">¿Qué deseas hacer con las citas asociadas?</Label>
                <RadioGroup
                  value={accion_citas_eliminar_plan}
                  onValueChange={(v) => setAccionCitasEliminarPlan(v as 'borrar' | 'mantener')}
                  className="gap-3"
                >
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="borrar" id="eliminar-plan-borrar-citas" className="mt-1" />
                    <Label htmlFor="eliminar-plan-borrar-citas" className="text-sm font-normal">
                      Borrar citas asociadas
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="mantener" id="eliminar-plan-mantener-citas" className="mt-1" />
                    <Label htmlFor="eliminar-plan-mantener-citas" className="text-sm font-normal">
                      Mantener citas
                    </Label>
                  </div>
                </RadioGroup>

                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Los pagos/finanzas no se eliminan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tratamiento_seleccionado && !cita_a_eliminar && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
              <p className="font-semibold text-foreground">{tratamiento_seleccionado.nombre}</p>
              <p className="text-sm text-muted-foreground">
                {tratamiento_seleccionado.numero_citas} citas - {usarUSD
                  ? formatearUSD(obtenerUSDDesdeLocal(tratamiento_seleccionado.costo_total))
                  : formatearMonedaJSX(tratamiento_seleccionado.costo_total)
                }
              </p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Esta acción no se puede deshacer.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoConfirmarEliminarAbierto(false);
                setCitaAEliminar(null);
                setPlanAEliminar(null);
                setTratamientoSeleccionado(null);
                setAccionCitasEliminarPlan('borrar');
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (cita_a_eliminar) {
                  confirmarEliminarCita();
                } else if (plan_a_eliminar) {
                  confirmarEliminarPlan();
                } else if (tratamiento_seleccionado) {
                  confirmarEliminarPlantilla();
                }
              }}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      { }
      <Dialog open={dialogo_editar_costo_abierto} onOpenChange={handleOpenChangeCosto}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tratamiento</DialogTitle>
            <DialogDescription>
              Modifica el costo total del plan de tratamiento
            </DialogDescription>
          </DialogHeader>


          {plan_seleccionado && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
                <p className="font-semibold text-foreground">{plan_seleccionado.tratamiento.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  Paciente: {plan_seleccionado.paciente.nombre} {plan_seleccionado.paciente.apellidos}
                </p>
                <p className="text-sm text-muted-foreground">
                  Costo actual: {formatearMonto(plan_seleccionado.costo_total, plan_seleccionado.costo_total_usd)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-600 dark:text-blue-400">Información de la Plantilla</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Citas previstas:</span>
                    <span className="font-medium">{plan_seleccionado.tratamiento.numero_citas}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Duración por cita:</span>
                    <span className="font-medium">
                      {formatearDuracion(
                        plan_seleccionado.tratamiento.horas_aproximadas_citas || 0,
                        plan_seleccionado.tratamiento.minutos_aproximados_citas || 30
                      )}
                    </span>
                  </div>
                  {((plan_seleccionado.tratamiento.intervalo_dias || 0) > 0 ||
                    (plan_seleccionado.tratamiento.intervalo_semanas || 0) > 0 ||
                    (plan_seleccionado.tratamiento.intervalo_meses || 0) > 0) && (
                      <div className="flex items-center gap-2 col-span-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Intervalo entre citas:</span>
                        <span className="font-medium">
                          {(plan_seleccionado.tratamiento.intervalo_meses || 0) > 0 &&
                            `${plan_seleccionado.tratamiento.intervalo_meses} ${plan_seleccionado.tratamiento.intervalo_meses === 1 ? 'mes' : 'meses'} `}
                          {(plan_seleccionado.tratamiento.intervalo_semanas || 0) > 0 &&
                            `${plan_seleccionado.tratamiento.intervalo_semanas} ${plan_seleccionado.tratamiento.intervalo_semanas === 1 ? 'semana' : 'semanas'} `}
                          {(plan_seleccionado.tratamiento.intervalo_dias || 0) > 0 &&
                            `${plan_seleccionado.tratamiento.intervalo_dias || 0} ${(plan_seleccionado.tratamiento.intervalo_dias || 0) === 1 ? 'día' : 'días'}`}
                        </span>
                      </div>
                    )}
                </div>
              </div>

              <div className="space-y-2">
                <InputMoneda
                  label="Nuevo Costo Total"
                  valorLocal={formulario_editar_costo.costo_total}
                  valorUSD={formulario_editar_costo.costo_total_usd}
                  onMontoChange={(local, usd) => 
                    setFormularioEditarCosto(prev => ({ 
                      ...prev, 
                      costo_total: local,
                      costo_total_usd: usd 
                    }))
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChangeCosto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button
              onClick={manejarGuardarCosto}
              disabled={guardando || !formulario_editar_costo.costo_total}
            >
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      { }
      <DialogoConfirmacionCita
        abierto={dialogo_confirmar_materiales_abierto}
        onCerrar={() => handleOpenChangeConfirmacion(false)}
        planTratamiento={plan_seleccionado}
        tienePlanTratamiento={!!plan_seleccionado?.id}
        cargandoMateriales={cargando_materiales}
        consumibles={consumibles_confirmacion}
        setConsumibles={setConsumiblesConfirmacion}
        estadoPago={estado_pago_confirmacion}
        setEstadoPago={setEstadoPagoConfirmacion}
        montoLocal={monto_confirmacion}
        montoUSD={monto_confirmacion_usd}
        onMontoChange={(local, usd) => {
          setMontoConfirmacion(local);
          setMontoConfirmacionUsd(usd);
        }}
        guardando={guardando}
        manejarConfirmar={manejarConfirmarMaterialesCita}
        inventarios={inventarios}
        productosPorInventario={productos_por_inventario}
        cargarProductosInventario={cargarProductosInventario}
        opcionesEstadosPago={estados_pago}
        accionPagoUI={
          requiere_accion_pago_confirmacion ? renderSelectorAccionPago(accion_pago_confirmacion, setAccionPagoConfirmacion, 'confirmacion-cita') : null
        }
      />

      <AlertDialog open={confirmar_eliminar_pago_abierto} onOpenChange={(open) => {
        setConfirmarEliminarPagoAbierto(open);
        if (!open) setContextoEliminarPago(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el pago?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción eliminará definitivamente el registro financiero asociado a la cita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmarEliminarPagoAbierto(false);
                if (contexto_eliminar_pago === 'edicion') {
                  manejarGuardarCita(true, 'eliminar');
                } else if (contexto_eliminar_pago === 'confirmacion') {
                  manejarConfirmarMaterialesCita(true, 'eliminar');
                }
                setContextoEliminarPago(null);
              }}
            >
              Sí, eliminar pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <AlertDialog open={closeConfirmationPropsPlantilla.open} onOpenChange={closeConfirmationPropsPlantilla.onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Hay cambios sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>Si cierras ahora, perderás los cambios realizados en la plantilla. ¿Estás seguro?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmationPropsPlantilla.onCancel}>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={closeConfirmationPropsPlantilla.onConfirm}>Descartar cambios</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={closeConfirmationPropsCita.open} onOpenChange={closeConfirmationPropsCita.onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Hay cambios sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>Si cierras ahora, perderás los cambios realizados en la cita. ¿Estás seguro?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmationPropsCita.onCancel}>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={closeConfirmationPropsCita.onConfirm}>Descartar cambios</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={closeConfirmationPropsConfirmacion.open} onOpenChange={closeConfirmationPropsConfirmacion.onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Hay cambios sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>Si cierras ahora, perderás los cambios de confirmación. ¿Estás seguro?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmationPropsConfirmacion.onCancel}>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={closeConfirmationPropsConfirmacion.onConfirm}>Descartar cambios</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={closeConfirmationPropsCosto.open} onOpenChange={closeConfirmationPropsCosto.onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Hay cambios sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>Si cierras ahora, perderás los cambios en el costo. ¿Estás seguro?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmationPropsCosto.onCancel}>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={closeConfirmationPropsCosto.onConfirm}>Descartar cambios</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
      </div>

      <TutorialModalWrapper tema="Tratamientos" />
    </ProveedorTutorialesPagina>
  );
}