import { useState, useEffect, useMemo, useRef } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { TituloAccionable } from '@/componentes/tutoriales/titulo-accionable';
import { TutorialModalWrapper } from '@/componentes/tutoriales/tutorial-modal-wrapper';
import { Card, CardContent } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Label } from '@/componentes/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/componentes/ui/alert-dialog';
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Loader2, Clock, ChevronLeft, ChevronRight, AlertTriangle, CalendarClock, CheckCircle2, Eye, Coins } from 'lucide-react';
import { agendaApi, pacientesApi, inventarioApi, planesTratamientoApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { Combobox, OpcionCombobox } from '@/componentes/ui/combobox';
import { Badge } from '@/componentes/ui/badge';
import { Switch } from '@/componentes/ui/switch';
import { Calendar as CalendarioUI } from '@/componentes/ui/calendar';
import { useMoneda } from '@/hooks/use-moneda';
import { useClinica } from '@/contextos/clinica-contexto';
import { useAutenticacion } from '@/contextos/autenticacion-contexto';
import DialogoGestionCita from '@/componentes/citas/dialogo-gestion-cita';
import DialogoConfirmacionCita from '@/componentes/citas/dialogo-confirmacion-cita';
import { es } from 'date-fns/locale';
import { cn, obtenerMensajeError, formatearConflictoHorariosDesdeRespuesta } from '@/lib/utilidades';
import {
  Cita,
  HoraLibre,
  ElementoAgenda,
  Paciente,
  Inventario,
  Producto,
  MaterialCita,
  TipoProducto,
   PlanTratamiento,
} from '@/tipos';

import { useSafeClose } from '../hooks/use-safe-close';
import { ProveedorTutorialesPagina } from '@/contextos/tutoriales';
import { TUTORIALES_AGENDA, IDS_ELEMENTOS_AGENDA } from '@/tutoriales/agenda';

type DiaSemana = 'domingo' | 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado';
type IntervaloHorario = { inicio: string; fin: string };
type HorariosLaborales = Record<DiaSemana, IntervaloHorario[]>;

type IntervaloOcupado = { inicio: string; fin: string };
type RespuestaOcupacionMes = { ano: number; mes: number; dias: Record<string, IntervaloOcupado[]> };

const DIAS_SEMANA: DiaSemana[] = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const esHoraHHMM = (valor: string): boolean => /^\d{2}:\d{2}$/.test(valor);

const horaAMinutos = (hora: string): number => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

const pad2 = (valor: number) => String(valor).padStart(2, '0');

const formatearHoraHHMM = (fecha: Date): string => `${pad2(fecha.getHours())}:${pad2(fecha.getMinutes())}`;

const ordenarIntervalos = (rangos: IntervaloHorario[]): IntervaloHorario[] =>
  [...rangos].sort((a, b) => horaAMinutos(a.inicio) - horaAMinutos(b.inicio));

const crearHorariosDefault = (): HorariosLaborales => ({
  domingo: [
    { inicio: '08:00', fin: '12:00' },
    { inicio: '14:00', fin: '18:00' },
  ],
  lunes: [
    { inicio: '08:00', fin: '12:00' },
    { inicio: '14:00', fin: '18:00' },
  ],
  martes: [
    { inicio: '08:00', fin: '12:00' },
    { inicio: '14:00', fin: '18:00' },
  ],
  miércoles: [
    { inicio: '08:00', fin: '12:00' },
    { inicio: '14:00', fin: '18:00' },
  ],
  jueves: [
    { inicio: '08:00', fin: '12:00' },
    { inicio: '14:00', fin: '18:00' },
  ],
  viernes: [
    { inicio: '08:00', fin: '12:00' },
    { inicio: '14:00', fin: '18:00' },
  ],
  sábado: [
    { inicio: '08:00', fin: '12:00' },
    { inicio: '14:00', fin: '18:00' },
  ],
});

const normalizarHorarios = (horarios: HorariosLaborales): HorariosLaborales => {
  const normalized = { ...crearHorariosDefault(), ...horarios } as HorariosLaborales;
  for (const dia of Object.keys(normalized) as DiaSemana[]) {
    const rangos = (normalized[dia] || [])
      .map(r => ({ inicio: (r?.inicio || '').trim(), fin: (r?.fin || '').trim() }))
      .filter(r => esHoraHHMM(r.inicio) && esHoraHHMM(r.fin))
      .filter(r => horaAMinutos(r.fin) > horaAMinutos(r.inicio));
    normalized[dia] = ordenarIntervalos(rangos);
  }
  return normalized;
};

const parseHorariosLaborales = (raw: unknown): HorariosLaborales => {
  const fallback = crearHorariosDefault();
  if (!raw) return fallback;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;

    const parsedObj = parsed as Record<string, unknown>;
    const base: Partial<HorariosLaborales> = {};

    for (const dia of DIAS_SEMANA) {
      const valorDia = parsedObj[dia];
      if (!Array.isArray(valorDia)) {
        base[dia] = [];
        continue;
      }

      const rangos = valorDia
        .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x))
        .map(r => ({
          inicio: String(r.inicio ?? '').trim(),
          fin: String(r.fin ?? '').trim(),
        }))
        .filter(r => esHoraHHMM(r.inicio) && esHoraHHMM(r.fin));

      base[dia] = rangos;
    }

    return normalizarHorarios(base as HorariosLaborales);
  } catch {
    return fallback;
  }
};

const obtenerDiaSemana = (fecha: Date): DiaSemana => DIAS_SEMANA[new Date(fecha).getDay()] ?? 'domingo';

const claveDia = (date: Date) => {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const esMismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const fechaConHora = (dia: Date, hhmm: string): Date => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(dia);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

const estaDentroHorarioLaboral = (fecha: Date, horarios: HorariosLaborales): boolean => {
  const diaSemana = obtenerDiaSemana(fecha);
  const rangos = ordenarIntervalos(horarios[diaSemana] || []);
  if (rangos.length === 0) return false;
  const minutos = new Date(fecha).getHours() * 60 + new Date(fecha).getMinutes();
  return rangos.some(r => minutos >= horaAMinutos(r.inicio) && minutos < horaAMinutos(r.fin));
};

const descripcionEspacioLibre = (duracionMinutos: number): string => {
  const dur = Math.max(0, Math.floor(duracionMinutos));
  const h = Math.floor(dur / 60);
  const m = dur % 60;
  return `Espacio libre - ${h}h ${m}m`;
};

const recortarHorasLibresPorHorarios = (horas: HoraLibre[], dia: Date, rangos: IntervaloHorario[]): HoraLibre[] => {
  if (rangos.length === 0) return [];
  const rangosOrdenados = ordenarIntervalos(rangos);
  const segmentos: HoraLibre[] = [];

  for (const h of horas || []) {
    const inicioLibre = new Date(h.fecha);
    const finLibre = new Date(inicioLibre.getTime() + Number(h.duracion_minutos || 0) * 60_000);
    if (!(finLibre.getTime() > inicioLibre.getTime())) continue;

    for (const r of rangosOrdenados) {
      if (!esHoraHHMM(r.inicio) || !esHoraHHMM(r.fin)) continue;
      const inicioLaboral = fechaConHora(dia, r.inicio);
      const finLaboral = fechaConHora(dia, r.fin);
      if (!(finLaboral.getTime() > inicioLaboral.getTime())) continue;

      const inicio = new Date(Math.max(inicioLibre.getTime(), inicioLaboral.getTime()));
      const fin = new Date(Math.min(finLibre.getTime(), finLaboral.getTime()));
      const duracion = Math.floor((fin.getTime() - inicio.getTime()) / 60_000);
      if (duracion <= 0) continue;

      const horasAprox = Math.floor(duracion / 60);
      const minutosAprox = duracion % 60;
      segmentos.push({
        fecha: inicio,
        duracion_minutos: duracion,
        horas_aproximadas: horasAprox,
        minutos_aproximados: minutosAprox,
        descripcion: descripcionEspacioLibre(duracion),
      });
    }
  }

  return segmentos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
};

export default function Agenda() {
  type FormularioAgenda = {
    paciente_id: string;
    fecha: Date | undefined;
    descripcion: string;
    estado_pago: string;
    monto_esperado: string;
    monto_esperado_usd: string;
    horas_aproximadas: string;
    minutos_aproximados: string;
  };

  const clampEnteroEnRango = (valor: string, min: number, max: number, valorVacio: string = '0'): string => {
    if (valor === '') return valorVacio;
    const n = parseInt(valor, 10);
    if (Number.isNaN(n)) return valorVacio;
    return String(Math.min(max, Math.max(min, n)));
  };

  const clampDuracionFormulario = (f: FormularioAgenda): FormularioAgenda => ({
    ...f,
    horas_aproximadas: clampEnteroEnRango(f.horas_aproximadas, 0, 23, '0'),
    minutos_aproximados: clampEnteroEnRango(f.minutos_aproximados, 0, 59, '0'),
  });

  const { config_clinica } = useClinica();
  const { usuario } = useAutenticacion();
  const modo_edicion_historica_activo = !!usuario?.modo_edicion_historica;
  const horarios_laborales = useMemo(
    () => parseHorariosLaborales(config_clinica?.horarios_laborales),
    [config_clinica?.horarios_laborales]
  );
  const cambio_dolar = config_clinica.cambio_dolar || 1;
  const { formatearMonedaJSX } = useMoneda();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citas_dia, setCitasDia] = useState<Cita[]>([]);
  const [cargando_citas_dia, setCargandoCitasDia] = useState(false);
  const [error_citas_dia, setErrorCitasDia] = useState<string | null>(null);
  const [horas_libres, setHorasLibres] = useState<HoraLibre[]>([]);
  const [mostrar_horas_libres, setMostrarHorasLibres] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [mes_actual, setMesActual] = useState(new Date().getMonth() + 1);
  const [ano_actual, setAnoActual] = useState(new Date().getFullYear());
  const [cargando_mes, setCargandoMes] = useState(false);
  const [ocupacion_mes, setOcupacionMes] = useState<Record<string, IntervaloOcupado[]>>({});

  const ocupacion_mes_desde_citas = useMemo(() => {
    const dias: Record<string, IntervaloOcupado[]> = {};

    const estadoOcupaTiempo = (estado_pago: string | null | undefined): boolean => {
      const estado = String(estado_pago ?? '').trim().toLowerCase();
      if (!estado) return true;
      return estado !== 'cancelado';
    };

    for (const cita of citas || []) {
      if (!estadoOcupaTiempo(cita.estado_pago)) continue;

      const inicio = new Date(cita.fecha);
      if (Number.isNaN(inicio.getTime())) continue;

      const horas = Number(cita.horas_aproximadas || 0);
      const minutos = Number(cita.minutos_aproximados || 0);
      const duracionMin = Math.max(1, (Number.isFinite(horas) ? horas : 0) * 60 + (Number.isFinite(minutos) ? minutos : 0));

      const fin = new Date(inicio.getTime() + duracionMin * 60_000);

      const diaCursor = new Date(inicio);
      diaCursor.setHours(0, 0, 0, 0);

      while (diaCursor.getTime() <= fin.getTime()) {
        const inicioDia = new Date(diaCursor);
        const finDia = new Date(diaCursor);
        finDia.setHours(23, 59, 59, 999);

        const iniClip = new Date(Math.max(inicio.getTime(), inicioDia.getTime()));
        const finClip = new Date(Math.min(fin.getTime(), finDia.getTime()));

        if (finClip.getTime() > iniClip.getTime()) {
          const key = claveDia(inicioDia);
          if (!dias[key]) dias[key] = [];
          dias[key].push({ inicio: formatearHoraHHMM(iniClip), fin: formatearHoraHHMM(finClip) });
        }

        diaCursor.setDate(diaCursor.getDate() + 1);
      }
    }

    for (const key of Object.keys(dias)) {
      const intervalos = (dias[key] || [])
        .filter(i => esHoraHHMM(i.inicio) && esHoraHHMM(i.fin))
        .map(i => ({ inicioMin: horaAMinutos(i.inicio), finMin: horaAMinutos(i.fin) }))
        .filter(i => i.finMin > i.inicioMin)
        .sort((a, b) => a.inicioMin - b.inicioMin);

      const merged: Array<{ inicioMin: number; finMin: number }> = [];
      for (const it of intervalos) {
        const last = merged[merged.length - 1];
        if (!last || it.inicioMin > last.finMin) {
          merged.push({ ...it });
        } else {
          last.finMin = Math.max(last.finMin, it.finMin);
        }
      }

      dias[key] = merged.map(m => ({
        inicio: `${pad2(Math.floor(m.inicioMin / 60))}:${pad2(m.inicioMin % 60)}`,
        fin: `${pad2(Math.floor(m.finMin / 60))}:${pad2(m.finMin % 60)}`,
      }));
    }

    return dias;
  }, [citas]);
  const ultima_peticion_mes = useRef(0);
  const [fecha_seleccionada, setFechaSeleccionada] = useState<Date>(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hoy;
  });
  const [dialogo_dia_abierto, setDialogoDiaAbierto] = useState(false);
  const ultima_peticion_citas_dia = useRef(0);
  const [cargando_inicial, setCargandoInicial] = useState(true);
  const [dialogo_abierto, setDialogoAbierto] = useState(false);
  const [solo_visualizar_gestion, setSoloVisualizarGestion] = useState(false);
  const [mensaje_visualizacion_gestion, setMensajeVisualizacionGestion] = useState<string | null>(null);
  const [recursos_solo_lectura_gestion, setRecursosSoloLecturaGestion] = useState(false);
  const [dialogo_confirmar_materiales_abierto, setDialogoConfirmarMaterialesAbierto] = useState(false);
  const [modo_edicion, setModoEdicion] = useState(false);
  const [cita_seleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [bloquear_selector_fecha_gestion, setBloquearSelectorFechaGestion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [cita_a_eliminar, setCitaAEliminar] = useState<number | null>(null);
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [productos_por_inventario, setProductosPorInventario] = useState<Record<number, Producto[]>>({});
  const [materiales_cita, setMaterialesCita] = useState<MaterialCita[]>([]);
  const [estado_pago_confirmacion, setEstadoPagoConfirmacion] = useState<string>('pendiente');
  const [monto_confirmacion, setMontoConfirmacion] = useState<string>('');
  const [monto_confirmacion_usd, setMontoConfirmacionUsd] = useState<string>('');
  const [cargando_materiales, setCargandoMateriales] = useState(false);
  const [consumibles_seleccionados, setConsumiblesSeleccionados] = useState<Array<{
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
    material_cita_id?: number;
  }>>([]);
  const [consumibles_iniciales, setConsumiblesIniciales] = useState<typeof consumibles_seleccionados>([]);
  const [consumibles_confirmacion, setConsumiblesConfirmacion] = useState<typeof consumibles_seleccionados>([]);
  const [estado_pago_confirmacion_inicial, setEstadoPagoConfirmacionInicial] = useState<string>('pendiente');
  const [monto_confirmacion_inicial, setMontoConfirmacionInicial] = useState<string>('');
  const [monto_confirmacion_usd_inicial, setMontoConfirmacionUsdInicial] = useState<string>('');
  const [consumibles_confirmacion_inicial, setConsumiblesConfirmacionInicial] = useState<typeof consumibles_seleccionados>([]);

  const [plan_tratamiento_cita, setPlanTratamientoCita] = useState<PlanTratamiento | null>(null);
  const [plan_tratamiento_id_cita, setPlanTratamientoIdCita] = useState<number | null>(null);
  const [cargando_plan_tratamiento_cita, setCargandoPlanTratamientoCita] = useState<boolean>(false);

  const cargarPlanTratamientoCita = async (planId?: number | null) => {
    if (!planId) {
      setPlanTratamientoIdCita(null);
      setPlanTratamientoCita(null);
      setCargandoPlanTratamientoCita(false);
      return;
    }
    setPlanTratamientoIdCita(planId);
    setPlanTratamientoCita(null);
    setCargandoPlanTratamientoCita(true);
    try {
      const plan = await planesTratamientoApi.obtenerPorId(planId);
      setPlanTratamientoCita(plan);
    } catch (error) {
      console.error('Error al cargar plan de tratamiento:', error);
      setPlanTratamientoCita(null);
    } finally {
      setCargandoPlanTratamientoCita(false);
    }
  };

  const [precondiciones_tutorial_recursos, setPrecondicionesTutorialRecursos] = useState({
    cargando: false,
    tieneInventarios: false,
    tieneProductoConsumible: false,
    tieneStockConsumible: false,
  });

  useEffect(() => {
    let cancelado = false;

    const evaluarPrecondicionesRecursos = async () => {
      setPrecondicionesTutorialRecursos(prev => ({ ...prev, cargando: true }));

      try {
        const inventarios_api: Inventario[] = await inventarioApi.obtenerInventarios();
        if (cancelado) return;

        if (inventarios.length === 0) {
          setInventarios(inventarios_api);
        }

        const tieneInventarios = inventarios_api.length > 0;
        let tieneProductoConsumible = false;
        let tieneStockConsumible = false;

        const productos_map: Record<number, Producto[]> = {};

        for (const inv of inventarios_api) {
          if (!inv?.id) continue;
          const productos: Producto[] = await inventarioApi.obtenerProductos(inv.id);
          if (cancelado) return;

          productos_map[inv.id] = productos;

          const productos_consumibles = (productos || []).filter(p => (p.tipo || '').toLowerCase() === TipoProducto.MATERIAL);
          if (productos_consumibles.length > 0) {
            tieneProductoConsumible = true;
          }

          for (const prod of productos_consumibles) {
            const materiales = prod.materiales || [];
            for (const mat of materiales) {
              const stock = Number(mat.cantidad_actual || 0) - Number(mat.cantidad_reservada || 0);
              if (stock > 0) {
                tieneStockConsumible = true;
                break;
              }
            }
            if (tieneStockConsumible) break;
          }

          if (tieneProductoConsumible && tieneStockConsumible) break;
        }

        if (Object.keys(productos_map).length > 0) {
          setProductosPorInventario(prev => ({
            ...prev,
            ...productos_map,
          }));
        }

        setPrecondicionesTutorialRecursos({
          cargando: false,
          tieneInventarios,
          tieneProductoConsumible,
          tieneStockConsumible,
        });
      } catch (e) {
        if (cancelado) return;
        setPrecondicionesTutorialRecursos({
          cargando: false,
          tieneInventarios: false,
          tieneProductoConsumible: false,
          tieneStockConsumible: false,
        });
      }
    };

    evaluarPrecondicionesRecursos();
    return () => {
      cancelado = true;
    };
  }, []);

  const materialesCambiaron = (): boolean => {
    if (consumibles_seleccionados.length !== consumibles_iniciales.length) return true;
    for (const c of consumibles_seleccionados) {
      const inicial = consumibles_iniciales.find(i => i.material_id === c.material_id);
      if (!inicial || inicial.cantidad !== c.cantidad) return true;
    }

    return false;
  };

  const materialesConfirmacionCambiaron = (): boolean => {
    if (consumibles_confirmacion.length !== consumibles_confirmacion_inicial.length) return true;
    for (const c of consumibles_confirmacion) {
      const inicial = consumibles_confirmacion_inicial.find(i => i.material_id === c.material_id);
      if (!inicial || inicial.cantidad !== c.cantidad) return true;
    }
    return false;
  };

  const [accion_pago_edicion, setAccionPagoEdicion] = useState<'mantener' | 'reembolsar' | 'eliminar'>('mantener');
  const [accion_pago_confirmacion_opcion, setAccionPagoConfirmacionOpcion] = useState<'mantener' | 'reembolsar' | 'eliminar'>('mantener');
  const [confirmar_eliminar_pago_abierto, setConfirmarEliminarPagoAbierto] = useState(false);
  const [contexto_eliminar_pago, setContextoEliminarPago] = useState<'edicion' | 'confirmacion' | null>(null);

  const [formulario, setFormularioBase] = useState<FormularioAgenda>({
    paciente_id: '',
    fecha: undefined as Date | undefined,
    descripcion: '',
    estado_pago: 'pendiente',
    monto_esperado: '0.00',
    monto_esperado_usd: '0.00',
    horas_aproximadas: '0',
    minutos_aproximados: '30',
  });

  const setFormulario = (valor: React.SetStateAction<FormularioAgenda>) => {
    setFormularioBase((prev) => {
      const siguiente = typeof valor === 'function'
        ? (valor as (p: FormularioAgenda) => FormularioAgenda)(prev)
        : valor;
      return clampDuracionFormulario(siguiente);
    });
  };

  const [formulario_inicial, setFormularioInicial] = useState(formulario);

  const hay_cambios = (() => {
    const cambios_formulario =
      formulario.paciente_id !== formulario_inicial.paciente_id ||
      formulario.descripcion !== formulario_inicial.descripcion ||
      formulario.estado_pago !== formulario_inicial.estado_pago ||
      formulario.monto_esperado !== formulario_inicial.monto_esperado ||
      formulario.monto_esperado_usd !== formulario_inicial.monto_esperado_usd ||
      formulario.horas_aproximadas !== formulario_inicial.horas_aproximadas ||
      formulario.minutos_aproximados !== formulario_inicial.minutos_aproximados ||
      new Date(formulario.fecha || '').getTime() !== new Date(formulario_inicial.fecha || '').getTime();

    return cambios_formulario || materialesCambiaron();
  })();

  const hay_cambios_confirmacion = (() => {
    return estado_pago_confirmacion !== estado_pago_confirmacion_inicial ||
      monto_confirmacion !== monto_confirmacion_inicial ||
      monto_confirmacion_usd !== monto_confirmacion_usd_inicial ||
      materialesConfirmacionCambiaron();
  })();

  const condicinesBloqueoTutoriales = useMemo(() => {
    const tienePacientes = pacientes.length > 0;
    const tieneCitas = citas.length > 0;

    const ahora = new Date();
    const tieneCitaConPaciente = citas.some(c => !!c.paciente);
    const tieneCitaConcluidaConPaciente = citas.some(c => {
      if (!c.paciente) return false;
      const inicio = new Date(c.fecha);
      const fin = new Date(inicio);
      fin.setHours(fin.getHours() + (c.horas_aproximadas || 0));
      fin.setMinutes(fin.getMinutes() + (c.minutos_aproximados || 30));
      return ahora > fin;
    });

    const rec_ok =
      tienePacientes &&
      precondiciones_tutorial_recursos.tieneInventarios &&
      precondiciones_tutorial_recursos.tieneProductoConsumible &&
      precondiciones_tutorial_recursos.tieneStockConsumible;

    const msg_recursos = !tienePacientes
      ? 'Requiere crear al menos un paciente.'
      : !precondiciones_tutorial_recursos.tieneInventarios
        ? 'Requiere crear al menos un inventario.'
        : !precondiciones_tutorial_recursos.tieneProductoConsumible
          ? 'Requiere crear al menos un producto consumible (tipo material) en un inventario.'
          : !precondiciones_tutorial_recursos.tieneStockConsumible
            ? 'Requiere tener stock disponible en algún consumible (material/lote).' 
            : 'Requiere pacientes, inventario, producto consumible y stock.';

    const cierre_ok = tieneCitaConPaciente && tieneCitaConcluidaConPaciente;
    const msg_cierre = !tieneCitaConPaciente
      ? 'Requiere crear una cita con paciente.'
      : !tieneCitaConcluidaConPaciente
        ? 'Requiere que una cita con paciente ya haya concluido (puedes usar filtros por rango para encontrar una cita pasada).' 
        : 'Requiere una cita concluida con paciente.';

    return {
      'agenda-crear-cita-con-paciente': {
        bloqueado: !tienePacientes,
        mensaje: 'Requiere crear al menos un paciente para realizar este tutorial.',
      },
      'agenda-usar-horas-libres': {
        bloqueado: !tieneCitas,
        mensaje: 'Requiere crear al menos una cita para calcular y mostrar horas libres.',
      },
      'agenda-crear-cita-con-recursos': {
        bloqueado: !rec_ok,
        mensaje: msg_recursos,
      },
      'agenda-confirmar-cerrar-cita': {
        bloqueado: !cierre_ok,
        mensaje: msg_cierre,
      },
    };
  }, [pacientes.length, citas, precondiciones_tutorial_recursos]);

  const { handleOpenChange: handleOpenChangeGestion, closeConfirmationProps: closeConfirmationPropsGestion } = useSafeClose({
    isOpen: dialogo_abierto,
    onOpenChange: setDialogoAbierto,
    isDirty: hay_cambios,
  });

  const { handleOpenChange: handleOpenChangeConfirmacion, closeConfirmationProps: closeConfirmationPropsConfirmacion } = useSafeClose({
    isOpen: dialogo_confirmar_materiales_abierto,
    onOpenChange: setDialogoConfirmarMaterialesAbierto,
    isDirty: hay_cambios_confirmacion,
  });

  const abrirDialogoConfirmarEliminar = (id: number) => {
    setCitaAEliminar(id);
    setDialogoConfirmarEliminarAbierto(true);
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const estados_pago = [
    { valor: 'pendiente', etiqueta: 'Pendiente', color: 'bg-yellow-500' },
    { valor: 'pagado', etiqueta: 'Pagado', color: 'bg-green-500' },
    { valor: 'cancelado', etiqueta: 'Cancelado', color: 'bg-red-500' },
  ];
  const estados_pago_validos = estados_pago.map(e => e.valor);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    filtrarPorMes();
  }, [mes_actual, ano_actual]);

  useEffect(() => {
    if (mostrar_horas_libres) {
      const d = actualizarFechaSeleccionada(fecha_seleccionada);
      setDialogoDiaAbierto(true);
      setErrorCitasDia(null);
      setCitasDia([]);
      void cargarHorasLibres(d);
    } else {
      setHorasLibres([]);

      if (dialogo_dia_abierto) {
        void cargarCitasDia(fecha_seleccionada);
      }
    }
  }, [mostrar_horas_libres]);

  const cargarDatosIniciales = async () => {
    setCargandoInicial(true);
    try {
      const datos_pacientes = await pacientesApi.obtenerTodos();
      setPacientes(datos_pacientes);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive',
      });
    } finally {
      setCargandoInicial(false);
    }
  };

  const filtrarPorMes = async () => {
    const id_peticion = ++ultima_peticion_mes.current;
    setCargandoMes(true);
    try {
      const [datos_citas, datos_ocupacion] = await Promise.all([
        agendaApi.obtenerPorMes(mes_actual, ano_actual, true),
        agendaApi.obtenerOcupacionPorMes(mes_actual, ano_actual) as Promise<RespuestaOcupacionMes>,
      ]);

      if (id_peticion !== ultima_peticion_mes.current) return;

      setCitas(datos_citas);
      setOcupacionMes(datos_ocupacion?.dias || {});
      if (mostrar_horas_libres) {
        await cargarHorasLibres(fecha_seleccionada);
      } else {
        setHorasLibres([]);
      }
    } catch (error) {
      if (id_peticion !== ultima_peticion_mes.current) return;
      console.error('Error al cargar datos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive',
      });
      setOcupacionMes({});
    } finally {
      if (id_peticion === ultima_peticion_mes.current) {
        setCargandoMes(false);
      }
    }
  };

  const obtenerBarraOcupacion = (fecha: Date) => {
    const hoy = new Date();
    const key = claveDia(fecha);
    const intervalosOcupados = ocupacion_mes_desde_citas[key] || ocupacion_mes[key] || [];
    const diaSemana = obtenerDiaSemana(fecha);
    const rangos = ordenarIntervalos(horarios_laborales[diaSemana] || []);

    if (rangos.length === 0) {
      return { segmentosOcupadosPct: [] as Array<{ leftPct: number; widthPct: number }>, ratio: 0, esHoy: esMismoDia(fecha, hoy), tieneLabor: false };
    }

    const ocupadosMin = intervalosOcupados
      .filter(i => esHoraHHMM(i.inicio) && esHoraHHMM(i.fin))
      .map(i => ({ inicio: horaAMinutos(i.inicio), fin: horaAMinutos(i.fin) }))
      .filter(i => i.fin > i.inicio)
      .sort((a, b) => a.inicio - b.inicio);

    const RESOLUCION_MIN = 15;
    const segmentosLaborales = rangos
      .filter(r => esHoraHHMM(r.inicio) && esHoraHHMM(r.fin))
      .map(r => ({ inicio: horaAMinutos(r.inicio), fin: horaAMinutos(r.fin) }))
      .filter(r => r.fin > r.inicio)
      .sort((a, b) => a.inicio - b.inicio);

    let totalLaborMin = 0;
    const segmentosConOffset = segmentosLaborales.map(s => {
      const offset = totalLaborMin;
      totalLaborMin += (s.fin - s.inicio);
      return { ...s, offset };
    });

    if (totalLaborMin <= 0) {
      return { segmentosOcupadosPct: [], ratio: 0, esHoy: esMismoDia(fecha, hoy), tieneLabor: false };
    }

    const ocupadosContinuo: Array<{ inicio: number; fin: number }> = [];
    for (const o of ocupadosMin) {
      for (const seg of segmentosConOffset) {
        const ini = Math.max(o.inicio, seg.inicio);
        const fin = Math.min(o.fin, seg.fin);
        if (fin <= ini) continue;
        ocupadosContinuo.push({
          inicio: seg.offset + (ini - seg.inicio),
          fin: seg.offset + (fin - seg.inicio),
        });
      }
    }

    ocupadosContinuo.sort((a, b) => a.inicio - b.inicio);
    const merged: Array<{ inicio: number; fin: number }> = [];
    for (const it of ocupadosContinuo) {
      const last = merged[merged.length - 1];
      if (!last || it.inicio > last.fin) {
        merged.push({ ...it });
      } else {
        last.fin = Math.max(last.fin, it.fin);
      }
    }

    const totalBloques = Math.ceil(totalLaborMin / RESOLUCION_MIN);
    const bloquesOcupados = (() => {
      const ocupados = new Set<number>();
      for (const it of merged) {
        const startBlock = Math.floor(it.inicio / RESOLUCION_MIN);
        const endBlock = Math.ceil(it.fin / RESOLUCION_MIN);
        for (let b = startBlock; b < endBlock; b++) ocupados.add(b);
      }
      return Math.min(totalBloques, ocupados.size);
    })();

    const ratio = totalBloques > 0 ? (bloquesOcupados / totalBloques) : 0;
    const segmentosOcupadosPct = merged
      .map(it => {
        const leftPct = (it.inicio / totalLaborMin) * 100;
        const widthPct = ((it.fin - it.inicio) / totalLaborMin) * 100;
        return {
          leftPct: Math.max(0, Math.min(100, leftPct)),
          widthPct: Math.max(0, Math.min(100, widthPct)),
        };
      })
      .filter(s => s.widthPct > 0.1);

    return { segmentosOcupadosPct, ratio, esHoy: esMismoDia(fecha, hoy), tieneLabor: true };
  };

  const claseOcupacionEstilo = (ratio: number) => {
    if (!Number.isFinite(ratio) || ratio <= 0) return '';
    if (ratio < 0.25) return 'border border-primary/25 bg-primary/5 text-primary';
    if (ratio < 0.5) return 'border-2 border-primary/35 bg-primary/10 text-primary font-semibold';
    if (ratio < 0.8) return 'border-2 border-primary/55 bg-primary/15 text-primary font-semibold';
    if (ratio < 0.98) return 'border-2 border-primary/75 bg-primary/20 text-primary font-bold';
    return 'border-2 border-primary bg-primary/25 text-primary font-bold';
  };

  const AgendaDayButton = ({ className, day, modifiers, ...props }: any) => {
    const ref = useRef<HTMLButtonElement | null>(null);
    useEffect(() => {
      if (modifiers?.focused) ref.current?.focus();
    }, [modifiers?.focused]);

    const { segmentosOcupadosPct, ratio, esHoy, tieneLabor } = obtenerBarraOcupacion(day.date);

    const hoyClases = esHoy
      ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary'
      : '';

    const barraLibreClases = esHoy
      ? 'bg-primary-foreground/25'
      : (tieneLabor ? 'bg-primary/20' : 'bg-muted-foreground/10');

    const barraOcupadaClases = esHoy ? 'bg-primary-foreground/70' : 'bg-primary/60';

    return (
      <Button
        ref={ref as any}
        id={esHoy ? 'agenda-dia-hoy' : undefined}
        variant="ghost"
        size="icon"
        data-day={claveDia(day.date)}
        data-selected-single={
          modifiers?.selected &&
          !modifiers?.range_start &&
          !modifiers?.range_end &&
          !modifiers?.range_middle
        }
        data-range-start={modifiers?.range_start}
        data-range-end={modifiers?.range_end}
        data-range-middle={modifiers?.range_middle}
        className={cn(
          className,
          'relative overflow-hidden border-transparent',
          !esHoy ? claseOcupacionEstilo(ratio) : '',
          hoyClases,
        )}
        {...props}
      >
        <span className="absolute inset-0 z-0 flex items-center justify-center">
          {day.date.getDate()}
        </span>

        <span
          className={cn(
            'absolute bottom-1 left-1 right-1 z-10 h-1 rounded-full overflow-hidden',
            barraLibreClases,
            modifiers?.outside ? 'opacity-40' : 'opacity-100'
          )}
        >
          {segmentosOcupadosPct.map((s, idx) => (
            <span
              key={idx}
              className={cn('absolute top-0 bottom-0', barraOcupadaClases)}
              style={{ left: `${s.leftPct}%`, width: `${s.widthPct}%` }}
            />
          ))}
        </span>
      </Button>
    );
  };

  const cargarHorasLibres = async (dia?: Date) => {
    setCargandoCitasDia(true);
    setErrorCitasDia(null);
    try {
      const diaBase = dia ?? fecha_seleccionada;
      const diaSemana = obtenerDiaSemana(diaBase);
      const rangos = ordenarIntervalos(horarios_laborales[diaSemana] || []);

      if (rangos.length === 0) {
        setHorasLibres([]);
        return;
      }

      const inicioPeticion = fechaConHora(diaBase, rangos[0].inicio);
      const finPeticion = fechaConHora(diaBase, rangos[rangos.length - 1].fin);

      const datos_horas_libres = await agendaApi.filtrarEspaciosLibres(inicioPeticion, finPeticion);
      const recortadas = recortarHorasLibresPorHorarios(datos_horas_libres, normalizarDia(diaBase), rangos);
      setHorasLibres(recortadas);
    } catch (error) {
      console.error('Error al cargar horas libres:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las horas libres',
        variant: 'destructive',
      });
      setHorasLibres([]);
      setErrorCitasDia('No se pudieron cargar las horas libres de esta fecha.');
    } finally {
      setCargandoCitasDia(false);
    }
  };

  const normalizarDia = (fecha: Date) => {
    const d = new Date(fecha);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const obtenerRangoDia = (dia: Date) => {
    const inicio = normalizarDia(dia);
    const fin = new Date(inicio);
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  };

  const actualizarFechaSeleccionada = (dia: Date) => {
    const d = normalizarDia(dia);
    setFechaSeleccionada(d);
    setMesActual(d.getMonth() + 1);
    setAnoActual(d.getFullYear());
    return d;
  };

  const cargarCitasDia = async (dia: Date) => {
    const id_peticion = ++ultima_peticion_citas_dia.current;
    setCargandoCitasDia(true);
    setErrorCitasDia(null);

    try {
      const { inicio, fin } = obtenerRangoDia(dia);
      const datos = await agendaApi.filtrarCitas(inicio, fin);
      if (id_peticion !== ultima_peticion_citas_dia.current) return;

      const ordenadas = (datos || []).slice().sort((a: any, b: any) => {
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      });

      setCitasDia(ordenadas);
    } catch (error) {
      if (id_peticion !== ultima_peticion_citas_dia.current) return;
      console.error('Error al cargar citas del día:', error);
      setCitasDia([]);
      setErrorCitasDia('No se pudieron cargar las citas de esta fecha.');
    } finally {
      if (id_peticion !== ultima_peticion_citas_dia.current) return;
      setCargandoCitasDia(false);
    }
  };

  const abrirDialogoDia = (dia: Date) => {
    if (mostrar_horas_libres) return;
    const d = actualizarFechaSeleccionada(dia);
    setDialogoDiaAbierto(true);
    void cargarCitasDia(d);
  };

  const cambiarDiaEnDialogo = (delta: number) => {
    const nueva = new Date(fecha_seleccionada);
    nueva.setDate(nueva.getDate() + delta);
    const d = actualizarFechaSeleccionada(nueva);
    if (mostrar_horas_libres) {
      void cargarHorasLibres(d);
    } else {
      void cargarCitasDia(d);
    }
  };

  const irHoyEnDialogo = () => {
    const hoy = new Date();
    const d = actualizarFechaSeleccionada(hoy);
    if (mostrar_horas_libres) {
      void cargarHorasLibres(d);
    } else {
      void cargarCitasDia(d);
    }
  };

  const cargarDatos = async () => {
    await filtrarPorMes();
  };

  const recargarDialogoDiaSiAbierto = (dia?: Date) => {
    if (!dialogo_dia_abierto) return;
    const d = dia ?? fecha_seleccionada;
    if (mostrar_horas_libres) {
      void cargarHorasLibres(d);
    } else {
      void cargarCitasDia(d);
    }
  };

  const cargarInventarios = async () => {
    if (inventarios.length > 0) return;

    try {
      const datos = await inventarioApi.obtenerInventarios();
      setInventarios(datos);
    } catch (error) {
      console.error('Error al cargar inventarios:', error);
    }
  };

  const cargarProductosInventario = async (inventario_id: number) => {
    if (productos_por_inventario[inventario_id]) {
      return;
    }

    setCargandoMateriales(true);
    try {
      const datos = await inventarioApi.obtenerProductos(inventario_id);
      setProductosPorInventario(prev => ({
        ...prev,
        [inventario_id]: datos
      }));
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos del inventario',
        variant: 'destructive',
      });
    } finally {
      setCargandoMateriales(false);
    }
  };

  const validarDisponibilidadMateriales = (): { valido: boolean; advertencias: string[] } => {
    const advertencias: string[] = [];

    for (const material of materiales_cita) {
      if (material.inventario_id === 0) {
        advertencias.push('Hay materiales sin inventario seleccionado');
        continue;
      }

      if (material.producto_id === 0) {
        advertencias.push('Hay materiales sin producto seleccionado');
        continue;
      }

      const productos = productos_por_inventario[material.inventario_id] || [];
      const producto = productos.find(p => p.id === material.producto_id);
      if (!producto) continue;
      for (const item of material.items) {
        if (producto.tipo === TipoProducto.MATERIAL) {
          if (!item.lote_id) {
            advertencias.push(`${producto.nombre}: Debe seleccionar un material para todos los items`);
            break;
          }
          if (item.cantidad_planeada <= 0) {
            advertencias.push(`${producto.nombre}: La cantidad debe ser mayor a 0 en todos los materiales`);
            break;
          }
        }
      }
    }

    return { valido: true, advertencias };
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

  const crearFechaInicialParaDia = (dia: Date) => {
    const ahora = redondearA15Minutos(new Date());
    const base = new Date(dia);
    base.setHours(ahora.getHours(), ahora.getMinutes(), 0, 0);
    return base;
  };

  const abrirDialogoNuevo = (dia?: Date) => {
    setPlanTratamientoCita(null);
    setPlanTratamientoIdCita(null);
    setCargandoPlanTratamientoCita(false);
    const datosIniciales = {
      paciente_id: '',
      fecha: dia ? crearFechaInicialParaDia(dia) : redondearA15Minutos(new Date()),
      descripcion: '',
      estado_pago: 'pendiente',
      monto_esperado: '0.00',
      monto_esperado_usd: '0.00',
      horas_aproximadas: '0',
      minutos_aproximados: '30',
    };
    const datos_clamped = clampDuracionFormulario(datosIniciales);
    setFormulario(datos_clamped);
    setFormularioInicial(datos_clamped);
    setModoEdicion(false);
    setSoloVisualizarGestion(false);
    setMensajeVisualizacionGestion(null);
    setRecursosSoloLecturaGestion(false);
    setMaterialesCita([]);
    setProductosPorInventario({});
    setConsumiblesSeleccionados([]);
    setConsumiblesIniciales([]);
    setAccionPagoEdicion('mantener');
    setBloquearSelectorFechaGestion(!!dia);
    setDialogoAbierto(true);
  };

  const abrirDialogoDesdeHoraLibre = (hora_libre: HoraLibre) => {
    setPlanTratamientoCita(null);
    setPlanTratamientoIdCita(null);
    setCargandoPlanTratamientoCita(false);
    const total_disponible = Number(hora_libre.duracion_minutos || (hora_libre.horas_aproximadas * 60 + hora_libre.minutos_aproximados) || 0);
    const minutos_defecto = Math.max(1, Math.min(30, total_disponible));
    const datosIniciales = {
      paciente_id: '',
      fecha: new Date(hora_libre.fecha),
      descripcion: '',
      estado_pago: 'pendiente',
      monto_esperado: '0.00',
      monto_esperado_usd: '0.00',
      horas_aproximadas: '0',
      minutos_aproximados: minutos_defecto.toString(),
    };
    const datos_clamped = clampDuracionFormulario(datosIniciales);
    setFormulario(datos_clamped);
    setFormularioInicial(datos_clamped);
    setModoEdicion(false);
    setSoloVisualizarGestion(false);
    setMensajeVisualizacionGestion(null);
    setRecursosSoloLecturaGestion(false);
    setMaterialesCita([]);
    setProductosPorInventario({});
    setConsumiblesSeleccionados([]);
    setConsumiblesIniciales([]);
    setBloquearSelectorFechaGestion(true);
    setDialogoAbierto(true);
  };

  const abrirDialogoEditar = async (cita: Cita) => {
    void cargarPlanTratamientoCita(cita.plan_tratamiento?.id ?? null);

    const paciente_eliminado =
      Boolean((cita as any).paciente_eliminado) ||
      Boolean((cita.paciente as any)?.paciente_eliminado);
    const mensaje_paciente_eliminado =
      'Este paciente fue eliminado. Esta cita se mantiene visible solo para consulta y no puede modificarse.';

    const datosIniciales = {
      paciente_id: cita.paciente?.id.toString() || '',
      fecha: new Date(cita.fecha),
      descripcion: cita.descripcion,
      estado_pago: cita.estado_pago || 'pendiente',
      monto_esperado: cita.monto_esperado?.toString() || '',
      monto_esperado_usd: cita.monto_esperado_usd?.toString() || '',
      horas_aproximadas: (cita.horas_aproximadas || 0).toString(),
      minutos_aproximados: (cita.minutos_aproximados || 30).toString(),
    };
    const datos_clamped = clampDuracionFormulario(datosIniciales);
    setFormulario(datos_clamped);
    setFormularioInicial(datos_clamped);
    setCitaSeleccionada(cita);
    setModoEdicion(true);
    setSoloVisualizarGestion(paciente_eliminado);
    setMensajeVisualizacionGestion(paciente_eliminado ? mensaje_paciente_eliminado : null);
    setRecursosSoloLecturaGestion(paciente_eliminado || !!cita.materiales_confirmados);
    setConsumiblesSeleccionados([]);
    setConsumiblesIniciales([]);
    setAccionPagoEdicion('mantener');
    setBloquearSelectorFechaGestion(false);

    if (cita.id && cita.paciente?.id) {
      setMaterialesCita([]);
      setCargandoMateriales(true);
      try {
        const cita_completa = await agendaApi.obtenerPorIdCompleto(cita.id);

        const consumibles_transformados = (cita_completa.reservas_materiales || []).map((reserva: any) => ({
          inventario_id: reserva.material.producto.inventario.id,
          inventario_nombre: reserva.material.producto.inventario.nombre,
          producto_id: reserva.material.producto.id,
          producto_nombre: reserva.material.producto.nombre,
          material_id: reserva.material.id,
          nro_lote: reserva.material.nro_lote,
          cantidad: Number(reserva.cantidad_confirmada ?? reserva.cantidad_reservada),
          stock_disponible: Number(reserva.material.cantidad_actual),
          unidad_medida: reserva.material.producto.unidad_medida,
          permite_decimales: reserva.material.producto.permite_decimales,
        }));

        setConsumiblesSeleccionados(consumibles_transformados);
        setConsumiblesIniciales(consumibles_transformados);
      } catch (error) {
        console.error('Error al cargar materiales de la cita:', error);
      } finally {
        setCargandoMateriales(false);
      }
    }

    setDialogoAbierto(true);
  };

  const citaEstaOcurriendo = (cita: Cita): boolean => {
    const ahora = new Date();
    const fecha_inicio = new Date(cita.fecha);
    const fecha_fin = new Date(fecha_inicio);
    fecha_fin.setHours(fecha_fin.getHours() + (cita.horas_aproximadas || 0));
    fecha_fin.setMinutes(fecha_fin.getMinutes() + (cita.minutos_aproximados || 30));
    return ahora >= fecha_inicio && ahora < fecha_fin;
  };

  const abrirDialogoVer = async (cita: Cita, motivo: 'ocurriendo' | 'finalizada') => {
    const paciente_eliminado =
      Boolean((cita as any).paciente_eliminado) ||
      Boolean((cita.paciente as any)?.paciente_eliminado);

    const mensaje_base = motivo === 'ocurriendo'
      ? 'Esta cita está ocurriendo, por ahora solo puede visualizarse'
      : 'Ésta cita ya ha finalizado, por ahora solo puede visualizarse';

    const mensaje = paciente_eliminado
      ? `${mensaje_base}\n\nNota: el paciente fue eliminado, esta cita no se puede modificar.`
      : mensaje_base;
    await abrirDialogoEditar(cita);
    setSoloVisualizarGestion(true);
    setMensajeVisualizacionGestion(mensaje);
  };

  const manejarGuardar = async (confirmado_pago: boolean = false, accion_pago?: 'mantener' | 'reembolsar' | 'eliminar') => {
    if (!formulario.fecha || !formulario.descripcion) {
      toast({
        title: 'Error',
        description: 'Fecha y descripción son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    const fuera_horario_laboral = !estaDentroHorarioLaboral(new Date(formulario.fecha), horarios_laborales);

    const toastExito = (descripcion: string) => {
      if (fuera_horario_laboral) {
        toast({
          title: 'Advertencia',
          description: `${descripcion}. Advertencia: la hora seleccionada está fuera del horario laboral.`,
          variant: 'warning',
          duration: 8000,
        });
        return;
      }

      toast({
        title: 'Éxito',
        description: descripcion,
      });
    };

    if (formulario.paciente_id && !estados_pago_validos.includes(formulario.estado_pago)) {
      toast({
        title: 'Error',
        description: 'Selecciona un estado de pago válido',
        variant: 'destructive',
      });
      return;
    }

    const horas = parseInt(formulario.horas_aproximadas);
    const minutos = parseInt(formulario.minutos_aproximados);

    if (
      isNaN(horas) ||
      horas < 0 ||
      horas > 23 ||
      isNaN(minutos) ||
      minutos < 0 ||
      minutos > 59
    ) {
      toast({
        title: 'Error',
        description: 'Horas debe estar entre 0 y 23, y minutos entre 0 y 59',
        variant: 'destructive',
      });
      return;
    }

    if (horas + minutos <= 0) {
      toast({
        title: 'Error',
        description: 'La duración total (horas + minutos) debe ser de al menos 1 minuto',
        variant: 'destructive',
      });
      return;
    }
    if (materiales_cita.length > 0) {
      const { valido, advertencias } = validarDisponibilidadMateriales();
      if (!valido) {
        toast({
          title: 'Error de Validación',
          description: advertencias.join('\n'),
          variant: 'destructive',
        });
        return;
      }
      if (advertencias.length > 0) {
        toast({
          title: 'Advertencias',
          description: advertencias.join('\n'),
          variant: 'default',
          duration: 5000,
        });
      }
    }

    setGuardando(true);
    try {
      const consumibles = consumibles_seleccionados.map(c => ({
        material_id: c.material_id,
        cantidad: c.cantidad
      }));

      const datos_crear: any = {
        fecha: formulario.fecha,
        descripcion: formulario.descripcion,
        horas_aproximadas: horas,
        minutos_aproximados: minutos,
        consumibles,
      };

      if (formulario.paciente_id) {
        datos_crear.paciente_id = parseInt(formulario.paciente_id);
        datos_crear.estado_pago = formulario.estado_pago;
        datos_crear.monto_esperado = formulario.monto_esperado ? parseFloat(formulario.monto_esperado) : 0;
        datos_crear.monto_esperado_usd = formulario.monto_esperado_usd ? parseFloat(formulario.monto_esperado_usd) : 0;
        datos_crear.tasa_cambio = Number(cambio_dolar);
      }

      if (modo_edicion && cita_seleccionada) {
        const datos_actualizar: any = {};

        if (materialesCambiaron()) {
          datos_actualizar.consumibles = consumibles;
        }

        const fecha_inicial = formulario_inicial.fecha ? new Date(formulario_inicial.fecha).getTime() : null;
        const fecha_nueva = formulario.fecha ? new Date(formulario.fecha).getTime() : null;
        if (fecha_inicial !== fecha_nueva) {
          datos_actualizar.fecha = formulario.fecha;
        }

        if (formulario_inicial.descripcion !== formulario.descripcion) {
          datos_actualizar.descripcion = formulario.descripcion;
        }

        const horas_inicial = parseInt(formulario_inicial.horas_aproximadas);
        const minutos_inicial = parseInt(formulario_inicial.minutos_aproximados);
        if (horas_inicial !== horas || minutos_inicial !== minutos) {
          datos_actualizar.horas_aproximadas = horas;
          datos_actualizar.minutos_aproximados = minutos;
        }

        if (formulario_inicial.paciente_id !== formulario.paciente_id) {
          datos_actualizar.paciente_id = formulario.paciente_id ? parseInt(formulario.paciente_id) : null;
        }

        if (formulario.paciente_id) {
          if (formulario_inicial.estado_pago !== formulario.estado_pago) {
            datos_actualizar.estado_pago = formulario.estado_pago;
          }
          if (formulario_inicial.monto_esperado !== formulario.monto_esperado) {
            datos_actualizar.monto_esperado = formulario.monto_esperado ? parseFloat(formulario.monto_esperado) : 0;
          }
          if (formulario_inicial.monto_esperado_usd !== formulario.monto_esperado_usd) {
            datos_actualizar.monto_esperado_usd = formulario.monto_esperado_usd ? parseFloat(formulario.monto_esperado_usd) : 0;
          }
          if (Number(cambio_dolar) && (!('tasa_cambio' in datos_actualizar))) {
            if (
              datos_actualizar.estado_pago !== undefined ||
              datos_actualizar.monto_esperado !== undefined ||
              datos_actualizar.monto_esperado_usd !== undefined
            ) {
              datos_actualizar.tasa_cambio = Number(cambio_dolar);
            }
          }
        }

        const estado_actual = (cita_seleccionada.estado_pago || '').toLowerCase();
        const nuevo_estado = (formulario.estado_pago || '').toLowerCase();
        const requiere_accion_pago = estado_actual === 'pagado' && (nuevo_estado === 'cancelado' || nuevo_estado === 'pendiente');
        const accion_cancelacion_pago = requiere_accion_pago ? (accion_pago ?? accion_pago_edicion) : undefined;

        if (accion_cancelacion_pago === 'eliminar' && !confirmado_pago) {
          setContextoEliminarPago('edicion');
          setConfirmarEliminarPagoAbierto(true);
          setGuardando(false);
          return;
        }

        if (accion_cancelacion_pago) {
          datos_actualizar.accion_cancelacion_pago = accion_cancelacion_pago;
        }

        await agendaApi.actualizar(cita_seleccionada.id, datos_actualizar);

        const estado_cambio = estado_actual !== nuevo_estado;
        const cambio_a_pagado = estado_actual !== 'pagado' && nuevo_estado === 'pagado';
        const cambio_desde_pagado = estado_actual === 'pagado' && nuevo_estado !== 'pagado';

        if (estado_cambio && cita_seleccionada.plan_tratamiento) {
          if (cambio_a_pagado) {
            toastExito('Cita actualizada y pago registrado automáticamente');
          } else if (cambio_desde_pagado) {
            let mensaje_desc = 'Cita actualizada correctamente.';
            if ((nuevo_estado === 'cancelado' || nuevo_estado === 'pendiente') && confirmado_pago && accion_pago) {
              if (accion_pago === 'reembolsar') mensaje_desc += ' Se ha registrado el reembolso.';
              else if (accion_pago === 'eliminar') mensaje_desc += ' El pago ha sido eliminado.';
              else mensaje_desc += ' El pago se ha mantenido desvinculado.';
            } else {
              mensaje_desc = 'Cita actualizada (estado de pago modificado).';
            }

            toastExito(mensaje_desc);
          } else {
            toastExito('Cita actualizada correctamente');
          }
        } else {
          toastExito('Cita actualizada correctamente');
        }
      } else {
        await agendaApi.crear(datos_crear);
        toastExito('Cita creada correctamente');
      }

      setBloquearSelectorFechaGestion(false);
      setDialogoAbierto(false);
      void cargarDatos();
      recargarDialogoDiaSiAbierto();
    } catch (error: any) {
      console.error('Error al guardar cita:', error);

      const data = (error as any)?.response?.data;
      const mensaje_error = formatearConflictoHorariosDesdeRespuesta(data)
        || data?.message
        || 'No se pudo guardar la cita';

      toast({
        title: 'Error - Conflicto de Horarios',
        description: (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <pre className="text-sm whitespace-pre-wrap font-mono">{mensaje_error}</pre>
            </div>
          </div>
        ),
        variant: 'destructive',
        duration: 15000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = async () => {
    if (!cita_a_eliminar) return;
    try {
      await agendaApi.eliminar(cita_a_eliminar);
      toast({
        title: 'Éxito',
        description: 'Cita eliminada correctamente',
      });
      setDialogoConfirmarEliminarAbierto(false);
      setCitaAEliminar(null);
      void cargarDatos();
      recargarDialogoDiaSiAbierto();
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la cita',
        variant: 'destructive',
      });
    }
  };

  const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const formatearFecha = (fecha: Date): string => {
    const f = new Date(fecha);
    const dia = String(f.getDate()).padStart(2, '0');
    const mes = MESES_CORTOS[f.getMonth()] ?? '';
    const anio = f.getFullYear();
    return `${dia} ${mes} ${anio}`.trim();
  };

  const formatearHora = (fecha: Date): string => {
    const f = new Date(fecha);
    const horas = String(f.getHours()).padStart(2, '0');
    const minutos = String(f.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
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

  const obtenerColorEstado = (estado: string | null): string => {
    if (!estado) return 'bg-gray-500';
    const estado_encontrado = estados_pago.find(e => e.valor === estado);
    return estado_encontrado?.color || 'bg-gray-500';
  };

  const obtenerEtiquetaEstado = (estado: string | null): string => {
    if (!estado) return 'Sin estado';
    const estado_encontrado = estados_pago.find(e => e.valor === estado);
    return estado_encontrado?.etiqueta || estado;
  };

  const citaHaFinalizado = (cita: Cita): boolean => {
    const ahora = new Date();
    const fecha_inicio = new Date(cita.fecha);
    const fecha_fin = new Date(fecha_inicio);
    fecha_fin.setHours(fecha_fin.getHours() + (cita.horas_aproximadas || 0));
    fecha_fin.setMinutes(fecha_fin.getMinutes() + (cita.minutos_aproximados || 30));
    return ahora > fecha_fin;
  };

  const abrirDialogoConfirmarMateriales = async (cita: Cita) => {
    if (!cita.id) return;
    setCitaSeleccionada(cita);
    void cargarPlanTratamientoCita(cita.plan_tratamiento?.id ?? null);
    setCargandoMateriales(true);
    setEstadoPagoConfirmacion(cita.estado_pago || 'pendiente');
    setEstadoPagoConfirmacionInicial(cita.estado_pago || 'pendiente');
    const tasa = Number(cambio_dolar || 1);
    const localRaw = cita.monto_esperado;
    const usdRaw = (cita as any).monto_esperado_usd;
    const local = (localRaw ?? '') === null ? '' : (localRaw !== undefined && localRaw !== null ? String(localRaw) : '');
    const usd = (usdRaw ?? '') === null ? '' : (usdRaw !== undefined && usdRaw !== null ? String(usdRaw) : '');
    const localFinal = local !== '' ? local : (usd !== '' && !Number.isNaN(parseFloat(usd)) ? (parseFloat(usd) * tasa).toFixed(2) : '');
    const usdFinal = usd !== '' ? usd : (local !== '' && !Number.isNaN(parseFloat(local)) ? (parseFloat(local) / tasa).toFixed(2) : '');

    setMontoConfirmacion(localFinal);
    setMontoConfirmacionInicial(localFinal);
    setMontoConfirmacionUsd(usdFinal);
    setMontoConfirmacionUsdInicial(usdFinal);
    setAccionPagoConfirmacionOpcion('mantener');
    setConsumiblesConfirmacion([]);
    setConsumiblesConfirmacionInicial([]);
    try {
      await cargarInventarios();
      const respuesta = await inventarioApi.obtenerMaterialesCita(cita.id);
      const consumibles_mapeados: any[] = [];
      if (respuesta.materiales) {
        for (const reserva of respuesta.materiales) {
          const cant_planeada = parseFloat(reserva.cantidad_reservada?.toString() || '0');
          consumibles_mapeados.push({
            material_cita_id: reserva.id,
            inventario_id: reserva.material?.producto?.inventario?.id || 0,
            inventario_nombre: reserva.material?.producto?.inventario?.nombre || 'Desconocido',
            producto_id: reserva.material?.producto?.id || 0,
            producto_nombre: reserva.material?.producto?.nombre || 'Desconocido',
            material_id: reserva.material?.id || 0,
            nro_lote: reserva.material?.nro_lote,
            cantidad: cant_planeada,
            stock_disponible: Number(reserva.material?.cantidad_actual || 0),
            unidad_medida: reserva.material?.producto?.unidad_medida,
            permite_decimales: reserva.material?.producto?.permite_decimales || false
          });
        }
      }

      setConsumiblesConfirmacion(consumibles_mapeados);
      setConsumiblesConfirmacionInicial(consumibles_mapeados);
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

  const manejarConfirmarMateriales = async (confirmado_pago: boolean = false, accion_pago?: 'mantener' | 'reembolsar' | 'eliminar') => {
    if (!cita_seleccionada?.id) return;

    const estado_actual = (cita_seleccionada.estado_pago || '').toLowerCase();
    const nuevo_estado = (estado_pago_confirmacion || '').toLowerCase();
    const requiere_accion_pago = estado_actual === 'pagado' && (nuevo_estado === 'cancelado' || nuevo_estado === 'pendiente');
    const accion_cancelacion_pago = requiere_accion_pago ? (accion_pago ?? accion_pago_confirmacion_opcion) : undefined;

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
      const materiales_a_agregar = [];
      for (const m of consumibles_nuevos) {
        materiales_a_agregar.push({
          producto_id: m.producto_id,
          inventario_id: m.inventario_id,
          lote_id: m.material_id,
          cantidad_planeada: m.cantidad
        });
      }
      if (materiales_a_agregar.length > 0) {
        await inventarioApi.agregarMaterialesCita(cita_seleccionada.id, {
          materiales: materiales_a_agregar
        });
      }
      const materiales_a_confirmar = [];

      for (const m of consumibles_existentes) {
        if (m.material_cita_id) {
          materiales_a_confirmar.push({
            material_cita_id: m.material_cita_id,
            cantidad_usada: m.cantidad,
            lote_id: m.material_id,
            inventario_id: m.inventario_id
          });
        }
      }
      await inventarioApi.confirmarMaterialesCita(cita_seleccionada.id, {
        materiales: materiales_a_confirmar
      });

      toast({
        title: 'Éxito',
        description: 'Cita confirmada correctamente (estado, monto y materiales)',
      });

      setDialogoConfirmarMaterialesAbierto(false);
      void cargarDatos();
      recargarDialogoDiaSiAbierto();
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

  const elementos_del_dia: ElementoAgenda[] = useMemo(() => {
    if (mostrar_horas_libres) {
      return horas_libres
        .map(hora => ({ ...hora, es_hora_libre: true }))
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    }

    return (citas_dia || [])
      .slice()
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [mostrar_horas_libres, horas_libres, citas_dia]);

  const opciones_meses: OpcionCombobox[] = meses.map((m, idx) => ({
    valor: String(idx + 1),
    etiqueta: m,
  }));

  const opciones_anos: OpcionCombobox[] = useMemo(() => {
    const min = 2000;
    const max = 2100;
    const opciones: OpcionCombobox[] = [];
    for (let y = min; y <= max; y++) {
      opciones.push({ valor: String(y), etiqueta: String(y) });
    }
    return opciones;
  }, [ano_actual]);

  const actualizarFechaEnMesAno = (nuevo_mes: number, nuevo_ano: number) => {
    const dia_actual = fecha_seleccionada.getDate();
    const max_dias = new Date(nuevo_ano, nuevo_mes, 0).getDate();
    const nuevo_dia = Math.min(dia_actual, max_dias);
    const nueva_fecha = new Date(fecha_seleccionada);
    nueva_fecha.setFullYear(nuevo_ano, nuevo_mes - 1, nuevo_dia);
    nueva_fecha.setHours(0, 0, 0, 0);
    setFechaSeleccionada(nueva_fecha);
  };

  const cambiarMes = (delta: number) => {
    const base = new Date(ano_actual, mes_actual - 1, 1);
    base.setMonth(base.getMonth() + delta);
    const nuevo_mes = base.getMonth() + 1;
    const nuevo_ano = base.getFullYear();
    setMesActual(nuevo_mes);
    setAnoActual(nuevo_ano);
    actualizarFechaEnMesAno(nuevo_mes, nuevo_ano);
  };

  const formatearNombreDia = (date: Date) => {
    const texto = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };

  

  const requiere_accion_pago_edicion = modo_edicion && cita_seleccionada &&
    (cita_seleccionada.estado_pago || '').toLowerCase() === 'pagado' &&
    ((formulario.estado_pago || '').toLowerCase() === 'cancelado' || (formulario.estado_pago || '').toLowerCase() === 'pendiente');

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

  const esHoraLibre = (elemento: ElementoAgenda): elemento is HoraLibre & { es_hora_libre: true } => {
    return 'es_hora_libre' in elemento && elemento.es_hora_libre === true;
  };

  if (cargando_inicial) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando agenda...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProveedorTutorialesPagina
      pagina="/agenda"
      definicionesTutoriales={TUTORIALES_AGENDA}
      condicionesBloqueo={condicinesBloqueoTutoriales}
    >
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 flex flex-col gap-8 h-full min-h-0">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h1 id={IDS_ELEMENTOS_AGENDA.TITULO_PAGINA} className="text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
                  <TituloAccionable titulo="Agenda">Agenda</TituloAccionable>
                </h1>
                <TutorialModalWrapper tema="Agenda" />
                <p className="text-lg text-muted-foreground">
                  Gestiona tus citas y eventos
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="relative rounded-lg border border-border bg-background/60 px-3 py-2">
                  <div className="absolute -top-2 left-3 bg-background px-2 text-[11px] font-semibold text-muted-foreground">
                    Ir A
                  </div>

                  <div className="flex items-center gap-2">
                    <Combobox
                      opciones={opciones_meses}
                      valor={String(mes_actual)}
                      onChange={(valor) => {
                        const nuevo_mes = Number(valor || mes_actual);
                        if (!nuevo_mes) return;
                        setMesActual(nuevo_mes);
                        actualizarFechaEnMesAno(nuevo_mes, ano_actual);
                      }}
                      placeholder="Mes"
                      disabled={mostrar_horas_libres || cargando_mes}
                      className="w-[160px]"
                      idTrigger="agenda-combobox-mes"
                    />
                    <Combobox
                      opciones={opciones_anos}
                      valor={String(ano_actual)}
                      onChange={(valor) => {
                        const nuevo_ano = Number(valor || ano_actual);
                        if (!nuevo_ano) return;
                        setAnoActual(nuevo_ano);
                        actualizarFechaEnMesAno(mes_actual, nuevo_ano);
                      }}
                      placeholder="Año"
                      disabled={mostrar_horas_libres || cargando_mes}
                      className="w-[120px]"
                      idTrigger="agenda-combobox-ano"
                    />
                  </div>
                </div>

                <Button
                  id={IDS_ELEMENTOS_AGENDA.BTN_NUEVA_CITA}
                  size="lg"
                  className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                  onClick={() => abrirDialogoNuevo()}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Nueva Cita
                </Button>
              </div>
            </div>

            <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300 flex flex-col flex-1 min-h-0">
              <CardContent id="agenda-lista-elementos" className="flex-1 min-h-0 p-0">
                <div className="h-full rounded-lg border border-border bg-background p-2 sm:p-3">
                  <div className="relative h-full">
                    <Button
                      id={IDS_ELEMENTOS_AGENDA.BTN_MES_ANTERIOR}
                      variant="ghost"
                      size="icon"
                      onClick={() => cambiarMes(-1)}
                      disabled={mostrar_horas_libres || cargando_mes}
                      title="Anterior mes"
                      className="absolute left-1 top-1/2 -translate-y-1/2 z-10 border-2 border-border bg-background/85 shadow-md hover:shadow-lg hover:bg-accent hover:text-accent-foreground active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>

                    <Button
                      id={IDS_ELEMENTOS_AGENDA.BTN_MES_SIGUIENTE}
                      variant="ghost"
                      size="icon"
                      onClick={() => cambiarMes(1)}
                      disabled={mostrar_horas_libres || cargando_mes}
                      title="Siguiente mes"
                      className="absolute right-1 top-1/2 -translate-y-1/2 z-10 border-2 border-border bg-background/85 shadow-md hover:shadow-lg hover:bg-accent hover:text-accent-foreground active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>

                    {cargando_mes ? (
                      <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/60">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      </div>
                    ) : null}

                    <div id="agenda-calendario" className="h-full px-10">
                      <CalendarioUI
                        onDayClick={(date) => {
                          abrirDialogoDia(date);
                        }}
                        fixedWeeks
                        month={new Date(ano_actual, mes_actual - 1, 1)}
                        disabled={mostrar_horas_libres}
                        locale={es}
                        weekStartsOn={1}
                        formatters={{
                          formatWeekdayName: (date) => formatearNombreDia(date),
                        }}
                        className="w-full h-full p-0 [&_.rdp-month_grid]:h-full [&_.rdp-weeks]:h-full [&_.rdp-week]:h-[calc(100%/6)] [&_.rdp-day]:h-full [&_.rdp-day_button]:h-full"
                        components={{ DayButton: AgendaDayButton }}
                        classNames={{
                          root: 'w-full h-full',
                          months: 'w-full h-full',
                          month: 'w-full h-full flex flex-col gap-2',
                          month_caption: 'hidden',
                          nav: 'hidden',
                          month_grid: 'rdp-month_grid w-full flex-1 border-collapse flex flex-col',
                          table: 'rdp-month_grid w-full flex-1 border-collapse flex flex-col',

                          weekdays: 'rdp-weekdays grid grid-cols-7 w-full gap-1 shrink-0',
                          weekday: 'rdp-weekday text-center rounded-md bg-secondary/40 text-foreground py-1.5 text-xs sm:text-sm font-medium',
                          head_row: 'rdp-weekdays grid grid-cols-7 w-full gap-1 shrink-0',
                          head_cell: 'rdp-weekday text-center rounded-md bg-secondary/40 text-foreground py-1.5 text-xs sm:text-sm font-medium',

                          weeks: 'rdp-weeks flex flex-col flex-1 gap-1',
                          tbody: 'rdp-weeks flex flex-col flex-1 gap-1',
                          week: 'rdp-week grid grid-cols-7 w-full gap-1 flex-1',
                          row: 'rdp-week grid grid-cols-7 w-full gap-1 flex-1',

                          day: 'rdp-day p-0 relative h-full w-full font-normal',
                          cell: 'rdp-day p-0 relative h-full w-full font-normal',
                          day_button: 'rdp-day_button aspect-auto h-full w-full rounded-md text-[0.95rem] sm:text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors data-[selected-single=true]:bg-primary/10 data-[selected-single=true]:text-foreground data-[selected-single=true]:ring-1 data-[selected-single=true]:ring-primary/40',
                          today: 'rounded-md',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog
          open={dialogo_dia_abierto}
          onOpenChange={(abierto) => {
            setDialogoDiaAbierto(abierto);
            if (!abierto) {
              setMostrarHorasLibres(false);
              setErrorCitasDia(null);
              setCitasDia([]);
              setCargandoCitasDia(false);
            } else if (!mostrar_horas_libres) {
              void cargarCitasDia(fecha_seleccionada);
            } else {
              void cargarHorasLibres(fecha_seleccionada);
            }
          }}
        >
          <DialogContent
            className="max-w-5xl w-[95vw] h-[90vh] overflow-hidden flex flex-col"
          >
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center gap-3 min-w-0">
                <CalendarIcon className="h-5 w-5 text-primary shrink-0" />
                <span className="truncate">{formatearFecha(fecha_seleccionada)}</span>
                <Badge variant="secondary" className="shrink-0 text-base px-3 py-1">
                  {mostrar_horas_libres
                    ? `${elementos_del_dia.length} libre${elementos_del_dia.length === 1 ? '' : 's'}`
                    : `${elementos_del_dia.length} cita${elementos_del_dia.length === 1 ? '' : 's'}`}
                </Badge>
              </DialogTitle>
              <DialogDescription className="sr-only">
                {mostrar_horas_libres
                  ? 'Horas libres del día seleccionado.'
                  : 'Citas del día seleccionado.'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
              <div className="flex gap-2">
                <Button
                  id="agenda-btn-dia-anterior"
                  variant="outline"
                  size="icon"
                  onClick={() => cambiarDiaEnDialogo(-1)}
                  disabled={cargando_citas_dia}
                  className="hover:bg-primary/20 hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Día anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  id={IDS_ELEMENTOS_AGENDA.BTN_HOY}
                  variant="outline"
                  onClick={irHoyEnDialogo}
                  disabled={cargando_citas_dia}
                  className="hover:bg-primary/20 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hoy
                </Button>
                <Button
                  id="agenda-btn-dia-siguiente"
                  variant="outline"
                  size="icon"
                  onClick={() => cambiarDiaEnDialogo(1)}
                  disabled={cargando_citas_dia}
                  className="hover:bg-primary/20 hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Día siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex items-center gap-2">
                  <Label htmlFor={IDS_ELEMENTOS_AGENDA.SWITCH_HORAS_LIBRES} className="text-sm font-medium cursor-pointer">
                    {mostrar_horas_libres ? 'Ver Citas' : 'Ver Horas Libres'}
                  </Label>
                  <Switch
                    id={IDS_ELEMENTOS_AGENDA.SWITCH_HORAS_LIBRES}
                    checked={mostrar_horas_libres}
                    onCheckedChange={setMostrarHorasLibres}
                  />
                </div>

                <Button
                  id="agenda-btn-agregar-cita-dia"
                  size="sm"
                  onClick={() => abrirDialogoNuevo(fecha_seleccionada)}
                  className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar cita
                </Button>
              </div>
            </div>

            <div className="flex-1 rounded-lg border border-border bg-background/40 overflow-hidden">
              <div id="agenda-dialogo-lista-elementos" className="h-full overflow-y-auto p-2 sm:p-3 pr-1 sm:pr-2">
                {cargando_citas_dia ? (
                  <div className="text-center py-12 space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">
                      {mostrar_horas_libres ? 'Cargando horas libres...' : 'Cargando citas...'}
                    </p>
                  </div>
                ) : error_citas_dia ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">No se pudieron cargar los datos</p>
                        <p className="text-sm text-muted-foreground">{error_citas_dia}</p>
                      </div>
                    </div>
                  </div>
                ) : elementos_del_dia.length === 0 ? (
                  <div className="flex h-full min-h-[280px] items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                      <div className="w-14 h-14 bg-secondary/50 rounded-full flex items-center justify-center">
                        <Clock className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {mostrar_horas_libres ? 'No hay horas libres disponibles este día' : 'No hay citas para este día'}
                      </p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {mostrar_horas_libres
                          ? 'Todas las horas están ocupadas con citas programadas.'
                          : 'Puedes crear una nueva cita para esta fecha.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {elementos_del_dia.map((elemento, idx) => {
                  if (esHoraLibre(elemento)) {
                    return (
                      <div
                        key={`libre-${idx}`}
                        data-agenda-hora-libre="true"
                        onClick={() => abrirDialogoDesdeHoraLibre(elemento)}
                        className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-500/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                              <CalendarClock className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {formatearHora(elemento.fecha)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Hora libre - Clic para agendar
                              </p>
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <p className="text-sm text-foreground break-words whitespace-normal">{elemento.descripcion}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Duración disponible: {formatearDuracion(elemento.horas_aproximadas, elemento.minutos_aproximados)}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-500 text-white hover:scale-110 transition-transform duration-200">
                            Disponible
                          </Badge>
                        </div>
                      </div>
                    );
                  }

                  const cita = elemento as Cita;
                  const es_confirmada = cita.materiales_confirmados;
                  const es_pasada = citaHaFinalizado(cita);
                  const esta_ocurriendo = citaEstaOcurriendo(cita);
                  const sin_paciente_pasada = es_pasada && !cita.paciente;
                  const debe_estar_opaca = es_confirmada || sin_paciente_pasada;

                  const debe_cerrarse = es_pasada && !!cita.paciente && !es_confirmada;
                  const permite_eye = !modo_edicion_historica_activo && (es_confirmada || sin_paciente_pasada);
                  const permite_confirmar = debe_cerrarse;
                  const permite_editar = modo_edicion_historica_activo
                    ? true
                    : (!es_pasada && !es_confirmada);
                  const permite_eliminar = modo_edicion_historica_activo
                    ? true
                    : (!es_pasada && !esta_ocurriendo && !es_confirmada);

                  return (
                    <div
                      key={cita.id}
                      className={`flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 hover:scale-[1.02] hover:shadow-md transition-all duration-200 ${debe_estar_opaca ? 'opacity-60 grayscale-[0.3]' : ''}`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {cita.paciente?.color_categoria && (
                          <div
                            className="w-1 h-12 rounded-full"
                            style={{ backgroundColor: cita.paciente.color_categoria }}
                          />
                        )}
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {formatearHora(cita.fecha)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {cita.paciente
                                ? `${cita.paciente.nombre} ${cita.paciente.apellidos}`
                                : 'Evento general'}
                            </p>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm text-foreground break-words whitespace-normal">{cita.descripcion}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Duración: {formatearDuracion(cita.horas_aproximadas, cita.minutos_aproximados)}
                            </p>
                            {cita.paciente && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Coins className="h-3 w-3" />
                                Monto esperado:{' '}
                                {config_clinica?.trabajar_con === 'usd'
                                  ? <>USD {Number((cita as any).monto_esperado_usd || 0).toFixed(2)}</>
                                  : formatearMonedaJSX(cita.monto_esperado || 0)}
                              </p>
                            )}
                            {es_confirmada && (
                              <Badge className="bg-green-500 text-white text-xs">
                                Confirmada
                              </Badge>
                            )}
                            {sin_paciente_pasada && (
                              <Badge variant="secondary" className="text-xs">
                                Finalizada
                              </Badge>
                            )}
                          </div>
                        </div>
                        {cita.paciente && (
                          <Badge className={`${obtenerColorEstado(cita.estado_pago)} text-white hover:scale-110 transition-transform duration-200`}>
                            {obtenerEtiquetaEstado(cita.estado_pago)}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        {permite_eye && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirDialogoVer(cita, esta_ocurriendo ? 'ocurriendo' : 'finalizada')}
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
                            onClick={() => abrirDialogoConfirmarMateriales(cita)}
                            className="hover:bg-green-500/20 hover:text-green-600 hover:scale-110 transition-all duration-200 ring-2 ring-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                            title="Confirmar Cita (Estado, Monto y Materiales)"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}

                        {permite_editar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirDialogoEditar(cita)}
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
                            onClick={() => abrirDialogoConfirmarEliminar(cita.id)}
                            className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                    })}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar esta cita?
              </DialogDescription>
            </DialogHeader>

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
                }}
                className="hover:scale-105 transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={manejarEliminar}
                className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DialogoGestionCita
          abierto={dialogo_abierto}
          onCerrar={() => {
            setBloquearSelectorFechaGestion(false);
            setSoloVisualizarGestion(false);
            setMensajeVisualizacionGestion(null);
            setRecursosSoloLecturaGestion(false);
            handleOpenChangeGestion(false);
          }}
          modoEdicion={modo_edicion}
          soloVisualizar={solo_visualizar_gestion}
          mensajeVisualizacion={mensaje_visualizacion_gestion}
          recursosSoloLectura={recursos_solo_lectura_gestion}
          bloquearSelectorFecha={bloquear_selector_fecha_gestion}
          formulario={formulario}
          planTratamiento={plan_tratamiento_cita}
          tienePlanTratamiento={!!plan_tratamiento_id_cita}
          cargandoPlanTratamiento={cargando_plan_tratamiento_cita}
          setFormulario={setFormulario}
          pacientes={pacientes}
          inventarios={inventarios}
          productosPorInventario={productos_por_inventario}
          cargarInventarios={cargarInventarios}
          cargarProductosInventario={cargarProductosInventario}
          consumiblesSeleccionados={consumibles_seleccionados}
          setConsumiblesSeleccionados={setConsumiblesSeleccionados}
          guardando={guardando}
          hayCambios={hay_cambios}
          manejarGuardar={manejarGuardar}
          opcionesEstadosPago={estados_pago}
          pacienteDeshabilitado={!!plan_tratamiento_id_cita}
          accionPagoUI={
            requiere_accion_pago_edicion ? renderSelectorAccionPago(accion_pago_edicion, setAccionPagoEdicion, 'edicion') : null
          }
        />

        { }
        <DialogoConfirmacionCita
          abierto={dialogo_confirmar_materiales_abierto}
          onCerrar={() => handleOpenChangeConfirmacion(false)}
          estadoPago={estado_pago_confirmacion}
          planTratamiento={plan_tratamiento_cita}
          tienePlanTratamiento={!!plan_tratamiento_id_cita}
          cargandoPlanTratamiento={cargando_plan_tratamiento_cita}
          setEstadoPago={setEstadoPagoConfirmacion}
          montoLocal={monto_confirmacion}
          montoUSD={monto_confirmacion_usd}
          onMontoChange={(local, usd) => {
            setMontoConfirmacion(local);
            setMontoConfirmacionUsd(usd);
          }}
          consumibles={consumibles_confirmacion}
          setConsumibles={setConsumiblesConfirmacion}
          inventarios={inventarios}
          productosPorInventario={productos_por_inventario}
          cargarProductosInventario={cargarProductosInventario}
          cargandoMateriales={cargando_materiales}
          guardando={guardando}
          manejarConfirmar={manejarConfirmarMateriales}
          opcionesEstadosPago={estados_pago}
          accionPagoUI={
            requiere_accion_pago_confirmacion ? renderSelectorAccionPago(accion_pago_confirmacion_opcion, setAccionPagoConfirmacionOpcion, 'confirmacion') : null
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
                    manejarGuardar(true, 'eliminar');
                  } else if (contexto_eliminar_pago === 'confirmacion') {
                    manejarConfirmarMateriales(true, 'eliminar');
                  }
                  setContextoEliminarPago(null);
                }}
              >
                Sí, eliminar pago
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={closeConfirmationPropsGestion.open} onOpenChange={closeConfirmationPropsGestion.onOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
              <AlertDialogDescription>
                Tienes cambios sin guardar. Si cierras ahora, se perderán todos los cambios.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeConfirmationPropsGestion.onCancel}>Continuar editando</AlertDialogCancel>
              <AlertDialogAction onClick={closeConfirmationPropsGestion.onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Descartar cambios
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={closeConfirmationPropsConfirmacion.open} onOpenChange={closeConfirmationPropsConfirmacion.onOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Descartar cambios en la confirmación?</AlertDialogTitle>
              <AlertDialogDescription>
                Tienes cambios sin guardar en la confirmación de la cita. Si cierras ahora, se perderán los cambios en estado, monto o materiales.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeConfirmationPropsConfirmacion.onCancel}>Continuar editando</AlertDialogCancel>
              <AlertDialogAction onClick={closeConfirmationPropsConfirmacion.onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Descartar cambios
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Toaster />
      </div>
    </ProveedorTutorialesPagina>
  );
}
