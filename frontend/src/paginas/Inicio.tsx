import { useState, useEffect, useMemo } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { TituloAccionable } from '@/componentes/tutoriales/titulo-accionable';
import { useAutenticacion } from '@/contextos/autenticacion-contexto';
import { useClinica } from '@/contextos/clinica-contexto';
import { ProveedorTutorialesPagina } from '@/contextos/tutoriales';
import { TutorialModalWrapper } from '@/componentes/tutoriales/tutorial-modal-wrapper';
import { TUTORIALES_INICIO, IDS_ELEMENTOS_INICIO } from '@/tutoriales/inicio';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { Toaster } from '@/componentes/ui/toaster';
import { Calendar as CalendarIcon, Users, DollarSign, FileText, TrendingUp, Clock, Loader2, TrendingDown, FileSignature, BarChart3, Pill } from 'lucide-react';
import { Calendar } from '@/componentes/ui/calendar';
import { estadisticasApi, agendaApi, pacientesApi, planesTratamientoApi, finanzasApi, reportesApi } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { Cita, PlanTratamiento, Paciente, Movimiento } from '@/tipos';
import { Input } from '@/componentes/ui/input';
import { Badge } from '@/componentes/ui/badge';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { GestionReportes } from '@/componentes/reportes/gestion-reportes';
import { GestionPlantillasConsentimiento } from '@/componentes/plantillas/gestion-plantillas-consentimiento';
import { GestionPlantillasRecetas } from '@/componentes/plantillas/gestion-plantillas-recetas';
import { es } from 'date-fns/locale';
import { useMoneda } from '@/hooks/use-moneda';
import { useInicioUI } from '@/contextos/inicio-contexto';

interface Transaccion {
  id: number;
  tipo: 'ingreso' | 'egreso';
  fecha: Date;
  monto: number;
  monto_usd?: number;
  concepto: string;
  cita_id?: number;
  plan_tratamiento_id?: number;
}

interface Estadisticas {
  total_pacientes: number;
  citas_hoy: number;
  planes_activos: number;
  ingresos_mes: number;
  egresos_mes: number;
  balance_mes: number;
  ingresos_mes_usd?: number;
  egresos_mes_usd?: number;
  balance_mes_usd?: number;
  citas_recientes: Array<{
    id: number;
    fecha: Date;
    descripcion: string;
    paciente?: {
      nombre: string;
      apellidos: string;
    };
  }>;
  ultimas_transacciones: Transaccion[];
}

export default function Inicio() {
  const { formatearMonedaJSX } = useMoneda();
  const { usuario } = useAutenticacion();
  const { config_clinica } = useClinica();
  const {
    tabInicio,
    setTabInicio,
    subtabPlantillas,
    setSubtabPlantillas,
    fechaSeleccionada,
    setFechaSeleccionada,
  } = useInicioUI();
  const usarUSD = config_clinica.trabajar_con === 'usd';
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [citasDelDia, setCitasDelDia] = useState<Cita[]>([]);
  const [cargandoCitasDia, setCargandoCitasDia] = useState(false);
  const [fechasOcupadas, setFechasOcupadas] = useState<Date[]>([]);
  const [anosCargados, setAnosCargados] = useState<Set<number>>(new Set([new Date().getFullYear()]));
  const [filtroDetalle, setFiltroDetalle] = useState('');
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [detallePacientes, setDetallePacientes] = useState<Paciente[]>([]);
  const [detalleCitasHoy, setDetalleCitasHoy] = useState<Cita[]>([]);
  const [detalleTransacciones, setDetalleTransacciones] = useState<Movimiento[]>([]);
  const [detalleTratamientos, setDetalleTratamientos] = useState<PlanTratamiento[]>([]);
  const [reportes, setReportes] = useState<any[]>([]);

  useEffect(() => {
    cargarEstadisticas();
    cargarFechasOcupadas();
    cargarDatosTutoriales();
    if (fechaSeleccionada) {
      cargarCitasDia(fechaSeleccionada);
    }
  }, []);

  useEffect(() => {
    const onNavegarInicio = (evento: Event) => {
      const custom = evento as CustomEvent<{ tab?: 'dashboard' | 'reportes' | 'plantillas'; subtabPlantillas?: 'consentimientos' | 'recetas' }>;
      const detalle = custom.detail;
      if (!detalle) return;
      if (detalle.tab) setTabInicio(detalle.tab);
      if (detalle.subtabPlantillas) {
        setTabInicio('plantillas');
        setSubtabPlantillas(detalle.subtabPlantillas);
      }
    };

    const onReportesActualizados = () => {
      cargarDatosTutoriales();
    };

    window.addEventListener('tutorial:navegar-inicio', onNavegarInicio);
    window.addEventListener('tutorial:reportes-actualizados', onReportesActualizados);
    return () => {
      window.removeEventListener('tutorial:navegar-inicio', onNavegarInicio);
      window.removeEventListener('tutorial:reportes-actualizados', onReportesActualizados);
    };
  }, []);
  const cargarDatosTutoriales = async () => {
    try {
      const reportesData = await reportesApi.obtener().catch(() => []);
      setReportes(reportesData);
    } catch (error) {
      console.error('Error al cargar datos para tutoriales:', error);
    }
  };
  const condicionesBloqueoTutoriales = useMemo(() => {
    const tieneReportes = reportes.length > 0;
    const tieneGemini = config_clinica.gemini_verificado === true;

    return {
      'inicio-crear-reporte': {
        bloqueado: !tieneGemini,
        mensaje: 'Requiere configurar la API Key de Gemini en Configuración > Ajustes',
      },
      'inicio-ver-reportes': {
        bloqueado: !tieneReportes,
        mensaje: 'Necesitas generar al menos un reporte primero',
      },
    };
  }, [reportes, config_clinica.gemini_verificado]);
  const tutorialesConCondiciones = useMemo(() => {
    const tieneGemini = config_clinica.gemini_verificado === true;
    const tieneReportes = reportes.length > 0;

    return TUTORIALES_INICIO.map(tutorial => {
      if (tutorial.nombre === 'inicio-crear-reporte' && tutorial.condicionBloqueo) {
        return {
          ...tutorial,
          condicionBloqueo: {
            ...tutorial.condicionBloqueo,
            condicionesPrevias: [
              {
                id: 'gemini-configurado',
                descripcion: 'Configurar API Key de Gemini en Configuración',
                completada: tieneGemini,
              },
            ],
          },
        };
      }

      if (tutorial.nombre === 'inicio-ver-reportes' && tutorial.condicionBloqueo) {
        return {
          ...tutorial,
          condicionBloqueo: {
            ...tutorial.condicionBloqueo,
            condicionesPrevias: [
              {
                id: 'tiene-reportes',
                descripcion: 'Generar al menos un reporte',
                completada: tieneReportes,
              },
            ],
          },
        };
      }

      return tutorial;
    });
  }, [config_clinica.gemini_verificado, reportes]);

  const cargarFechasOcupadas = async () => {
    try {
      const hoy = new Date();
      const fechas = await agendaApi.obtenerDiasOcupados(hoy.getFullYear());
      const fechasDate = fechas.map((f: string) => {
        const [anio, mes, dia] = f.split('-').map(Number);
        return new Date(anio, mes - 1, dia);
      });
      setFechasOcupadas(fechasDate);
    } catch (error) {
      console.error('Error al cargar fechas ocupadas:', error);
    }
  };

  const alCambiarMes = async (mes: Date) => {
    const ano = mes.getFullYear();
    if (!anosCargados.has(ano)) {
      try {
        const fechas = await agendaApi.obtenerDiasOcupados(ano);
        const fechasDate = fechas.map((f: string) => {
          const [anio, mesNo, dia] = f.split('-').map(Number);
          return new Date(anio, mesNo - 1, dia);
        });
        setFechasOcupadas(prev => [...prev, ...fechasDate]);
        setAnosCargados(prev => new Set(prev).add(ano));
      } catch (error) {
        console.error('Error al cargar fechas ocupadas del año:', error);
      }
    }
  };

  const cargarCitasDia = async (fecha: Date) => {
    setCargandoCitasDia(true);
    try {
      const inicio = new Date(fecha);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(23, 59, 59, 999);

      const citas = await agendaApi.filtrarCitas(inicio, fin);
      setCitasDelDia(citas);
    } catch (error) {
      console.error('Error al cargar citas del día:', error);
    } finally {
      setCargandoCitasDia(false);
    }
  };

  const abrirDetalle = async (tipo: 'pacientes' | 'citas_hoy' | 'ingresos' | 'tratamientos') => {
    setFiltroDetalle('');
    setCargandoDetalle(true);

    try {
      if (tipo === 'pacientes') {
        const resultado = await pacientesApi.obtenerTodos();
        setDetallePacientes(resultado);
      } else if (tipo === 'citas_hoy') {
        const hoy = new Date();
        const inicio = new Date(hoy.setHours(0, 0, 0, 0));
        const fin = new Date(hoy.setHours(23, 59, 59, 999));
        const resultado = await agendaApi.filtrarCitas(inicio, fin);
        setDetalleCitasHoy(resultado);
      } else if (tipo === 'ingresos') {
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
        const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        const reporte = await finanzasApi.obtenerReporte(inicio.toISOString(), fin.toISOString());
        setDetalleTransacciones(reporte.movimientos.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      } else if (tipo === 'tratamientos') {
        const resultado = await planesTratamientoApi.obtenerTodos();
        const activos = resultado.filter((p: any) => p.estado === 'pendiente');
        setDetalleTratamientos(activos);
      }
    } catch (error) {
      console.error(`Error al cargar detalle de ${tipo}:`, error);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalle = () => {
  };

  const alSeleccionarFecha = async (fecha: Date | undefined) => {
    if (fecha) {
      setFechaSeleccionada(fecha);
      cargarCitasDia(fecha);
    }
  };

  const cargarEstadisticas = async () => {
    setCargando(true);
    try {
      const datos_estadisticas = await estadisticasApi.obtenerDashboard();
      setEstadisticas(datos_estadisticas);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setCargando(false);
    }
  };


  const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const formatearMontoDashboard = (montoLocal?: number, montoUsd?: number) => {
    if (usarUSD) {
      const valor = typeof montoUsd === 'number' ? montoUsd : (typeof montoLocal === 'number' ? montoLocal : 0);
      return <>{`$ ${Number(valor || 0).toFixed(2)}`}</>;
    }
    return formatearMonedaJSX(montoLocal || 0);
  };

  const balanceVisible = usarUSD
    ? (typeof estadisticas?.balance_mes_usd === 'number' ? estadisticas.balance_mes_usd : (estadisticas?.balance_mes || 0))
    : (estadisticas?.balance_mes || 0);


  const formatearFechaTransaccion = (fecha: Date): string => {
    const f = new Date(fecha);
    const dia = String(f.getDate()).padStart(2, '0');
    const mes = MESES_CORTOS[f.getMonth()] ?? '';
    const horas = String(f.getHours()).padStart(2, '0');
    const minutos = String(f.getMinutes()).padStart(2, '0');
    return `${dia} ${mes} ${horas}:${minutos}`.trim();
  };

  if (cargando) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  const tarjetas_estadisticas = [
    {
      id: IDS_ELEMENTOS_INICIO.CARD_ESTADISTICA_PACIENTES,
      titulo: 'Pacientes Totales',
      valor: estadisticas?.total_pacientes || 0,
      icono: Users,
      color: 'text-blue-400',
      fondo: 'bg-blue-500/10',
      tipo: 'pacientes',
      accion: () => abrirDetalle('pacientes')
    },
    {
      id: IDS_ELEMENTOS_INICIO.CARD_ESTADISTICA_CITAS,
      titulo: 'Citas Hoy',
      valor: estadisticas?.citas_hoy || 0,
      icono: CalendarIcon,
      color: 'text-green-400',
      fondo: 'bg-green-500/10',
      tipo: 'citas_hoy',
      accion: () => abrirDetalle('citas_hoy')
    },
    {
      id: IDS_ELEMENTOS_INICIO.CARD_ESTADISTICA_INGRESOS,
      titulo: 'Ingresos del Mes',
      valor: formatearMontoDashboard(estadisticas?.ingresos_mes, estadisticas?.ingresos_mes_usd),
      icono: DollarSign,
      color: 'text-yellow-400',
      fondo: 'bg-yellow-500/10',
      tipo: 'ingresos',
      accion: () => abrirDetalle('ingresos')
    },
    {
      id: IDS_ELEMENTOS_INICIO.CARD_ESTADISTICA_TRATAMIENTOS,
      titulo: 'Tratamientos Activos',
      valor: estadisticas?.planes_activos || 0,
      icono: FileText,
      color: 'text-purple-400',
      fondo: 'bg-purple-500/10',
      tipo: 'tratamientos',
      accion: () => abrirDetalle('tratamientos')
    },
  ];

  return (
    <ProveedorTutorialesPagina
      pagina="/inicio"
      definicionesTutoriales={tutorialesConCondiciones}
      condicionesBloqueo={condicionesBloqueoTutoriales}
    >
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-foreground tracking-tight">
                  {config_clinica.mensaje_bienvenida_antes}
                  <span id="nombre-usuario-inicio" className="text-primary"><TituloAccionable titulo="Inicio">{usuario?.nombre}</TituloAccionable></span>
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
            </div>

            <Tabs value={tabInicio} onValueChange={(v) => setTabInicio(v as typeof tabInicio)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dashboard" className="gap-2" id={IDS_ELEMENTOS_INICIO.TAB_DASHBOARD}>
                  <TrendingUp className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="reportes" className="gap-2" id={IDS_ELEMENTOS_INICIO.TAB_REPORTES}>
                  <BarChart3 className="h-4 w-4" />
                  Reportes
                </TabsTrigger>
                <TabsTrigger value="plantillas" className="gap-2" id={IDS_ELEMENTOS_INICIO.TAB_PLANTILLAS}>
                  <FileSignature className="h-4 w-4" />
                  Plantillas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6 mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {tarjetas_estadisticas.map((tarjeta, index) => {
                    const Icono = tarjeta.icono;
                    const tipoActual = tarjeta.tipo as 'pacientes' | 'citas_hoy' | 'ingresos' | 'tratamientos';

                    return (
                      <Popover key={index} onOpenChange={(open) => {
                        if (open) abrirDetalle(tipoActual);
                        else cerrarDetalle();
                      }}>
                        <PopoverTrigger asChild>
                          <Card
                            id={tarjeta.id}
                            className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer bg-card"
                          >
                            <CardHeader className="flex flex-row items-center justify-between pb-2 pointer-events-none">
                              <CardTitle className="text-sm font-medium text-muted-foreground">
                                {tarjeta.titulo}
                              </CardTitle>
                              <div className={`${tarjeta.fondo} p-2 rounded-lg hover:scale-110 transition-transform duration-200`}>
                                <Icono className={`h-5 w-5 ${tarjeta.color}`} />
                              </div>
                            </CardHeader>
                            <CardContent className="pointer-events-none">
                              <div className="text-3xl font-bold text-foreground">{tarjeta.valor}</div>
                            </CardContent>
                          </Card>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start" sideOffset={8}>
                          <div className="p-4 bg-background border rounded-lg shadow-xl outline-none">
                            <div className="flex flex-col gap-4 max-h-[400px]">
                              <div className="font-semibold text-lg border-b pb-2">
                                {tipoActual === 'pacientes' && 'Pacientes Registrados'}
                                {tipoActual === 'citas_hoy' && 'Citas de Hoy'}
                                {tipoActual === 'ingresos' && 'Transacciones Recientes'}
                                {tipoActual === 'tratamientos' && 'Tratamientos Activos'}
                              </div>
                              <Input
                                placeholder="Filtrar..."
                                value={filtroDetalle}
                                onChange={(e) => setFiltroDetalle(e.target.value)}
                                className="h-8"
                              />
                              <ScrollArea className="h-[300px] w-full pr-4">
                                {cargandoDetalle ? (
                                  <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {tipoActual === 'pacientes' && detallePacientes
                                      .filter(p => !filtroDetalle ||
                                        `${p.nombre} ${p.apellidos}`.toLowerCase().includes(filtroDetalle.toLowerCase()) ||
                                        p.telefono?.includes(filtroDetalle)
                                      )
                                      .map(paciente => (
                                        <div key={paciente.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/50 hover:bg-muted transition-colors text-sm">
                                          <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white shadow-sm text-xs" style={{ backgroundColor: paciente.color_categoria || '#3b82f6' }}>
                                              {paciente.nombre.charAt(0)}{paciente.apellidos.charAt(0)}
                                            </div>
                                            <div className="truncate">
                                              <p className="font-medium truncate">{paciente.nombre} {paciente.apellidos}</p>
                                              <p className="text-xs text-muted-foreground">{paciente.telefono}</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    {tipoActual === 'citas_hoy' && detalleCitasHoy
                                      .filter(c => !filtroDetalle ||
                                        (c.paciente && `${c.paciente.nombre} ${c.paciente.apellidos}`.toLowerCase().includes(filtroDetalle.toLowerCase())) ||
                                        c.descripcion.toLowerCase().includes(filtroDetalle.toLowerCase())
                                      )
                                      .map(cita => (
                                        <div key={cita.id} className="flex gap-2 rounded-md border p-2 bg-muted/50 hover:bg-muted transition-colors text-sm">
                                          <div className="flex flex-col items-center justify-center min-w-[3rem] rounded bg-primary/10 px-1 py-0.5">
                                            <span className="text-[10px] font-bold text-primary leading-tight">
                                              {new Date(cita.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </div>
                                          <div className="overflow-hidden">
                                            <p className="font-medium truncate">
                                              {cita.paciente ? `${cita.paciente.nombre} ${cita.paciente.apellidos}` : 'Sin paciente'}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{cita.descripcion}</p>
                                          </div>
                                        </div>
                                      ))}
                                    {tipoActual === 'ingresos' && detalleTransacciones
                                      .filter(t => !filtroDetalle ||
                                        t.concepto.toLowerCase().includes(filtroDetalle.toLowerCase())
                                      )
                                      .map(transaccion => (
                                        <div key={transaccion.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/50 hover:bg-muted transition-colors text-sm">
                                          <div className="flex items-center gap-2 overflow-hidden">
                                            <div className={`p-1 rounded ${transaccion.tipo === 'ingreso' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                              {transaccion.tipo === 'ingreso' ? (
                                                <TrendingUp className="h-3 w-3 text-green-500" />
                                              ) : (
                                                <TrendingDown className="h-3 w-3 text-red-500" />
                                              )}
                                            </div>
                                            <div className="truncate">
                                              <p className="font-medium truncate">{transaccion.concepto}</p>
                                              <p className="text-[10px] text-muted-foreground">{formatearFechaTransaccion(transaccion.fecha)}</p>
                                            </div>
                                          </div>
                                            <span className={`font-bold ml-2 ${transaccion.tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                                              {transaccion.tipo === 'ingreso' ? '+' : '-'}
                                              {formatearMontoDashboard(transaccion.monto, transaccion.monto_usd)}
                                          </span>
                                        </div>
                                      ))}
                                    {tipoActual === 'tratamientos' && detalleTratamientos
                                      .filter(t => !filtroDetalle ||
                                        `${t.paciente.nombre} ${t.paciente.apellidos}`.toLowerCase().includes(filtroDetalle.toLowerCase()) ||
                                        t.tratamiento.nombre.toLowerCase().includes(filtroDetalle.toLowerCase())
                                      )
                                      .map(plan => (
                                        <div key={plan.id} className="flex flex-col p-2 rounded-md border bg-muted/50 hover:bg-muted transition-colors gap-1 text-sm">
                                          <div className="flex justify-between items-start">
                                            <div className="truncate pr-2">
                                              <p className="font-bold truncate">{plan.paciente.nombre} {plan.paciente.apellidos}</p>
                                              <p className="text-xs text-primary truncate">{plan.tratamiento.nombre}</p>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] px-1 h-5">{plan.estado}</Badge>
                                          </div>
                                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                            <span>In: {new Date(plan.fecha_inicio).toLocaleDateString()}</span>
                                            <span>{formatearMonedaJSX(plan.total_abonado)} / {formatearMonedaJSX(plan.costo_total)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    {((tipoActual === 'pacientes' && detallePacientes.length === 0) ||
                                      (tipoActual === 'citas_hoy' && detalleCitasHoy.length === 0) ||
                                      (tipoActual === 'ingresos' && detalleTransacciones.length === 0) ||
                                      (tipoActual === 'tratamientos' && detalleTratamientos.length === 0)) && (
                                        <p className="text-center text-muted-foreground py-4 text-xs">No se encontraron registros.</p>
                                      )}
                                  </div>
                                )}
                              </ScrollArea>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card id={IDS_ELEMENTOS_INICIO.CARD_RESUMEN_FINANCIERO} className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Resumen Financiero</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200">
                        <span className="text-muted-foreground font-medium">Total Ingresos</span>
                        <span className="font-bold text-green-400 text-lg">
                          {formatearMontoDashboard(estadisticas?.ingresos_mes, estadisticas?.ingresos_mes_usd)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200">
                        <span className="text-muted-foreground font-medium">Total Egresos</span>
                        <span className="font-bold text-red-400 text-lg">
                          {formatearMontoDashboard(estadisticas?.egresos_mes || 0, estadisticas?.egresos_mes_usd)}
                        </span>
                      </div>
                      <div className="border-t-2 border-border pt-4 mt-4">
                        <div className="flex justify-between items-center p-4 rounded-lg bg-primary/10 hover:bg-primary/20 hover:scale-105 transition-all duration-200">
                          <span className="font-bold text-foreground text-lg">Balance</span>
                          <span className={`text-2xl font-bold ${balanceVisible >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            {formatearMontoDashboard(estadisticas?.balance_mes || 0, estadisticas?.balance_mes_usd)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card id={IDS_ELEMENTOS_INICIO.CALENDARIO} className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Próximas Citas</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="flex flex-col xl:flex-row h-[400px] bg-card/50">
                        <div className="p-4 border-r border-border/50">
                          <Calendar
                            locale={es}
                            mode="single"
                            required
                            selected={fechaSeleccionada}
                            onSelect={alSeleccionarFecha}
                            onMonthChange={alCambiarMes}
                            className="bg-transparent border-0 shadow-none p-0"
                            classNames={{
                              month: "space-y-4",
                              table: "w-full border-collapse space-y-1",
                              head_row: "grid grid-cols-7 w-full gap-1",
                              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                              row: "grid grid-cols-7 w-full mt-2 gap-1",
                              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                              nav_button_previous: "absolute left-1",
                              nav_button_next: "absolute right-1",
                              caption: "flex justify-center pt-1 relative items-center mb-4"
                            }}
                            modifiers={{
                              ocupado: (date) => fechasOcupadas.some(f => {
                                return f.getDate() === date.getDate() &&
                                  f.getMonth() === date.getMonth() &&
                                  f.getFullYear() === date.getFullYear();
                              })
                            }}
                            modifiersClassNames={{
                              ocupado: "font-bold text-primary border-2 border-primary bg-primary/10 rounded-md"
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0 p-4 bg-muted/10">
                          <div className="h-full flex flex-col">
                            <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground/90">
                              <CalendarIcon className="h-4 w-4 text-primary" />
                              Agenda del {fechaSeleccionada?.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>

                            <ScrollArea className="flex-1 w-full pr-3 -mr-3">
                              {cargandoCitasDia ? (
                                <div className="flex h-full items-center justify-center min-h-[250px]">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                              ) : citasDelDia.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground min-h-[250px]">
                                  <CalendarIcon className="h-10 w-10 mb-2 opacity-20" />
                                  <p className="text-sm text-center">No hay citas programadas.</p>
                                </div>
                              ) : (
                                <div className="space-y-3 pr-3">
                                  {citasDelDia.map((cita) => (
                                    <div key={cita.id} className="flex gap-3 rounded-lg border border-border/50 p-3 bg-card/50 hover:bg-accent/50 transition-colors">
                                      <div className="flex flex-col items-center gap-1.5 min-w-[4.5rem]">
                                        <div className="rounded-md bg-primary/10 px-2 py-1 w-full flex justify-center">
                                          <span className="text-xs font-bold text-primary">
                                            {new Date(cita.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-center gap-1 rounded-full bg-secondary/80 px-2 py-1 w-full shadow-sm">
                                          <Clock className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs font-medium text-foreground/80">
                                            {cita.horas_aproximadas > 0 ? `${cita.horas_aproximadas}h` : ''}
                                            {cita.minutos_aproximados > 0 ? `${cita.minutos_aproximados}m` : ''}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex-1 overflow-hidden min-w-0 py-1">
                                        <p className="font-semibold truncate text-sm text-foreground/90">
                                          {cita.paciente ? `${cita.paciente.nombre} ${cita.paciente.apellidos}` : 'Sin paciente'}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate mb-1">{cita.descripcion}</p>

                                        {cita.estado_pago && (
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block ${cita.estado_pago === 'pagado' ? 'bg-green-500/10 text-green-500' :
                                            cita.estado_pago === 'pendiente' ? 'bg-yellow-500/10 text-yellow-500' :
                                              'bg-gray-500/10 text-gray-400'
                                            }`}>
                                            {cita.estado_pago}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="reportes" className="mt-6">
                <GestionReportes />
              </TabsContent>

              <TabsContent value="plantillas" className="mt-6 space-y-4">
                <Tabs value={subtabPlantillas} onValueChange={(v) => setSubtabPlantillas(v as typeof subtabPlantillas)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="consentimientos" className="gap-2" id={IDS_ELEMENTOS_INICIO.SUBTAB_CONSENTIMIENTOS}>
                      <FileSignature className="h-4 w-4" /> Consentimientos
                    </TabsTrigger>
                    <TabsTrigger value="recetas" className="gap-2" id={IDS_ELEMENTOS_INICIO.SUBTAB_RECETAS}>
                      <Pill className="h-4 w-4" /> Recetas
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="consentimientos" className="mt-4">
                    <GestionPlantillasConsentimiento />
                  </TabsContent>
                  <TabsContent value="recetas" className="mt-4">
                    <GestionPlantillasRecetas />
                  </TabsContent>
                </Tabs>


              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Toaster />
        <TutorialModalWrapper tema="Inicio" />
      </div>
    </ProveedorTutorialesPagina>
  );
}
