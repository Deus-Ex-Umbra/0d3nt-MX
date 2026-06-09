import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog';
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
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, Plus, FileText, Loader2, AlertCircle, Edit, Trash2, BarChart3, ChevronLeft, ChevronRight, LineChart as LineChartIcon, Search } from 'lucide-react';
import { finanzasApi, agendaApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Combobox, OpcionCombobox } from '@/componentes/ui/combobox';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { serializarFechaHoraParaApi } from '@/lib/utilidades';
import { useMoneda } from '@/hooks/use-moneda';
import { useClinica } from '@/contextos/clinica-contexto';
import InputMoneda from '@/componentes/ui/input-moneda';
import { Movimiento, ReporteFinanzas, DatosGrafico } from '@/tipos';
import { ReferenciaCitaTratamiento } from '@/componentes/finanzas/referencia-cita-tratamiento';
import { useReferenciasMovimientos } from '@/componentes/finanzas/use-referencias-movimientos';

interface CitaFinanzas {
  id: number;
  fecha: Date;
  descripcion: string;
  monto_esperado: number;
  monto_esperado_usd?: number;
  estado_pago: string;
  paciente?: {
    nombre: string;
    apellidos: string;
  };
  plan_tratamiento?: {
    id: number;
  };
}

export function FinanzasMovimientos() {
  const { config_clinica } = useClinica();
  const cambio_dolar = config_clinica.cambio_dolar || 1;
  const usarUSD = config_clinica.trabajar_con === 'usd';
  const { formatearMoneda, formatearMonedaJSX } = useMoneda();
  const [reporte, setReporte] = useState<ReporteFinanzas | null>(null);

  const { citasPorId, planesPorId } = useReferenciasMovimientos(reporte?.movimientos || []);

  const normalizarMonto = (monto: unknown): number => {
    if (typeof monto === 'number') return Number.isFinite(monto) ? monto : 0;
    if (typeof monto === 'string') {
      const limpio = monto.trim().replace(/\s+/g, '').replace(/,/g, '');
      if (!limpio) return 0;
      const n = Number(limpio);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const formatearValor = (monto?: unknown) => {
    const n = normalizarMonto(monto);
    if (usarUSD) return `$ ${n.toFixed(2)}`;
    return formatearMoneda(n);
  };

  const obtenerClaseTamano = (monto?: number) => {
    const texto = formatearValor(monto);
    const len = texto.length;
    if (len > 25) return "text-sm";
    if (len > 21) return "text-base";
    if (len > 18) return "text-lg";
    if (len > 15) return "text-xl";
    if (len > 12) return "text-2xl";
    return "text-3xl";
  };

  const formatearValorJSX = (monto?: unknown) => {
    const n = normalizarMonto(monto);
    if (usarUSD) return <>{`$ ${n.toFixed(2)}`}</>;
    return <>{formatearMonedaJSX(n)}</>;
  };

  const [todos_movimientos, setTodosMovimientos] = useState<Movimiento[]>([]);
  const [datos_grafico, setDatosGrafico] = useState<DatosGrafico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargando_grafico, setCargandoGrafico] = useState(false);

  const [dialogo_ingreso_abierto, setDialogoIngresoAbierto] = useState(false);
  const [dialogo_egreso_abierto, setDialogoEgresoAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [guardando_ingreso, setGuardandoIngreso] = useState(false);
  const [guardando_egreso, setGuardandoEgreso] = useState(false);
  const [modo_edicion_ingreso, setModoEdicionIngreso] = useState(false);
  const [modo_edicion_egreso, setModoEdicionEgreso] = useState(false);
  const [movimiento_seleccionado, setMovimientoSeleccionado] = useState<Movimiento | null>(null);
  const [movimiento_a_eliminar, setMovimientoAEliminar] = useState<Movimiento | null>(null);

  const [citas, setCitas] = useState<CitaFinanzas[]>([]);
  const [cargando_datos, setCargandoDatos] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [tipo_grafico, setTipoGrafico] = useState<'dia' | 'mes' | 'ano'>('mes');
  const [fecha_grafico, setFechaGrafico] = useState(new Date());
  const [modo_grafico, setModoGrafico] = useState<'ingresos-egresos' | 'balance'>('ingresos-egresos');
  const [tipo_visualizacion, setTipoVisualizacion] = useState<'barras' | 'lineas'>('barras');
  const [tipo_balance, setTipoBalance] = useState<'simple' | 'area'>('simple');

  const [formulario_ingreso, setFormularioIngreso] = useState({
    cita_id: '',
    concepto: '',
    fecha: new Date(),
    monto: '',
    monto_usd: '',
  });

  const [formulario_ingreso_inicial, setFormularioIngresoInicial] = useState({
    cita_id: '',
    concepto: '',
    fecha: new Date(),
    monto: '',
    monto_usd: '',
  });

  const [dialogo_confirmar_cerrar_ingreso, setDialogoConfirmarCerrarIngreso] = useState(false);

  const [formulario_egreso, setFormularioEgreso] = useState({
    concepto: '',
    fecha: new Date(),
    monto: '',
    monto_usd: '',
  });

  const [formulario_egreso_inicial, setFormularioEgresoInicial] = useState({
    concepto: '',
    fecha: new Date(),
    monto: '',
    monto_usd: '',
  });

  const [dialogo_confirmar_cerrar_egreso, setDialogoConfirmarCerrarEgreso] = useState(false);

  useEffect(() => {
    cargarMovimientos();
  }, []);

  useEffect(() => {
    filtrarMovimientosLocalmente();
  }, [busqueda, todos_movimientos]);

  useEffect(() => {
    cargarDatosGrafico();
  }, []);

  useEffect(() => {
    cargarDatosGrafico();
  }, [tipo_grafico, fecha_grafico]);

  const filtrarMovimientosLocalmente = () => {
    if (!busqueda.trim()) {
      setReporte(prev => prev ? { ...prev, movimientos: todos_movimientos } : null);
      return;
    }

    const termino = busqueda.toLowerCase();
    const filtrados = todos_movimientos.filter(mov =>
      mov.concepto?.toLowerCase().includes(termino)
    );

    setReporte(prev => prev ? { ...prev, movimientos: filtrados } : null);
  };

  const cargarMovimientos = async () => {
    setCargando(true);
    try {
      const hoy = new Date();
      const inicio_ano = new Date(hoy.getFullYear(), 0, 1);
      inicio_ano.setHours(0, 0, 0, 0);
      const fin_ano = new Date(hoy.getFullYear(), 11, 31);
      fin_ano.setHours(23, 59, 59, 999);
      const inicio_ano_str = serializarFechaHoraParaApi(inicio_ano);
      const fin_ano_str = serializarFechaHoraParaApi(fin_ano);
      const inicio_hoy = new Date(hoy);
      inicio_hoy.setHours(0, 0, 0, 0);
      const fin_hoy = new Date(hoy);
      fin_hoy.setHours(23, 59, 59, 999);
      const inicio_hoy_str = serializarFechaHoraParaApi(inicio_hoy);
      const fin_hoy_str = serializarFechaHoraParaApi(fin_hoy);
      const datos_ano = await finanzasApi.obtenerReporte(inicio_ano_str, fin_ano_str);
      const datos_hoy = await finanzasApi.obtenerReporte(inicio_hoy_str, fin_hoy_str);
      setReporte({
        total_ingresos: datos_ano.total_ingresos,
        total_egresos: datos_ano.total_egresos,
        balance: datos_ano.balance,
        total_ingresos_usd: datos_ano.total_ingresos_usd,
        total_egresos_usd: datos_ano.total_egresos_usd,
        balance_usd: datos_ano.balance_usd,
        movimientos: datos_hoy.movimientos || [],
      });
      setTodosMovimientos(datos_hoy.movimientos || []);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los movimientos',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarDatosGrafico = async () => {
    setCargandoGrafico(true);
    try {
      const fecha_local = new Date(fecha_grafico);
      const fecha_noon = new Date(
        fecha_local.getFullYear(),
        fecha_local.getMonth(),
        fecha_local.getDate(),
        12,
        0,
        0,
        0,
      );
      const fecha_str = serializarFechaHoraParaApi(fecha_noon);

      const datos: DatosGrafico[] = await finanzasApi.obtenerDatosGrafico(tipo_grafico, fecha_str);
      setDatosGrafico(datos);
    } catch (error) {
      console.error('Error al cargar datos del gráfico:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del gráfico',
        variant: 'destructive',
      });
    } finally {
      setCargandoGrafico(false);
    }
  };

  const cargarCitasSinPago = async () => {
    setCargandoDatos(true);
    try {
      const datos_citas = await agendaApi.obtenerCitasSinPago();
      setCitas(datos_citas);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setCargandoDatos(false);
    }
  };

  const abrirDialogoIngreso = () => {
    const estadoInicial = {
      cita_id: '',
      concepto: '',
      fecha: new Date(),
      monto: '',
      monto_usd: '',
    };
    setFormularioIngreso(estadoInicial);
    setFormularioIngresoInicial(estadoInicial);
    setModoEdicionIngreso(false);
    setMovimientoSeleccionado(null);
    cargarCitasSinPago();
    setDialogoIngresoAbierto(true);
  };

  const abrirDialogoEgreso = () => {
    const estadoInicial = {
      concepto: '',
      fecha: new Date(),
      monto: '',
      monto_usd: '',
    };
    setFormularioEgreso(estadoInicial);
    setFormularioEgresoInicial(estadoInicial);
    setModoEdicionEgreso(false);
    setMovimientoSeleccionado(null);
    setDialogoEgresoAbierto(true);
  };

  const abrirEditarIngreso = (movimiento: Movimiento) => {
    const estadoInicial = {
      cita_id: movimiento.cita_id?.toString() || '',
      concepto: movimiento.concepto || '',
      fecha: new Date(movimiento.fecha),
      monto: movimiento.monto.toString(),
      monto_usd: movimiento.monto_usd?.toString() || '',
    };
    setFormularioIngreso(estadoInicial);
    setFormularioIngresoInicial(estadoInicial);
    setModoEdicionIngreso(true);
    setMovimientoSeleccionado(movimiento);
    setDialogoIngresoAbierto(true);
  };

  const abrirEditarEgreso = (movimiento: Movimiento) => {
    const estadoInicial = {
      concepto: movimiento.concepto || '',
      fecha: new Date(movimiento.fecha),
      monto: movimiento.monto.toString(),
      monto_usd: movimiento.monto_usd?.toString() || '',
    };
    setFormularioEgreso(estadoInicial);
    setFormularioEgresoInicial(estadoInicial);
    setModoEdicionEgreso(true);
    setMovimientoSeleccionado(movimiento);
    setDialogoEgresoAbierto(true);
  };

  const manejarRegistrarIngreso = async () => {
    if (!formulario_ingreso.concepto || !formulario_ingreso.fecha || !formulario_ingreso.monto) {
      toast({
        title: 'Error',
        description: 'Concepto, fecha y monto son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    const monto = parseFloat(formulario_ingreso.monto);
    const monto_usd = parseFloat(formulario_ingreso.monto_usd || '0');
    if (isNaN(monto) || monto <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser un número positivo',
        variant: 'destructive',
      });
      return;
    }

    setGuardandoIngreso(true);
    try {
      if (modo_edicion_ingreso && movimiento_seleccionado) {
        const datos: any = {
          fecha: formulario_ingreso.fecha,
          monto,
          monto_usd,
          tasa_cambio: Number(cambio_dolar),
          concepto: formulario_ingreso.concepto,
        };

        await finanzasApi.actualizarPago(movimiento_seleccionado.id, datos);
        toast({
          title: 'Éxito',
          description: 'Ingreso actualizado correctamente',
        });
      } else {
        const datos: any = {
          fecha: formulario_ingreso.fecha,
          monto,
          monto_usd,
          tasa_cambio: Number(cambio_dolar),
          concepto: formulario_ingreso.concepto,
        };

        if (formulario_ingreso.cita_id) {
          datos.cita_id = parseInt(formulario_ingreso.cita_id);
        }

        await finanzasApi.registrarPago(datos);
        toast({
          title: 'Éxito',
          description: formulario_ingreso.cita_id
            ? 'Ingreso registrado correctamente. La cita se marcó como pagada.'
            : 'Ingreso registrado correctamente.',
        });
      }

      setDialogoIngresoAbierto(false);
      await cargarMovimientos();
      cargarDatosGrafico();
    } catch (error: any) {
      console.error('Error al registrar ingreso:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo registrar el ingreso',
        variant: 'destructive',
      });
    } finally {
      setGuardandoIngreso(false);
    }
  };

  const manejarRegistrarEgreso = async () => {
    if (!formulario_egreso.concepto || !formulario_egreso.fecha || !formulario_egreso.monto) {
      toast({
        title: 'Error',
        description: 'Todos los campos son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    const monto = parseFloat(formulario_egreso.monto);
    const monto_usd = parseFloat(formulario_egreso.monto_usd || '0');
    if (isNaN(monto) || monto <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser un número positivo',
        variant: 'destructive',
      });
      return;
    }

    setGuardandoEgreso(true);
    try {
      if (modo_edicion_egreso && movimiento_seleccionado) {
        const datos: any = {
          concepto: formulario_egreso.concepto,
          fecha: formulario_egreso.fecha,
          monto,
          monto_usd,
          tasa_cambio: Number(cambio_dolar)
        };

        await finanzasApi.actualizarEgreso(movimiento_seleccionado.id, datos);
        toast({
          title: 'Éxito',
          description: 'Egreso actualizado correctamente',
        });
      } else {
        const datos: any = {
          concepto: formulario_egreso.concepto,
          fecha: formulario_egreso.fecha,
          monto,
          monto_usd,
          tasa_cambio: Number(cambio_dolar)
        };

        await finanzasApi.registrarEgreso(datos);
        toast({
          title: 'Éxito',
          description: 'Egreso registrado correctamente',
        });
      }

      setDialogoEgresoAbierto(false);
      await cargarMovimientos();
      cargarDatosGrafico();
    } catch (error: any) {
      console.error('Error al registrar egreso:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo registrar el egreso',
        variant: 'destructive',
      });
    } finally {
      setGuardandoEgreso(false);
    }
  };

  const abrirDialogoConfirmarEliminar = (movimiento: Movimiento) => {
    setMovimientoAEliminar(movimiento);
    setDialogoConfirmarEliminarAbierto(true);
  };

  const confirmarEliminarMovimiento = async () => {
    if (!movimiento_a_eliminar) return;

    try {
      if (movimiento_a_eliminar.tipo === 'ingreso') {
        await finanzasApi.eliminarPago(movimiento_a_eliminar.id);
      } else {
        await finanzasApi.eliminarEgreso(movimiento_a_eliminar.id);
      }

      toast({
        title: 'Éxito',
        description: `${movimiento_a_eliminar.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} eliminado correctamente`,
      });

      setDialogoConfirmarEliminarAbierto(false);
      setMovimientoAEliminar(null);
      await cargarMovimientos();
      cargarDatosGrafico();
    } catch (error: any) {
      console.error('Error al eliminar movimiento:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'No se pudo eliminar el movimiento',
        variant: 'destructive',
      });
    }
  };

  const cambiarFechaGrafico = (direccion: number) => {
    const nueva_fecha = new Date(fecha_grafico);

    if (tipo_grafico === 'dia') {
      nueva_fecha.setDate(nueva_fecha.getDate() + direccion);
    } else if (tipo_grafico === 'mes') {
      nueva_fecha.setMonth(nueva_fecha.getMonth() + direccion);
    } else {
      nueva_fecha.setFullYear(nueva_fecha.getFullYear() + direccion);
    }

    setFechaGrafico(nueva_fecha);
  };

  const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const obtenerTituloGrafico = (): string => {
    const f = fecha_grafico;
    const dia = String(f.getDate()).padStart(2, '0');
    const mesLargo = MESES_LARGOS[f.getMonth()] ?? '';
    const anio = f.getFullYear();

    if (tipo_grafico === 'dia') {
      return `${dia} ${mesLargo} ${anio}`.trim();
    } else if (tipo_grafico === 'mes') {
      return `${mesLargo} ${anio}`.trim();
    } else {
      return anio.toString();
    }
  };


  const formatearHora = (fecha: Date): string => {
    const f = new Date(fecha);
    const horas = String(f.getHours()).padStart(2, '0');
    const minutos = String(f.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  };

  const formatearFechaHora = (fecha: Date): string => {
    const f = new Date(fecha);
    const dia = String(f.getDate()).padStart(2, '0');
    const mes = MESES_CORTOS[f.getMonth()] ?? '';
    const anio = f.getFullYear();
    const horas = String(f.getHours()).padStart(2, '0');
    const minutos = String(f.getMinutes()).padStart(2, '0');
    return `${dia} ${mes} ${anio} ${horas}:${minutos}`.trim();
  };

  const formatearFechaCita = (fecha: Date): string => {
    const f = new Date(fecha);
    const dia = String(f.getDate()).padStart(2, '0');
    const mes = MESES_CORTOS[f.getMonth()] ?? '';
    const anio = f.getFullYear();
    const horas = String(f.getHours()).padStart(2, '0');
    const minutos = String(f.getMinutes()).padStart(2, '0');
    return `${dia} ${mes} ${anio} ${horas}:${minutos}`.trim();
  };

  const opciones_citas: OpcionCombobox[] = [
    { valor: '', etiqueta: 'Ingreso sin cita asociada' },
    ...citas.map(c => ({
      valor: c.id.toString(),
      etiqueta: `${formatearFechaCita(c.fecha)} - ${c.paciente ? `${c.paciente.nombre} ${c.paciente.apellidos}` : c.descripcion} - ${formatearValor(usarUSD ? (c.monto_esperado_usd || (c.monto_esperado / cambio_dolar)) : c.monto_esperado || 0)}`
    }))
  ];

  const hayCambiosIngreso = useCallback(() => {
    return JSON.stringify(formulario_ingreso) !== JSON.stringify(formulario_ingreso_inicial);
  }, [formulario_ingreso, formulario_ingreso_inicial]);

  const hayCambiosEgreso = useCallback(() => {
    return JSON.stringify(formulario_egreso) !== JSON.stringify(formulario_egreso_inicial);
  }, [formulario_egreso, formulario_egreso_inicial]);

  const handleIntentarCerrarIngreso = () => {
    if (hayCambiosIngreso()) {
      setDialogoConfirmarCerrarIngreso(true);
    } else {
      setDialogoIngresoAbierto(false);
    }
  };

  const handleConfirmarCerrarIngreso = () => {
    setDialogoConfirmarCerrarIngreso(false);
    setDialogoIngresoAbierto(false);
  };

  const handleIntentarCerrarEgreso = () => {
    if (hayCambiosEgreso()) {
      setDialogoConfirmarCerrarEgreso(true);
    } else {
      setDialogoEgresoAbierto(false);
    }
  };

  const handleConfirmarCerrarEgreso = () => {
    setDialogoConfirmarCerrarEgreso(false);
    setDialogoEgresoAbierto(false);
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando movimientos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {busqueda ? 'Resultados de Búsqueda' : 'Movimientos'}
          </h2>
          <p className="text-muted-foreground">
            {busqueda ? `Mostrando resultados para "${busqueda}"` : 'Resumen financiero'}
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={dialogo_ingreso_abierto} onOpenChange={setDialogoIngresoAbierto}>
            <DialogTrigger asChild>
              <Button
                id="btn-finanzas-registrar-ingreso"
                size="lg"
                onClick={abrirDialogoIngreso}
                className="shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105 transition-all duration-200 bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Registrar Ingreso
              </Button>
            </DialogTrigger>
          </Dialog>

          <Dialog open={dialogo_egreso_abierto} onOpenChange={setDialogoEgresoAbierto}>
            <DialogTrigger asChild>
              <Button
                id="btn-finanzas-registrar-egreso"
                size="lg"
                variant="destructive"
                onClick={abrirDialogoEgreso}
                className="shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Registrar Egreso
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <div id="finanzas-resumen-ano" className="grid gap-6 md:grid-cols-3">
        <Card id="finanzas-card-ingresos-ano" className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Ingresos (Este Año)
            </CardTitle>
            <div className="bg-green-500/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${obtenerClaseTamano(usarUSD ? reporte?.total_ingresos_usd : reporte?.total_ingresos)} font-bold text-green-500 transition-all duration-300`}>
              {formatearValorJSX(usarUSD ? reporte?.total_ingresos_usd : reporte?.total_ingresos)}
            </div>
          </CardContent>
        </Card>

        <Card id="finanzas-card-egresos-ano" className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Egresos (Este Año)
            </CardTitle>
            <div className="bg-red-500/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${obtenerClaseTamano(usarUSD ? reporte?.total_egresos_usd : reporte?.total_egresos)} font-bold text-red-500 transition-all duration-300`}>
              {formatearValorJSX(usarUSD ? reporte?.total_egresos_usd : reporte?.total_egresos)}
            </div>
          </CardContent>
        </Card>

        <Card id="finanzas-card-balance-ano" className="border-2 border-primary/30 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 transition-all duration-300 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance Total (Este Año)
            </CardTitle>
            <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${obtenerClaseTamano(usarUSD ? reporte?.balance_usd : reporte?.balance)} font-bold ${(usarUSD ? (reporte?.balance_usd || 0) : (reporte?.balance || 0)) >= 0 ? 'text-primary' : 'text-destructive'
              } transition-all duration-300`}>
              {formatearValorJSX(usarUSD ? reporte?.balance_usd : reporte?.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card id="finanzas-seccion-grafico" className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Gráfico de Ingresos y Egresos</CardTitle>
                <CardDescription>
                  Visualización de movimientos financieros - {obtenerTituloGrafico()}
                </CardDescription>
              </div>
            </div>
            <div id="finanzas-grafico-navegacion" className="flex gap-2">
              <Button
                id="finanzas-grafico-anterior"
                variant="outline"
                size="icon"
                onClick={() => cambiarFechaGrafico(-1)}
                className="hover:bg-primary/20 hover:scale-110 transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                id="finanzas-grafico-hoy"
                variant="outline"
                onClick={() => setFechaGrafico(new Date())}
                className="hover:bg-primary/20 hover:scale-105 transition-all duration-200"
              >
                Hoy
              </Button>
              <Button
                id="finanzas-grafico-siguiente"
                variant="outline"
                size="icon"
                onClick={() => cambiarFechaGrafico(1)}
                className="hover:bg-primary/20 hover:scale-110 transition-all duration-200"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 p-2 bg-secondary/20 rounded-lg">
              <Button
                id="finanzas-grafico-modo-ingresos-egresos"
                variant={modo_grafico === 'ingresos-egresos' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setModoGrafico('ingresos-egresos')}
                className="flex-1 hover:scale-105 transition-all duration-200"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Ingresos/Egresos
              </Button>
              <Button
                id="finanzas-grafico-modo-balance"
                variant={modo_grafico === 'balance' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setModoGrafico('balance')}
                className="flex-1 hover:scale-105 transition-all duration-200"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Balance
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <Tabs value={tipo_grafico} onValueChange={(value) => setTipoGrafico(value as 'dia' | 'mes' | 'ano')} className="flex-1">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger id="finanzas-grafico-tab-dia" value="dia">Por Día</TabsTrigger>
                  <TabsTrigger id="finanzas-grafico-tab-mes" value="mes">Por Mes</TabsTrigger>
                  <TabsTrigger id="finanzas-grafico-tab-ano" value="ano">Por Año</TabsTrigger>
                </TabsList>
              </Tabs>

              <div id="finanzas-grafico-tipo-visualizacion" className="flex items-center gap-2 shrink-0">
                {modo_grafico === 'ingresos-egresos' ? (
                  <>
                    <Button
                      id="finanzas-grafico-vista-barras"
                      variant={tipo_visualizacion === 'barras' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTipoVisualizacion('barras')}
                      className="hover:scale-105 transition-all duration-200"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      id="finanzas-grafico-vista-lineas"
                      variant={tipo_visualizacion === 'lineas' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTipoVisualizacion('lineas')}
                      className="hover:scale-105 transition-all duration-200"
                    >
                      <LineChartIcon className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      id="finanzas-balance-vista-simple"
                      variant={tipo_balance === 'simple' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTipoBalance('simple')}
                      className="hover:scale-105 transition-all duration-200"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      id="finanzas-balance-vista-area"
                      variant={tipo_balance === 'area' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTipoBalance('area')}
                      className="hover:scale-105 transition-all duration-200"
                    >
                      <LineChartIcon className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {cargando_grafico ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="w-full min-w-0" style={{ width: '100%', height: '450px', minHeight: '450px' }}>
                <ResponsiveContainer width="100%" height={450} minWidth={0} minHeight={450}>
                  {modo_grafico === 'ingresos-egresos' ? (
                    tipo_visualizacion === 'barras' ? (
                      <BarChart data={datos_grafico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => formatearValorJSX(Number(value ?? 0) || 0)}
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Bar dataKey={usarUSD ? "ingresos_usd" : "ingresos"} fill="#22c55e" name="Ingresos" />
                        <Bar dataKey={usarUSD ? "egresos_usd" : "egresos"} fill="#ef4444" name="Egresos" />
                      </BarChart>
                    ) : (
                      <LineChart data={datos_grafico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="periodo"
                          interval={tipo_grafico === 'dia' ? 0 : 'preserveStartEnd'}
                          angle={tipo_grafico === 'dia' ? -45 : 0}
                          textAnchor={tipo_grafico === 'dia' ? 'end' : 'middle'}
                          height={tipo_grafico === 'dia' ? 80 : 60}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => formatearValorJSX(Number(value ?? 0) || 0)}
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey={usarUSD ? "ingresos_usd" : "ingresos"} stroke="#22c55e" strokeWidth={2} name="Ingresos" />
                        <Line type="monotone" dataKey={usarUSD ? "egresos_usd" : "egresos"} stroke="#ef4444" strokeWidth={2} name="Egresos" />
                      </LineChart>
                    )
                  ) : (
                    tipo_balance === 'area' ? (
                      <AreaChart data={datos_grafico.map(d => {
                        const ingresos = usarUSD ? (d.ingresos_usd || 0) : d.ingresos;
                        const egresos = usarUSD ? (d.egresos_usd || 0) : d.egresos;
                        const balance = ingresos - egresos;
                        return {
                          periodo: d.periodo,
                          balance: balance,
                          balance_pos: balance >= 0 ? balance : 0,
                          balance_neg: balance < 0 ? balance : 0
                        };
                      })}>
                        <defs>
                          <linearGradient id="colorBalancePositivo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="colorBalanceNegativo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="periodo"
                          interval={tipo_grafico === 'dia' ? 0 : 'preserveStartEnd'}
                          angle={tipo_grafico === 'dia' ? -45 : 0}
                          textAnchor={tipo_grafico === 'dia' ? 'end' : 'middle'}
                          height={tipo_grafico === 'dia' ? 80 : 60}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => {
                            const n = Number(value ?? 0) || 0;
                            if (n === 0) return null;
                            return [formatearValor(n), String(name)];
                          }}
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                          labelFormatter={(label) => `Periodo: ${label}`}
                        />
                        <Legend />
                        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
                        <Area
                          type="monotone"
                          dataKey="balance_pos"
                          stroke="#22c55e"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorBalancePositivo)"
                          name="Balance +"
                          isAnimationActive={true}
                        />
                        <Area
                          type="monotone"
                          dataKey="balance_neg"
                          stroke="#ef4444"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorBalanceNegativo)"
                          name="Balance -"
                          isAnimationActive={true}
                        />
                      </AreaChart>
                    ) : (
                      <BarChart data={datos_grafico.map(d => {
                        const ingresos = usarUSD ? (d.ingresos_usd || 0) : d.ingresos;
                        const egresos = usarUSD ? (d.egresos_usd || 0) : d.egresos;
                        const balance = ingresos - egresos;
                        return {
                          periodo: d.periodo,
                          balance_positivo: balance >= 0 ? balance : 0,
                          balance_negativo: balance < 0 ? balance : 0
                        };
                      })}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => {
                            const n = Number(value ?? 0) || 0;
                            return n === 0 ? null : formatearValor(n);
                          }}
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                          labelFormatter={(label) => `Periodo: ${label}`}
                        />
                        <Legend />
                        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
                        <Bar
                          dataKey="balance_positivo"
                          fill="#22c55e"
                          name="Balance +"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="balance_negativo"
                          fill="#ef4444"
                          name="Balance -"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    )
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card id="finanzas-movimientos-hoy" className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Historial de Movimientos (Hoy)</CardTitle>
                <CardDescription>
                  {reporte?.movimientos.length || 0} movimientos registrados hoy
                </CardDescription>
              </div>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="finanzas-movimientos-hoy-buscar"
                placeholder="Buscar en movimientos de hoy..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(!reporte?.movimientos || reporte.movimientos.length === 0) ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  No hay movimientos hoy
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Los ingresos y egresos que registres hoy aparecerán aquí
                </p>
              </div>
            </div>
          ) : (
            <div id="finanzas-movimientos-hoy-lista" className="space-y-6">
              <div className="space-y-2">
                {reporte.movimientos.map((movimiento) => (
                  <div
                    key={`${movimiento.tipo}-${movimiento.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 hover:scale-[1.02] hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg hover:scale-110 transition-transform duration-200 ${movimiento.tipo === 'ingreso'
                        ? 'bg-green-500/10'
                        : 'bg-red-500/10'
                        }`}>
                        {movimiento.tipo === 'ingreso' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {movimiento.concepto}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            &bull; {formatearHora(movimiento.fecha)}
                          </p>
                        </div>
                        {(movimiento.cita_id || movimiento.plan_tratamiento_id) && (
                          <ReferenciaCitaTratamiento
                            className="mt-1"
                            cita={movimiento.cita_id ? citasPorId[movimiento.cita_id] : null}
                            plan={movimiento.plan_tratamiento_id ? planesPorId[movimiento.plan_tratamiento_id] : null}
                          />
                        )}
                      </div>
                      <div className={`text-lg font-bold ${movimiento.tipo === 'ingreso'
                        ? 'text-green-500'
                        : 'text-red-500'
                        }`}>
                        {movimiento.tipo === 'ingreso' ? '+' : '-'}
                        {formatearValorJSX(
                          usarUSD 
                            ? (movimiento.monto_usd && movimiento.monto_usd > 0 ? movimiento.monto_usd : (movimiento.monto / ((movimiento.tasa_cambio || 1) > 1 ? (movimiento.tasa_cambio || 1) : cambio_dolar)))
                            : movimiento.monto
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => movimiento.tipo === 'ingreso'
                          ? abrirEditarIngreso(movimiento)
                          : abrirEditarEgreso(movimiento)
                        }
                        className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirDialogoConfirmarEliminar(movimiento)}
                        className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card >

      <Dialog open={dialogo_ingreso_abierto} onOpenChange={(open) => !open && handleIntentarCerrarIngreso()}>
        <DialogContent id="dialog-finanzas-ingreso" className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion_ingreso ? 'Editar Ingreso' : 'Registrar Ingreso'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion_ingreso
                ? 'Modifica los datos del ingreso'
                : 'Registra un ingreso con o sin cita asociada'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="concepto_ingreso">Concepto *</Label>
              <Input
                id="concepto_ingreso"
                placeholder="Ej: Pago de consulta, Dinero encontrado, Ingreso extra"
                value={formulario_ingreso.concepto}
                onChange={(e) => setFormularioIngreso({ ...formulario_ingreso, concepto: e.target.value })}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            {!modo_edicion_ingreso && (
              <div className="space-y-2">
                <Label htmlFor="cita">Cita (opcional)</Label>
                {cargando_datos ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Combobox
                    opciones={opciones_citas}
                    valor={formulario_ingreso.cita_id}
                    onChange={(valor) => setFormularioIngreso({ ...formulario_ingreso, cita_id: valor })}
                    placeholder="Selecciona una cita"
                    idTrigger="finanzas-ingreso-cita-trigger"
                    maxLengthEtiqueta={80}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Puedes asociar este ingreso a una cita existente o dejarlo sin cita
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fecha_ingreso">Fecha y Hora *</Label>
              <div id="finanzas-ingreso-fecha">
                <DateTimePicker
                  valor={formulario_ingreso.fecha}
                  onChange={(fecha) => fecha && setFormularioIngreso({ ...formulario_ingreso, fecha })}
                  placeholder="Selecciona fecha y hora"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Monto *</Label>
              <div id="finanzas-ingreso-monto">
                <InputMoneda
                  valorLocal={formulario_ingreso.monto}
                  valorUSD={formulario_ingreso.monto_usd}
                  onMontoChange={(local, usd) =>
                    setFormularioIngreso(prev => ({
                      ...prev,
                      monto: local,
                      monto_usd: usd
                    }))
                  }
                />
              </div>
            </div>

            {modo_edicion_ingreso && movimiento_seleccionado && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  âš ï¸ No se puede cambiar la cita asociada de un ingreso existente
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              id="btn-finanzas-ingreso-cancelar"
              variant="outline"
              onClick={handleIntentarCerrarIngreso}
              disabled={guardando_ingreso}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              id="btn-finanzas-ingreso-guardar"
              onClick={manejarRegistrarIngreso}
              disabled={guardando_ingreso}
              className="bg-green-600 hover:bg-green-700 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando_ingreso && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion_ingreso ? 'Actualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_egreso_abierto} onOpenChange={(open) => !open && handleIntentarCerrarEgreso()}>
        <DialogContent id="dialog-finanzas-egreso" className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion_egreso ? 'Editar Egreso' : 'Registrar Egreso'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion_egreso
                ? 'Modifica los datos del egreso'
                : 'Registra un gasto o egreso de tu consultorio'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="concepto_egreso">Concepto *</Label>
              <Input
                id="concepto_egreso"
                placeholder="Ej: Compra de materiales dentales"
                value={formulario_egreso.concepto}
                onChange={(e) => setFormularioEgreso({ ...formulario_egreso, concepto: e.target.value })}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_egreso">Fecha y Hora *</Label>
              <div id="finanzas-egreso-fecha">
                <DateTimePicker
                  valor={formulario_egreso.fecha}
                  onChange={(fecha) => fecha && setFormularioEgreso({ ...formulario_egreso, fecha })}
                  placeholder="Selecciona fecha y hora"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Monto *</Label>
              <div id="finanzas-egreso-monto">
                <InputMoneda
                  valorLocal={formulario_egreso.monto}
                  valorUSD={formulario_egreso.monto_usd}
                  onMontoChange={(local, usd) =>
                    setFormularioEgreso(prev => ({
                      ...prev,
                      monto: local,
                      monto_usd: usd
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              id="btn-finanzas-egreso-cancelar"
              variant="outline"
              onClick={handleIntentarCerrarEgreso}
              disabled={guardando_egreso}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              id="btn-finanzas-egreso-guardar"
              onClick={manejarRegistrarEgreso}
              disabled={guardando_egreso}
              variant="destructive"
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando_egreso && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion_egreso ? 'Actualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialogo_confirmar_cerrar_ingreso} onOpenChange={setDialogoConfirmarCerrarIngreso}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de salir?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si sales ahora, se perderán todos los datos ingresados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarCerrarIngreso}>Salir sin guardar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialogo_confirmar_cerrar_egreso} onOpenChange={setDialogoConfirmarCerrarEgreso}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de salir?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si sales ahora, se perderán todos los datos ingresados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarCerrarEgreso}>Salir sin guardar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este {movimiento_a_eliminar?.tipo === 'ingreso' ? 'ingreso' : 'egreso'}?
            </DialogDescription>
          </DialogHeader>

          {movimiento_a_eliminar && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
              <p className="font-semibold text-foreground">{movimiento_a_eliminar.concepto}</p>
              <p className="text-sm text-muted-foreground">
                {formatearFechaHora(movimiento_a_eliminar.fecha)}
              </p>
              <p className={`text-lg font-bold ${movimiento_a_eliminar.tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'
                }`}>
                {formatearValorJSX(usarUSD ? movimiento_a_eliminar.monto_usd : movimiento_a_eliminar.monto)}
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
                setMovimientoAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarEliminarMovimiento}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
