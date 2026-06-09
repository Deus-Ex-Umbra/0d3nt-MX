import { useState, useEffect, useMemo } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { TituloAccionable } from '@/componentes/tutoriales/titulo-accionable';
import { TutorialModalWrapper } from '@/componentes/tutoriales/tutorial-modal-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/componentes/ui/alert-dialog';
import { useSafeClose } from '@/hooks/use-safe-close';
import { useBusquedaPaginacion } from '@/hooks/use-busqueda-paginacion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table';
import { ScrollArea, ScrollBar } from '@/componentes/ui/scroll-area';
import { Switch } from '@/componentes/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Coins,
  Box,
  AlertTriangle,
  Shield,
  History,
  X,
  Search,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Filter,
  Check,
  Lock,
} from 'lucide-react';
import { inventarioApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { Badge } from '@/componentes/ui/badge';
import { DatePicker } from '@/componentes/ui/date-picker';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { differenceInCalendarDays, format } from 'date-fns';
import { cn, serializarFechaHoraParaApi } from '@/lib/utilidades';
import { useMoneda } from '@/hooks/use-moneda';
import { useValidacionCamposRequeridos } from '@/hooks/use-validacion-campos-requeridos';
import { useClinica } from '@/contextos/clinica-contexto';
import { useInventariosUI } from '@/contextos/inventarios-contexto';
import InputMoneda from '@/componentes/ui/input-moneda';
import { ProveedorTutorialesPagina } from '@/contextos/tutoriales';
import { TUTORIALES_INVENTARIOS, IDS_ELEMENTOS_INVENTARIOS } from '@/tutoriales/inventarios';
import {
  Inventario,
  Producto,
  Material,
  Activo,
  ReporteValor,
  MovimientoKardex,
  EventoBitacora,
  RegistroAuditoria
} from '@/tipos';

export default function Inventarios() {
  const { formatearMonedaJSX } = useMoneda();
  const { validarCampos, limpiarCampoResaltado, claseCampoResaltado } = useValidacionCamposRequeridos();
  const { config_clinica } = useClinica();
  const {
    vista_actual,
    setVistaActual,
    tab_activo,
    setTabActivo,
    subtab_productos,
    setSubtabProductos,
    seleccion,
    setSeleccion,
    limpiarSeleccion,
    detalle_cache,
    setDetalleCache,
    limpiarDetalleCache,
  } = useInventariosUI();
  const usarUSD = config_clinica?.trabajar_con === 'usd';
  const cambio_dolar = Number(config_clinica?.cambio_dolar || 1) || 1;

  const formatearUSD = (monto: number): React.ReactNode => {
    const valor = Number(monto || 0);
    return <>USD {valor.toFixed(2)}</>;
  };

  const obtenerUSDDesdeLocal = (monto_local: number): number => {
    const tasa = Number(cambio_dolar) || 1;
    const local = Number(monto_local || 0);
    if (!Number.isFinite(local) || !Number.isFinite(tasa) || tasa <= 0) return 0;
    return Number((local / tasa).toFixed(2));
  };

  const formatearMonto = (monto_local: number, monto_usd?: number): React.ReactNode => {
    if (!usarUSD) return formatearMonedaJSX(monto_local || 0);
    const usd = Number(monto_usd);
    if (Number.isFinite(usd) && usd > 0) return formatearUSD(usd);
    return formatearUSD(obtenerUSDDesdeLocal(monto_local || 0));
  };
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [inventario_seleccionado, setInventarioSeleccionado] = useState<Inventario | null>(() => {
    if (seleccion?.id) return { id: seleccion.id, nombre: seleccion.nombre ?? '' } as any;
    return null;
  });
  const [productos, setProductos] = useState<Producto[]>([]);
  const [reporte_valor, setReporteValor] = useState<ReporteValor | null>(null);

  const [prereq_tiene_entrada_material, setPrereqTieneEntradaMaterial] = useState<boolean | null>(null);
  const [prereq_tiene_activo_registrado, setPrereqTieneActivoRegistrado] = useState<boolean | null>(null);
  const [prereq_cargando, setPrereqCargando] = useState(false);

  const [kardex, setKardex] = useState<MovimientoKardex[]>([]);
  const [bitacora, setBitacora] = useState<EventoBitacora[]>([]);
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>([]);

  const [cargando, setCargando] = useState(true);
  const [cargando_detalle, setCargandoDetalle] = useState(false);
  const [cargando_kardex, setCargandoKardex] = useState(false);
  const [cargando_bitacora, setCargandoBitacora] = useState(false);
  const [cargando_auditoria, setCargandoAuditoria] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [productos_cargando, setProductosCargando] = useState<Set<number>>(new Set());

  const [dialogo_inventario_abierto, setDialogoInventarioAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [dialogo_producto_abierto, setDialogoProductoAbierto] = useState(false);
  const [dialogo_material_abierto, setDialogoMaterialAbierto] = useState(false);
  const [dialogo_activo_abierto, setDialogoActivoAbierto] = useState(false);
  const [dialogo_ajuste_stock_abierto, setDialogoAjusteStockAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_producto_abierto, setDialogoConfirmarEliminarProductoAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_material_abierto, setDialogoConfirmarEliminarMaterialAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_activo_abierto, setDialogoConfirmarEliminarActivoAbierto] = useState(false);
  const [dialogo_vender_activo_abierto, setDialogoVenderActivoAbierto] = useState(false);
  const [dialogo_filtros_historial_abierto, setDialogoFiltrosHistorialAbierto] = useState(false);
  const [dialogo_detalles_auditoria_abierto, setDialogoDetallesAuditoriaAbierto] = useState(false);
  const [detalles_auditoria_seleccionada, setDetallesAuditoriaSeleccionada] = useState<RegistroAuditoria | null>(null);
  const [dialogo_confirmar_cambio_desechado_abierto, setDialogoConfirmarCambioDesechadoAbierto] = useState(false);
  const [activo_a_desechar, setActivoADesechar] = useState<{ producto: Producto, activo: Activo } | null>(null);
  const [motivo_cambio_estado_activo, setMotivoCambioEstadoActivo] = useState('');

  const [modo_edicion, setModoEdicion] = useState(false);
  const [modo_edicion_producto, setModoEdicionProducto] = useState(false);
  const [modo_edicion_activo, setModoEdicionActivo] = useState(false);

  const [inventario_a_eliminar, setInventarioAEliminar] = useState<Inventario | null>(null);
  const [producto_seleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [producto_a_eliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [material_seleccionado, setMaterialSeleccionado] = useState<Material | null>(null);
  const [material_a_eliminar, setMaterialAEliminar] = useState<Material | null>(null);
  const [motivo_eliminar_material, setMotivoEliminarMaterial] = useState('');
  const [dialogo_editar_vencimiento_material_abierto, setDialogoEditarVencimientoMaterialAbierto] = useState(false);
  const [producto_vencimiento_seleccionado, setProductoVencimientoSeleccionado] = useState<Producto | null>(null);
  const [material_vencimiento_seleccionado, setMaterialVencimientoSeleccionado] = useState<Material | null>(null);
  const [fecha_vencimiento_edicion, setFechaVencimientoEdicion] = useState<Date | undefined>(undefined);
  const [activo_seleccionado, setActivoSeleccionado] = useState<Activo | null>(null);
  const [activo_a_eliminar, setActivoAEliminar] = useState<Activo | null>(null);
  const [busqueda_inventarios, setBusquedaInventarios] = useState('');
  const [busqueda_productos, setBusquedaProductos] = useState('');
  const [filtros_historial, setFiltrosHistorial] = useState({
    tipo_operacion: [] as string[],
    tipo_entidad: [] as string[],
    fecha_inicio: undefined as Date | undefined,
    fecha_fin: undefined as Date | undefined,
    limit: 100,
  });

  const [formulario_inventario, setFormularioInventario] = useState({
    nombre: '',
  });

  const [formulario_producto, setFormularioProducto] = useState({
    nombre: '',
    tipo: 'material' as 'material' | 'activo_fijo',
    subtipo_material: 'con_lote_vencimiento' as 'con_lote_vencimiento' | 'con_serie' | 'sin_lote',
    subtipo_activo_fijo: 'instrumental' as 'instrumental' | 'mobiliario_equipo',
    stock_minimo: '10',
    unidad_medida: '',
    descripcion: '',
    notificar_stock_bajo: true,
    permite_decimales: false,
  });

  const [formulario_material, setFormularioMaterial] = useState({
    nro_lote: '',
    nro_serie: '',
    cantidad: '0',
    costo_total: '0.00',
    costo_total_usd: '0.00',
    fecha_vencimiento: undefined as Date | undefined,
    fecha_compra: new Date(),
    registrar_egreso: true,
  });

  const [formulario_activo, setFormularioActivo] = useState({
    nro_serie: '',
    nombre_asignado: '',
    costo_compra: '0.00',
    costo_compra_usd: '0.00',
    fecha_compra: new Date(),
    estado: 'disponible',
    registrar_egreso: true,
  });

  const [formulario_ajuste_stock, setFormularioAjusteStock] = useState({
    tipo_ajuste: 'incremento' as 'incremento' | 'decremento',
    cantidad: '0',
    monto: '0.00',
    motivo: '',
    generar_movimiento_financiero: true,
    fecha_ajuste: new Date(),
  });

  const [formulario_venta_activo, setFormularioVentaActivo] = useState({
    monto_venta: '0.00',
    monto_venta_usd: '0.00',
    registrar_pago: true,
    fecha_venta: new Date(),
  });
  const [inventario_inicial, setInventarioInicial] = useState({ nombre: '' });
  const [producto_inicial, setProductoInicial] = useState({
    nombre: '',
    tipo: 'material' as 'material' | 'activo_fijo',
    subtipo_material: 'con_lote_vencimiento' as 'con_lote_vencimiento' | 'con_serie' | 'sin_lote',
    subtipo_activo_fijo: 'instrumental' as 'instrumental' | 'mobiliario_equipo',
    stock_minimo: '10',
    unidad_medida: '',
    descripcion: '',
    notificar_stock_bajo: true,
    permite_decimales: false,
  });
  const [material_inicial, setMaterialInicial] = useState({
    nro_lote: '',
    nro_serie: '',
    cantidad: '0',
    costo_total: '0.00',
    costo_total_usd: '0.00',
    fecha_vencimiento: undefined as Date | undefined,
    fecha_compra: new Date(),
    registrar_egreso: true,
  });
  const [activo_inicial, setActivoInicial] = useState({
    nro_serie: '',
    nombre_asignado: '',
    costo_compra: '0.00',
    costo_compra_usd: '0.00',
    fecha_compra: new Date(),
    estado: 'disponible',
    registrar_egreso: true,
  });

  const subtipos_material = [
    { valor: 'con_lote_vencimiento', etiqueta: 'Con Lote y Vencimiento', descripcion: 'Fármacos, medicamentos' },
    { valor: 'con_serie', etiqueta: 'Con Serie', descripcion: 'Implantes' },
    { valor: 'sin_lote', etiqueta: 'Sin Lote', descripcion: 'Papel toalla, guantes, etc.' },
  ];

  const subtipos_activo_fijo = [
    { valor: 'instrumental', etiqueta: 'Instrumental', descripcion: 'Ciclo de vida rápido' },
    { valor: 'mobiliario_equipo', etiqueta: 'Mobiliario/Equipo', descripcion: 'Ciclo de vida lento' },
  ];

  const getEstadosParaSubtipo = (_subtipo: string | undefined) => {
    return [
      { valor: 'disponible', etiqueta: 'Disponible' },
      { valor: 'en_mantenimiento', etiqueta: 'En Mantenimiento' },
      { valor: 'desechado', etiqueta: 'Desechado' },
      { valor: 'vendido', etiqueta: 'Vendido' },
    ];
  };



  type EstadoVencimiento = 'sin_vencimiento' | 'vencido' | 'semana' | 'mes' | 'tres_meses' | 'ok';

  const obtenerEstadoVencimiento = (fecha_vencimiento: Date | string | null | undefined): EstadoVencimiento => {
    if (!fecha_vencimiento) return 'sin_vencimiento';
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha_venc = new Date(fecha_vencimiento);
    if (Number.isNaN(fecha_venc.getTime())) return 'sin_vencimiento';
    fecha_venc.setHours(0, 0, 0, 0);

    if (fecha_venc < hoy) return 'vencido';
    const dias_restantes = differenceInCalendarDays(fecha_venc, hoy);
    if (dias_restantes <= 7) return 'semana';
    if (dias_restantes <= 30) return 'mes';
    if (dias_restantes <= 90) return 'tres_meses';
    return 'ok';
  };

  const formatearCantidad = (
    valor: number | string | null | undefined,
    permite_decimales?: boolean | null,
    tipo_producto?: string | null
  ): string => {
    const numero = Number(valor ?? 0);
    if (!Number.isFinite(numero)) return '0';
    if (tipo_producto === 'activo_fijo') return `${Math.trunc(numero)}`;
    if (permite_decimales === true) return numero.toFixed(2);
    return `${Math.trunc(numero)}`;
  };

  useEffect(() => {
    if (['kardex', 'bitacora', 'auditoria'].includes(tab_activo)) {
      cargarHistorial();
    }
  }, [tab_activo, inventario_seleccionado]);

  useEffect(() => {
    const cargarInicial = async () => {
      let restaurarDetallePromise: Promise<void> | null = null;

      if (seleccion?.id) {
        const id = seleccion.id;
        const nombre_cached = seleccion.nombre ?? '';

        setVistaActual('detalle');
        setInventarioSeleccionado((prev) => {
          if (prev?.id === id) return prev;
          return { id, nombre: nombre_cached } as any;
        });
        if (detalle_cache && detalle_cache.inventario?.id === id) {
          setInventarioSeleccionado(detalle_cache.inventario);
          setProductos(detalle_cache.productos || []);
          setReporteValor(detalle_cache.reporte_valor);
        }

        restaurarDetallePromise = (async () => {
          try {
            await verDetalleInventario({ id, nombre: nombre_cached } as any);
          } catch (error) {
            console.log('No se pudo restaurar el inventario guardado:', error);
            setVistaActual('lista');
            setInventarioSeleccionado(null);
            setProductos([]);
            setReporteValor(null);
            limpiarSeleccion();
            limpiarDetalleCache();
          }
        })();
      }

      await cargarInventarios();
      if (restaurarDetallePromise) await restaurarDetallePromise;
    };
    cargarInicial();
  }, []);

  const cargarInventarios = async () => {
    try {
      setCargando(true);
      const respuesta = await inventarioApi.obtenerInventarios();
      setInventarios(respuesta);
      setPrereqCargando(true);
      (async () => {
        const lista = Array.isArray(respuesta) ? respuesta : [];

        if (lista.length === 0) {
          setPrereqTieneEntradaMaterial(false);
          setPrereqTieneActivoRegistrado(false);
          return;
        }

        const ids_con_consumibles = lista
          .filter(inv => (inv.resumen?.total_consumibles ?? 0) > 0)
          .map(inv => inv.id);
        const ids_con_activos = lista
          .filter(inv => (inv.resumen?.total_activos ?? 0) > 0)
          .map(inv => inv.id);

        const ids_candidatos = Array.from(
          new Set([
            ...(ids_con_consumibles.length > 0 ? ids_con_consumibles : lista.map(inv => inv.id)),
            ...(ids_con_activos.length > 0 ? ids_con_activos : lista.map(inv => inv.id)),
          ])
        );

        let tiene_entrada_material = false;
        let tiene_activo_registrado = false;

        for (const inventario_id of ids_candidatos) {
          const productos_respuesta = await inventarioApi.obtenerProductos(inventario_id);
          const productos_lista: Producto[] = Array.isArray(productos_respuesta) ? productos_respuesta : [];

          if (!tiene_entrada_material) {
            tiene_entrada_material = productos_lista.some(
              p => p.activo !== false && p.tipo === 'material' && (p.materiales?.length ?? 0) > 0
            );
          }

          if (!tiene_activo_registrado) {
            tiene_activo_registrado = productos_lista.some(
              p => p.activo !== false && p.tipo === 'activo_fijo' && (p.activos ?? []).some(a => a.estado !== 'vendido' && a.estado !== 'desechado')
            );
          }

          if (tiene_entrada_material && tiene_activo_registrado) break;
        }

        setPrereqTieneEntradaMaterial(tiene_entrada_material);
        setPrereqTieneActivoRegistrado(tiene_activo_registrado);
      })()
        .catch(() => {
          setPrereqTieneEntradaMaterial(null);
          setPrereqTieneActivoRegistrado(null);
        })
        .finally(() => {
          setPrereqCargando(false);
        });
    } catch (error: any) {
      console.error('Error al cargar inventarios:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los inventarios',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarDetalleInventario = async (inventario: Inventario) => {
    try {
      setCargandoDetalle(true);

      const [inventario_actualizado, productos_respuesta, reporte_respuesta] = await Promise.all([
        inventarioApi.obtenerInventarioPorId(inventario.id),
        inventarioApi.obtenerProductos(inventario.id),
        inventarioApi.obtenerReporteValor(inventario.id),
      ]);
      setInventarioSeleccionado(inventario_actualizado);
      setProductos(Array.isArray(productos_respuesta) ? productos_respuesta : []);
      setReporteValor(reporte_respuesta);
      setDetalleCache({
        inventario: inventario_actualizado,
        productos: Array.isArray(productos_respuesta) ? productos_respuesta : [],
        reporte_valor: reporte_respuesta ?? null,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      console.error('Error al cargar detalle del inventario:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el detalle del inventario',
        variant: 'destructive',
      });
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cargarHistorial = async () => {
    if (!inventario_seleccionado) return;
    if (tab_activo === 'kardex') setCargandoKardex(true);
    else if (tab_activo === 'bitacora') setCargandoBitacora(true);
    else if (tab_activo === 'auditoria') setCargandoAuditoria(true);

    try {
      setCargandoDetalle(true);

      if (tab_activo === 'kardex') {
        const resultado = await inventarioApi.obtenerKardex(inventario_seleccionado.id, {
          fecha_inicio: filtros_historial.fecha_inicio ? format(filtros_historial.fecha_inicio, 'yyyy-MM-dd') : undefined,
          fecha_fin: filtros_historial.fecha_fin ? format(filtros_historial.fecha_fin, 'yyyy-MM-dd') : undefined,
          limit: filtros_historial.limit,
        });
        setKardex(resultado.registros || []);
      } else if (tab_activo === 'bitacora') {
        const resultado = await inventarioApi.obtenerBitacora(inventario_seleccionado.id, {
          fecha_inicio: filtros_historial.fecha_inicio ? format(filtros_historial.fecha_inicio, 'yyyy-MM-dd') : undefined,
          fecha_fin: filtros_historial.fecha_fin ? format(filtros_historial.fecha_fin, 'yyyy-MM-dd') : undefined,
          limit: filtros_historial.limit,
        });
        setBitacora(resultado.registros || []);
      } else if (tab_activo === 'auditoria') {
        const resultado = await inventarioApi.buscarAuditoria(inventario_seleccionado.id, {
          fecha_inicio: filtros_historial.fecha_inicio ? format(filtros_historial.fecha_inicio, 'yyyy-MM-dd') : undefined,
          fecha_fin: filtros_historial.fecha_fin ? format(filtros_historial.fecha_fin, 'yyyy-MM-dd') : undefined,
          limit: filtros_historial.limit,
        });
        setAuditoria(resultado.registros || []);
      }
    } catch (error: any) {
      console.error('Error al cargar historial:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el historial',
        variant: 'destructive',
      });
    } finally {
      setCargandoKardex(false);
      setCargandoBitacora(false);
      setCargandoAuditoria(false);
      setCargandoDetalle(false);
    }
  };

  const limpiarFiltrosHistorial = async () => {
    setFiltrosHistorial({
      tipo_operacion: [],
      tipo_entidad: [],
      fecha_inicio: undefined,
      fecha_fin: undefined,
      limit: 100,
    });
    if (!inventario_seleccionado) return;
    if (tab_activo === 'kardex') setCargandoKardex(true);
    else if (tab_activo === 'bitacora') setCargandoBitacora(true);
    else if (tab_activo === 'auditoria') setCargandoAuditoria(true);

    try {
      setCargandoDetalle(true);

      if (tab_activo === 'kardex') {
        const resultado = await inventarioApi.obtenerKardex(inventario_seleccionado.id, { limit: 100 });
        setKardex(resultado.registros || []);
      } else if (tab_activo === 'bitacora') {
        const resultado = await inventarioApi.obtenerBitacora(inventario_seleccionado.id, { limit: 100 });
        setBitacora(resultado.registros || []);
      } else if (tab_activo === 'auditoria') {
        const resultado = await inventarioApi.buscarAuditoria(inventario_seleccionado.id, { limit: 100 });
        setAuditoria(resultado.registros || []);
      }

      toast({
        title: 'Filtros limpiados',
        description: 'Mostrando registros recientes',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al cargar el historial',
        variant: 'destructive',
      });
    } finally {
      setCargandoKardex(false);
      setCargandoBitacora(false);
      setCargandoAuditoria(false);
      setCargandoDetalle(false);
    }
  };

  const contarFiltrosHistorialActivos = () => {
    let count = 0;
    if (filtros_historial.fecha_inicio) count++;
    if (filtros_historial.fecha_fin) count++;
    if (filtros_historial.tipo_operacion.length > 0) count++;
    if (filtros_historial.tipo_entidad.length > 0) count++;
    return count;
  };

  const aplicarFiltrosHistorial = () => {
    setDialogoFiltrosHistorialAbierto(false);
    cargarHistorial();
  };
  const inventarioHayCambios = useMemo(() => {
    return (formulario_inventario.nombre ?? '').trim() !== (inventario_inicial.nombre ?? '').trim();
  }, [formulario_inventario, inventario_inicial]);

  const inventarioNombreValido = useMemo(() => {
    return (formulario_inventario.nombre ?? '').trim().length > 0;
  }, [formulario_inventario.nombre]);

  const puedeGuardarInventario = useMemo(() => {
    if (!inventarioNombreValido) return false;
    if (modo_edicion) return inventarioHayCambios;
    return true;
  }, [inventarioNombreValido, inventarioHayCambios, modo_edicion]);

  const productoHayCambios = useMemo(() => {
    return formulario_producto.nombre !== producto_inicial.nombre ||
      formulario_producto.tipo !== producto_inicial.tipo ||
      formulario_producto.subtipo_material !== producto_inicial.subtipo_material ||
      formulario_producto.subtipo_activo_fijo !== producto_inicial.subtipo_activo_fijo ||
      formulario_producto.stock_minimo !== producto_inicial.stock_minimo ||
      formulario_producto.unidad_medida !== producto_inicial.unidad_medida ||
      formulario_producto.descripcion !== producto_inicial.descripcion ||
      formulario_producto.notificar_stock_bajo !== producto_inicial.notificar_stock_bajo ||
      formulario_producto.permite_decimales !== producto_inicial.permite_decimales;
  }, [formulario_producto, producto_inicial]);

  const materialHayCambios = useMemo(() => {
    return formulario_material.nro_lote !== material_inicial.nro_lote ||
      formulario_material.nro_serie !== material_inicial.nro_serie ||
      formulario_material.cantidad !== material_inicial.cantidad ||
      formulario_material.costo_total !== material_inicial.costo_total ||
      formulario_material.registrar_egreso !== material_inicial.registrar_egreso ||
      formulario_material.fecha_vencimiento?.getTime() !== material_inicial.fecha_vencimiento?.getTime();
  }, [formulario_material, material_inicial]);

  const activoHayCambios = useMemo(() => {
    return formulario_activo.nro_serie !== activo_inicial.nro_serie ||
      formulario_activo.nombre_asignado !== activo_inicial.nombre_asignado ||
      formulario_activo.costo_compra !== activo_inicial.costo_compra ||
      formulario_activo.estado !== activo_inicial.estado ||
      formulario_activo.registrar_egreso !== activo_inicial.registrar_egreso;
  }, [formulario_activo, activo_inicial]);
  const {
    handleOpenChange: handleInventarioOpenChange,
    closeConfirmationProps: inventarioCloseConfirmation,
  } = useSafeClose({
    isOpen: dialogo_inventario_abierto,
    onOpenChange: setDialogoInventarioAbierto,
    isDirty: inventarioHayCambios,
    isLoading: guardando,
  });

  const {
    handleOpenChange: handleProductoOpenChange,
    closeConfirmationProps: productoCloseConfirmation,
  } = useSafeClose({
    isOpen: dialogo_producto_abierto,
    onOpenChange: setDialogoProductoAbierto,
    isDirty: productoHayCambios,
    isLoading: guardando,
  });

  const {
    handleOpenChange: handleMaterialOpenChange,
    closeConfirmationProps: materialCloseConfirmation,
  } = useSafeClose({
    isOpen: dialogo_material_abierto,
    onOpenChange: setDialogoMaterialAbierto,
    isDirty: materialHayCambios,
    isLoading: guardando,
  });

  const {
    handleOpenChange: handleActivoOpenChange,
    closeConfirmationProps: activoCloseConfirmation,
  } = useSafeClose({
    isOpen: dialogo_activo_abierto,
    onOpenChange: setDialogoActivoAbierto,
    isDirty: activoHayCambios,
    isLoading: guardando,
  });

  const abrirDialogoNuevoInventario = () => {
    const nuevoFormulario = { nombre: '' };
    setFormularioInventario(nuevoFormulario);
    setInventarioInicial(nuevoFormulario);
    setModoEdicion(false);
    setDialogoInventarioAbierto(true);
  };

  const abrirDialogoEditarInventario = (inventario: Inventario) => {
    const nuevoFormulario = { nombre: inventario.nombre ?? '' };
    setInventarioSeleccionado(inventario);
    setFormularioInventario(nuevoFormulario);
    setInventarioInicial(nuevoFormulario);
    setModoEdicion(true);
    setDialogoInventarioAbierto(true);
  };

  const manejarGuardarInventario = async () => {
    if (!validarCampos([
      {
        id: 'inventario_nombre',
        etiqueta: 'Nombre del inventario',
        valido: (formulario_inventario.nombre ?? '').trim().length > 0,
      },
    ], 'guardar el inventario')) {
      return;
    }

    setGuardando(true);
    try {
      if (modo_edicion && inventario_seleccionado) {
        await inventarioApi.actualizarInventario(inventario_seleccionado.id, formulario_inventario);
        toast({
          title: 'Éxito',
          description: 'Inventario actualizado correctamente',
        });
        await cargarInventarios();
        if (vista_actual === 'detalle') {
          const inventario_actualizado = await inventarioApi.obtenerInventarioPorId(inventario_seleccionado.id);
          setInventarioSeleccionado(inventario_actualizado);
        }
      } else {
        await inventarioApi.crearInventario(formulario_inventario);
        toast({
          title: 'Éxito',
          description: 'Inventario creado correctamente',
        });
        await cargarInventarios();
      }

      setDialogoInventarioAbierto(false);
    } catch (error: any) {
      console.error('Error al guardar inventario:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al guardar el inventario',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoConfirmarEliminar = (inventario: Inventario) => {
    setInventarioAEliminar(inventario);
    setDialogoConfirmarEliminarAbierto(true);
  };

  const confirmarEliminarInventario = async () => {
    if (!inventario_a_eliminar) return;

    try {
      await inventarioApi.eliminarInventario(inventario_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: 'Inventario eliminado correctamente',
      });
      setDialogoConfirmarEliminarAbierto(false);
      setInventarioAEliminar(null);
      await cargarInventarios();
    } catch (error: any) {
      console.error('Error al eliminar inventario:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al eliminar el inventario',
        variant: 'destructive',
      });
    }
  };

  const verDetalleInventario = async (inventario: Inventario) => {
    setInventarioSeleccionado(inventario);
    setSeleccion({ id: inventario.id, nombre: inventario.nombre ?? '' });
    setVistaActual('detalle');
    if (detalle_cache && detalle_cache.inventario?.id === inventario.id) {
      setInventarioSeleccionado(detalle_cache.inventario);
      setProductos(detalle_cache.productos || []);
      setReporteValor(detalle_cache.reporte_valor);
    }

    await cargarDetalleInventario(inventario);
  };

  const abrirDialogoNuevoProducto = (tipo: 'material' | 'activo_fijo' = 'material') => {
    const nuevoFormulario = {
      nombre: '',
      tipo,
      subtipo_material: 'con_lote_vencimiento' as 'con_lote_vencimiento' | 'con_serie' | 'sin_lote',
      subtipo_activo_fijo: 'instrumental' as 'instrumental' | 'mobiliario_equipo',
      stock_minimo: '10',
      unidad_medida: '',
      descripcion: '',
      notificar_stock_bajo: true,
      permite_decimales: false,
    };
    setFormularioProducto(nuevoFormulario);
    setProductoInicial(nuevoFormulario);
    setModoEdicionProducto(false);
    setDialogoProductoAbierto(true);
  };

  const abrirDialogoEditarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    const nuevoFormulario = {
      nombre: producto.nombre,
      tipo: (producto.tipo || 'material') as 'material' | 'activo_fijo',
      subtipo_material: (producto.subtipo_material || 'sin_lote') as 'con_lote_vencimiento' | 'con_serie' | 'sin_lote',
      subtipo_activo_fijo: (producto.subtipo_activo_fijo || 'instrumental') as 'instrumental' | 'mobiliario_equipo',
      stock_minimo: (producto.stock_minimo ?? 0).toString(),
      unidad_medida: producto.unidad_medida ?? '',
      descripcion: producto.descripcion || '',
      notificar_stock_bajo: producto.notificar_stock_bajo ?? true,
      permite_decimales: producto.permite_decimales ?? false,
    };
    setFormularioProducto(nuevoFormulario);
    setProductoInicial(nuevoFormulario);
    setModoEdicionProducto(true);
    setDialogoProductoAbierto(true);
  };

  const manejarGuardarProducto = async () => {
    if (!inventario_seleccionado) return;

    if (!validarCampos([
      {
        id: 'producto_nombre',
        etiqueta: 'Nombre del producto',
        valido: (formulario_producto.nombre ?? '').trim().length > 0,
      },
      {
        id: 'producto_unidad_medida',
        etiqueta: 'Unidad de medida',
        valido: formulario_producto.tipo !== 'material' || (formulario_producto.unidad_medida ?? '').trim().length > 0,
      },
    ], 'guardar el producto')) {
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        nombre: formulario_producto.nombre,
        tipo: formulario_producto.tipo,
        subtipo_material: formulario_producto.tipo === 'material' ? formulario_producto.subtipo_material : undefined,
        subtipo_activo_fijo: formulario_producto.tipo === 'activo_fijo' ? formulario_producto.subtipo_activo_fijo : undefined,
        stock_minimo: formulario_producto.tipo === 'material'
          ? parseFloat(formulario_producto.stock_minimo) || 0
          : 0,
        unidad_medida: formulario_producto.tipo === 'material' ? formulario_producto.unidad_medida : undefined,
        descripcion: formulario_producto.descripcion,
        notificar_stock_bajo: formulario_producto.notificar_stock_bajo,
        permite_decimales: formulario_producto.tipo === 'material' ? formulario_producto.permite_decimales : undefined,
        inventario_id: inventario_seleccionado.id,
      };

      if (modo_edicion_producto && producto_seleccionado) {
        await inventarioApi.actualizarProducto(
          inventario_seleccionado.id,
          producto_seleccionado.id,
          datos
        );
        toast({
          title: 'Éxito',
          description: 'Producto actualizado correctamente',
        });
        setDialogoProductoAbierto(false);
        await cargarProductoIndividual(producto_seleccionado.id);
      } else {
        await inventarioApi.crearProducto(datos);
        toast({
          title: 'Éxito',
          description: 'Producto creado correctamente',
        });
        setDialogoProductoAbierto(false);
        await cargarDetalleInventario(inventario_seleccionado);
      }
    } catch (error: any) {
      console.error('Error al guardar producto:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al guardar el producto',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoConfirmarEliminarProducto = (producto: Producto) => {
    setProductoAEliminar(producto);
    setDialogoConfirmarEliminarProductoAbierto(true);
  };

  const confirmarEliminarProducto = async () => {
    if (!inventario_seleccionado || !producto_a_eliminar) return;

    try {
      await inventarioApi.eliminarProducto(inventario_seleccionado.id, producto_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: 'Producto eliminado correctamente',
      });
      setDialogoConfirmarEliminarProductoAbierto(false);
      setProductoAEliminar(null);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al eliminar producto:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al eliminar el producto',
        variant: 'destructive',
      });
    }
  };

  const abrirDialogoNuevoMaterial = (producto: Producto) => {
    setProductoSeleccionado(producto);
    const nuevoFormulario = {
      nro_lote: '',
      nro_serie: '',
      costo_total_usd: '0.00',
      cantidad: producto.permite_decimales !== false ? '0.00' : '0',
      costo_total: '0.00',
      fecha_vencimiento: undefined as Date | undefined,
      fecha_compra: new Date(),
      registrar_egreso: true,
    };
    setFormularioMaterial(nuevoFormulario);
    setMaterialInicial(nuevoFormulario);
    setDialogoMaterialAbierto(true);
  };

  const manejarGuardarMaterial = async () => {
    if (!inventario_seleccionado || !producto_seleccionado) return;

    const cantidad = parseFloat(formulario_material.cantidad || '0');
    const costo_total = parseFloat(formulario_material.costo_total || '0');
    const costo_total_usd = parseFloat(formulario_material.costo_total_usd || '0');

    if (!validarCampos([
      {
        id: 'material_cantidad',
        etiqueta: 'Cantidad',
        valido: Number.isFinite(cantidad) && cantidad > 0,
      },
      {
        id: 'material_costo_total',
        etiqueta: 'Costo total',
        valido: Number.isFinite(costo_total) && costo_total > 0,
      },
      {
        id: 'material_nro_lote',
        etiqueta: 'Número de lote',
        valido:
          producto_seleccionado?.subtipo_material !== 'con_lote_vencimiento' ||
          (formulario_material.nro_lote ?? '').trim().length > 0,
      },
      {
        id: 'material_nro_serie',
        etiqueta: 'Número de serie',
        valido:
          producto_seleccionado?.subtipo_material !== 'con_serie' ||
          (formulario_material.nro_serie ?? '').trim().length > 0,
      },
    ], 'registrar el material')) {
      return;
    }

    setGuardando(true);
    try {
      const costo_unitario = cantidad > 0 ? costo_total / cantidad : 0;
      const costo_unitario_usd = (cantidad > 0 && Number.isFinite(costo_total_usd) && costo_total_usd > 0)
        ? (costo_total_usd / cantidad)
        : 0;

      const datos_entrada = {
        producto_id: producto_seleccionado.id,
        cantidad: cantidad,
        costo_unitario: costo_unitario,
        costo_unitario_usd: costo_unitario_usd,
        tipo_entrada: 'compra' as const,
        nro_lote: formulario_material.nro_lote || undefined,
        nro_serie: formulario_material.nro_serie || undefined,
        fecha_vencimiento: formulario_material.fecha_vencimiento
          ? format(formulario_material.fecha_vencimiento, 'yyyy-MM-dd')
          : undefined,
        fecha_ingreso: serializarFechaHoraParaApi(formulario_material.fecha_compra),
        generar_egreso: formulario_material.registrar_egreso,
      };

      await inventarioApi.registrarEntradaMaterial(inventario_seleccionado.id, datos_entrada);

      toast({
        title: 'Éxito',
        description: formulario_material.registrar_egreso
          ? 'Material registrado y egreso creado en finanzas'
          : 'Material registrado correctamente',
      });

      setDialogoMaterialAbierto(false);
      await cargarProductoIndividual(producto_seleccionado.id);
    } catch (error: any) {
      console.error('Error al guardar material:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al guardar el material',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoAjusteStock = (producto: Producto, material: Material) => {
    setProductoSeleccionado(producto);
    setMaterialSeleccionado(material);
    const costo_estimado = Number(material.costo_unitario || 0);
    setFormularioAjusteStock({
      tipo_ajuste: 'incremento',
      cantidad: '1',
      monto: costo_estimado.toFixed(2),
      motivo: '',
      generar_movimiento_financiero: true,
      fecha_ajuste: new Date(),
    });
    setDialogoAjusteStockAbierto(true);
  };

  const manejarAjusteStock = async () => {
    if (!inventario_seleccionado || !producto_seleccionado || !material_seleccionado) return;

    if (!validarCampos([
      {
        id: 'ajuste_cantidad',
        etiqueta: 'Cantidad',
        valido: (formulario_ajuste_stock.cantidad ?? '').trim().length > 0,
      },
    ], 'ajustar stock')) {
      return;
    }

    const cantidad = parseFloat(formulario_ajuste_stock.cantidad);
    if (cantidad <= 0) {
      toast({
        title: 'Error',
        description: 'La cantidad debe ser mayor a 0',
        variant: 'destructive',
      });
      return;
    }

    if (formulario_ajuste_stock.tipo_ajuste === 'decremento' && cantidad > material_seleccionado.cantidad_actual) {
      toast({
        title: 'Error',
        description: 'No hay suficiente stock en este material',
        variant: 'destructive',
      });
      return;
    }

    if (!validarCampos([
      {
        id: 'ajuste_motivo',
        etiqueta: 'Motivo',
        valido: (formulario_ajuste_stock.motivo ?? '').trim().length > 0,
      },
    ], 'ajustar stock')) {
      return;
    }

    setGuardando(true);
    try {

      await inventarioApi.ajustarStock(inventario_seleccionado.id, {
        producto_id: producto_seleccionado.id,
        material_id: material_seleccionado.id,
        tipo_ajuste: formulario_ajuste_stock.tipo_ajuste,
        cantidad: cantidad,
        motivo: formulario_ajuste_stock.motivo.trim(),
        generar_movimiento_financiero: formulario_ajuste_stock.generar_movimiento_financiero,
        monto: formulario_ajuste_stock.monto ? parseFloat(formulario_ajuste_stock.monto) : undefined,
        fecha: serializarFechaHoraParaApi(formulario_ajuste_stock.fecha_ajuste),
      });

      toast({
        title: 'Éxito',
        description: 'Stock ajustado correctamente',
      });

      setDialogoAjusteStockAbierto(false);
      await cargarProductoIndividual(producto_seleccionado.id);
    } catch (error: any) {
      console.error('Error al ajustar stock:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al ajustar el stock',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoConfirmarEliminarMaterial = (material: Material) => {
    setMaterialAEliminar(material);
    setMotivoEliminarMaterial('');
    setDialogoConfirmarEliminarMaterialAbierto(true);
  };

  const confirmarEliminarMaterial = async () => {
    if (!inventario_seleccionado || !material_a_eliminar) return;

    if (!validarCampos([
      {
        id: 'material_motivo_eliminacion',
        etiqueta: 'Motivo de eliminación',
        valido: (motivo_eliminar_material ?? '').trim().length > 0,
      },
    ], 'eliminar el material')) {
      return;
    }

    try {
      await inventarioApi.eliminarMaterialConMotivo(inventario_seleccionado.id, material_a_eliminar.id, { motivo: motivo_eliminar_material.trim() });
      toast({
        title: 'Éxito',
        description: 'Material eliminado correctamente',
      });
      setDialogoConfirmarEliminarMaterialAbierto(false);
      setMaterialAEliminar(null);
      setMotivoEliminarMaterial('');
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al eliminar material:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al eliminar el material',
        variant: 'destructive',
      });
    }
  };

  const abrirDialogoEditarVencimientoMaterial = (producto: Producto, material: Material) => {
    setProductoVencimientoSeleccionado(producto);
    setMaterialVencimientoSeleccionado(material);
    setFechaVencimientoEdicion(material.fecha_vencimiento ? new Date(material.fecha_vencimiento) : undefined);
    setDialogoEditarVencimientoMaterialAbierto(true);
  };

  const confirmarEditarVencimientoMaterial = async () => {
    if (!inventario_seleccionado || !producto_vencimiento_seleccionado || !material_vencimiento_seleccionado) return;

    setGuardando(true);
    try {
      await inventarioApi.actualizarMaterial(inventario_seleccionado.id, material_vencimiento_seleccionado.id, {
        fecha_vencimiento: fecha_vencimiento_edicion ? format(fecha_vencimiento_edicion, 'yyyy-MM-dd') : null,
      });

      toast({
        title: 'Éxito',
        description: 'Vencimiento actualizado correctamente',
      });

      setDialogoEditarVencimientoMaterialAbierto(false);
      setMaterialVencimientoSeleccionado(null);
      setProductoVencimientoSeleccionado(null);
      await cargarProductoIndividual(producto_vencimiento_seleccionado.id);
    } catch (error: any) {
      console.error('Error al actualizar vencimiento:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al actualizar el vencimiento',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const desecharMaterialCaducado = async (producto: Producto, material: Material) => {
    if (!inventario_seleccionado) return;
    setProductosCargando(prev => new Set(prev).add(producto.id));

    try {
      await inventarioApi.desecharMaterialCaducado(inventario_seleccionado.id, material.id);
      toast({
        title: 'Éxito',
        description: 'Material desechado correctamente',
      });
      await cargarProductoIndividual(producto.id);
    } catch (error: any) {
      console.error('Error al desechar material:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al desechar el material',
        variant: 'destructive',
      });
    } finally {
      setProductosCargando(prev => {
        const nuevo = new Set(prev);
        nuevo.delete(producto.id);
        return nuevo;
      });
    }
  };

  const abrirDialogoNuevoActivo = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setMotivoCambioEstadoActivo('');
    const nuevoFormulario = {
      nro_serie: '',
      nombre_asignado: '',
      costo_compra: '0.00',
      costo_compra_usd: '0.00',
      fecha_compra: new Date(),
      estado: 'disponible',
      registrar_egreso: true,
    };
    setFormularioActivo(nuevoFormulario);
    setActivoInicial(nuevoFormulario);
    setModoEdicionActivo(false);
    setDialogoActivoAbierto(true);
  };

  const abrirDialogoEditarActivo = (producto: Producto, activo: Activo) => {
    setProductoSeleccionado(producto);
    setActivoSeleccionado(activo);
    setMotivoCambioEstadoActivo('');
    const nuevoFormulario = {
      nro_serie: activo.nro_serie || '',
      nombre_asignado: activo.nombre_asignado || '',
      costo_compra_usd: '',
      costo_compra: Number(activo.costo_compra ?? 0).toFixed(2),
      fecha_compra: activo.fecha_compra ? new Date(activo.fecha_compra) : new Date(),
      estado: activo.estado,
      registrar_egreso: false,
    };
    setFormularioActivo(nuevoFormulario);
    setActivoInicial(nuevoFormulario);
    setModoEdicionActivo(true);
    setDialogoActivoAbierto(true);
  };

  const manejarGuardarActivo = async () => {
    if (!inventario_seleccionado || !producto_seleccionado) return;

    const costo_compra = parseFloat(formulario_activo.costo_compra || '0');
    const costo_compra_usd = parseFloat(formulario_activo.costo_compra_usd || '0');
    if (!validarCampos([
      {
        id: 'activo_costo_compra',
        etiqueta: 'Costo de compra',
        valido: Number.isFinite(costo_compra) && costo_compra > 0,
      },
      {
        id: 'activo_nro_serie',
        etiqueta: 'Número de serie',
        valido:
          modo_edicion_activo ||
          producto_seleccionado?.subtipo_activo_fijo !== 'instrumental' ||
          (formulario_activo.nro_serie ?? '').trim().length > 0,
      },
    ], 'registrar el activo')) {
      return;
    }

    setGuardando(true);
    try {
      if (modo_edicion_activo && activo_seleccionado) {
        const estado_cambio = formulario_activo.estado !== (activo_inicial.estado as any);
        if (!validarCampos([
          {
            id: 'activo_motivo_cambio_estado',
            etiqueta: 'Motivo de cambio de estado',
            valido: !estado_cambio || (motivo_cambio_estado_activo ?? '').trim().length > 0,
          },
        ], 'actualizar el activo')) {
          return;
        }

        await inventarioApi.actualizarActivo(
          inventario_seleccionado.id,
          activo_seleccionado.id,
          {
            nro_serie: formulario_activo.nro_serie || undefined,
            nombre_asignado: formulario_activo.nombre_asignado || undefined,
          }
        );

        if (estado_cambio) {
          await inventarioApi.cambiarEstadoActivo(
            inventario_seleccionado.id,
            activo_seleccionado.id,
            { estado: formulario_activo.estado, motivo: motivo_cambio_estado_activo.trim() }
          );
        }
        toast({
          title: 'Éxito',
          description: 'Activo actualizado correctamente',
        });
        setDialogoActivoAbierto(false);
        setMotivoCambioEstadoActivo('');
        await cargarProductoIndividual(producto_seleccionado.id);
      } else {
        const datos_entrada = {
          producto_id: producto_seleccionado.id,
          costo_compra: costo_compra,
          costo_compra_usd: Number.isFinite(costo_compra_usd) && costo_compra_usd > 0 ? costo_compra_usd : 0,
          tipo_entrada: 'compra' as const,
          nro_serie: formulario_activo.nro_serie || undefined,
          nombre_asignado: formulario_activo.nombre_asignado || undefined,
          fecha_compra: serializarFechaHoraParaApi(formulario_activo.fecha_compra),
          generar_egreso: formulario_activo.registrar_egreso,
        };

        await inventarioApi.registrarEntradaActivo(inventario_seleccionado.id, datos_entrada);

        toast({
          title: 'Éxito',
          description: formulario_activo.registrar_egreso
            ? 'Activo registrado y egreso creado en finanzas'
            : 'Activo registrado correctamente',
        });
        setDialogoActivoAbierto(false);
        await cargarProductoIndividual(producto_seleccionado.id);
      }
    } catch (error: any) {
      console.error('Error al guardar activo:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al guardar el activo',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const refrescarResumenInventario = async (inventario_id: number, productos_actualizados?: Producto[]) => {
    const [inventario_actualizado, reporte_respuesta] = await Promise.all([
      inventarioApi.obtenerInventarioPorId(inventario_id),
      inventarioApi.obtenerReporteValor(inventario_id),
    ]);

    setInventarioSeleccionado(inventario_actualizado);
    setReporteValor(reporte_respuesta ?? null);
    setDetalleCache({
      inventario: inventario_actualizado,
      productos: productos_actualizados ?? productos,
      reporte_valor: reporte_respuesta ?? null,
      timestamp: Date.now(),
    });
  };

  const cargarProductoIndividual = async (producto_id: number) => {
    if (!inventario_seleccionado) return;

    setProductosCargando(prev => new Set(prev).add(producto_id));

    try {
      const producto_actualizado = await inventarioApi.obtenerProductoPorId(
        inventario_seleccionado.id,
        producto_id
      );

      let productos_actualizados: Producto[] = [];

      setProductos(prev => {
        productos_actualizados = prev.map(p => (p.id === producto_id ? producto_actualizado : p));
        return productos_actualizados;
      });

      await refrescarResumenInventario(inventario_seleccionado.id, productos_actualizados);
    } catch (error: any) {
      console.error('Error al cargar producto:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al cargar el producto',
        variant: 'destructive',
      });
    } finally {
      setProductosCargando(prev => {
        const nuevo = new Set(prev);
        nuevo.delete(producto_id);
        return nuevo;
      });
    }
  };

  const manejarCambioEstadoActivo = async (producto: Producto, activo: Activo, nuevo_estado: string) => {
    if (!inventario_seleccionado) return;
    if (nuevo_estado === activo.estado) return;

    if (nuevo_estado === 'desechado' && activo.estado !== 'desechado') {
      setActivoADesechar({ producto, activo });
      setMotivoCambioEstadoActivo('');
      setDialogoConfirmarCambioDesechadoAbierto(true);
      return;
    }

    setProductosCargando(prev => new Set(prev).add(producto.id));

    try {
      await inventarioApi.cambiarEstadoActivo(
        inventario_seleccionado.id,
        activo.id,
        { estado: nuevo_estado, motivo: 'Cambio de estado manual' }
      );

      toast({
        title: 'Éxito',
        description: 'Estado actualizado correctamente',
      });

      await cargarProductoIndividual(producto.id);
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al cambiar el estado',
        variant: 'destructive',
      });
    } finally {
      setProductosCargando(prev => {
        const nuevo = new Set(prev);
        nuevo.delete(producto.id);
        return nuevo;
      });
    }
  };

  const confirmarCambioDesechado = async () => {
    if (!inventario_seleccionado || !activo_a_desechar) return;

    if (!validarCampos([
      {
        id: 'activo_motivo_desechado',
        etiqueta: 'Motivo de desecho',
        valido: (motivo_cambio_estado_activo ?? '').trim().length > 0,
      },
    ], 'marcar el activo como desechado')) {
      return;
    }

    setProductosCargando(prev => new Set(prev).add(activo_a_desechar.producto.id));

    try {
      await inventarioApi.cambiarEstadoActivo(
        inventario_seleccionado.id,
        activo_a_desechar.activo.id,
        { estado: 'desechado', motivo: motivo_cambio_estado_activo.trim() }
      );

      toast({
        title: 'Éxito',
        description: 'Activo marcado como desechado y eliminado correctamente',
      });

      setDialogoConfirmarCambioDesechadoAbierto(false);
      setActivoADesechar(null);
      setMotivoCambioEstadoActivo('');
      await cargarProductoIndividual(activo_a_desechar.producto.id);
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al cambiar el estado',
        variant: 'destructive',
      });
    } finally {
      if (activo_a_desechar) {
        setProductosCargando(prev => {
          const nuevo = new Set(prev);
          nuevo.delete(activo_a_desechar.producto.id);
          return nuevo;
        });
      }
    }
  };

  const abrirDialogoConfirmarEliminarActivo = (activo: Activo) => {
    setActivoAEliminar(activo);
    setDialogoConfirmarEliminarActivoAbierto(true);
  };

  const confirmarEliminarActivo = async () => {
    if (!inventario_seleccionado || !activo_a_eliminar) return;

    try {
      await inventarioApi.eliminarActivo(inventario_seleccionado.id, activo_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: 'Activo eliminado correctamente',
      });
      setDialogoConfirmarEliminarActivoAbierto(false);
      setActivoAEliminar(null);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al eliminar activo:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al eliminar el activo',
        variant: 'destructive',
      });
    }
  };

  const abrirDialogoVenderActivo = (activo: Activo) => {
    setActivoSeleccionado(activo);
    const precio_sugerido = (Number(activo.costo_compra) * 0.7).toFixed(2);
    const tasa = config_clinica?.cambio_dolar || 6.96;
    const precio_sugerido_usd = (parseFloat(precio_sugerido) / tasa).toFixed(2);

    setFormularioVentaActivo({
      monto_venta: precio_sugerido,
      monto_venta_usd: precio_sugerido_usd,
      registrar_pago: true,
      fecha_venta: new Date(),
    });
    setDialogoVenderActivoAbierto(true);
  };

  const manejarVenderActivo = async () => {
    if (!inventario_seleccionado || !activo_seleccionado) return;

    if (!validarCampos([
      {
        id: 'activo_monto_venta',
        etiqueta: 'Monto de venta',
        valido: (formulario_venta_activo.monto_venta ?? '').trim().length > 0,
      },
    ], 'vender el activo')) {
      return;
    }

    const monto = parseFloat(formulario_venta_activo.monto_venta);
    const monto_usd = parseFloat(formulario_venta_activo.monto_venta_usd || '0');
    if (monto <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser mayor a 0',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      await inventarioApi.venderActivo(inventario_seleccionado.id, activo_seleccionado.id, {
        monto_venta: monto,
        monto_venta_usd: Number.isFinite(monto_usd) && monto_usd > 0 ? monto_usd : 0,
        registrar_pago: formulario_venta_activo.registrar_pago,
        tipo_salida: 'venta',
        fecha_venta: serializarFechaHoraParaApi(formulario_venta_activo.fecha_venta),
      });

      toast({
        title: 'Éxito',
        description: 'Activo vendido correctamente',
      });

      setDialogoVenderActivoAbierto(false);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al vender activo:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al vender el activo',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const volverALista = () => {
    setVistaActual('lista');
    setInventarioSeleccionado(null);
    setProductos([]);
    setReporteValor(null);
    setTabActivo('productos');
    limpiarSeleccion();
    limpiarDetalleCache();
  };

  const obtenerColorTipoGestion = (tipo?: string): string => {
    const colores: { [key: string]: string } = {
      material: 'bg-purple-500',
      activo_fijo: 'bg-blue-500',
    };
    return colores[tipo || ''] || 'bg-gray-500';
  };

  const obtenerEtiquetaTipoGestion = (tipo?: string): string => {
    const tipos: { [key: string]: string } = {
      material: 'Material',
      activo_fijo: 'Activo Fijo',
    };
    return tipos[tipo || ''] || tipo || 'Desconocido';
  };

  const obtenerStockTotal = (producto: Producto): number => {
    if (producto.tipo === 'material') {
      const materiales = producto.materiales || [];
      return materiales.reduce((total, m) => total + Number(m.cantidad_actual), 0);
    }
    return producto.activos?.length || 0;
  };

  const obtenerValorTotal = (producto: Producto): number => {
    if (producto.tipo === 'material') {
      const materiales = producto.materiales || [];
      return materiales.reduce((total, m) => total + (Number(m.cantidad_actual) * Number(m.costo_unitario || 0)), 0);
    }
    if (producto.activos) {
      return producto.activos.reduce((total, activo) => total + Number(activo.costo_compra), 0);
    }
    return 0;
  };

  const obtenerValorTotalUSD = (producto: Producto): number => {
    if (producto.tipo === 'material') {
      const materiales = producto.materiales || [];
      return materiales.reduce((total, m) => {
        const usd = Number((m as any).costo_unitario_usd || 0);
        if (usd > 0) return total + (Number(m.cantidad_actual) * usd);
        return total + obtenerUSDDesdeLocal(Number(m.cantidad_actual) * Number(m.costo_unitario || 0));
      }, 0);
    }
    if (producto.activos) {
      return producto.activos.reduce((total, a) => {
        const usd = Number((a as any).costo_compra_usd || 0);
        if (usd > 0) return total + usd;
        return total + obtenerUSDDesdeLocal(Number(a.costo_compra || 0));
      }, 0);
    }
    return 0;
  };

  const compararCambios = (anterior: any, nuevo: any) => {
    if (typeof anterior === 'string') {
      try { anterior = JSON.parse(anterior); } catch (e) { console.error('Error parsing anterior:', e); }
    }
    if (typeof nuevo === 'string') {
      try { nuevo = JSON.parse(nuevo); } catch (e) { console.error('Error parsing nuevo:', e); }
    }

    if (!anterior && !nuevo) return { campos: [], valoresAnteriores: {}, valoresNuevos: {}, camposModificados: new Set<string>() };
    if (!anterior) anterior = {};
    if (!nuevo) nuevo = {};
    const camposRelevantes: { [key: string]: string[] } = {
      inventario: ['nombre', 'visibilidad', 'descripcion'],
      producto: ['nombre', 'tipo', 'subtipo_material', 'subtipo_activo_fijo', 'stock_minimo', 'unidad_medida', 'descripcion', 'notificar_stock_bajo', 'permite_decimales'],
      material: ['nro_lote', 'nro_serie', 'fecha_vencimiento', 'cantidad_actual', 'cantidad_reservada', 'costo_unitario', 'fecha_ingreso'],
      activo: ['codigo_interno', 'nro_serie', 'nombre_asignado', 'estado', 'fecha_adquisicion', 'fecha_compra', 'costo_adquisicion', 'costo_compra', 'notas'],
    };
    let camposAMostrar: string[] = [];
    if (anterior.visibilidad !== undefined || nuevo.visibilidad !== undefined) {
      camposAMostrar = camposRelevantes.inventario;
    } else if (anterior.tipo !== undefined || nuevo.tipo !== undefined || anterior.subtipo_material !== undefined) {
      camposAMostrar = camposRelevantes.producto;
    } else if (anterior.nro_lote !== undefined || anterior.fecha_vencimiento !== undefined || nuevo.cantidad_actual !== undefined) {
      camposAMostrar = camposRelevantes.material;
    } else if (anterior.estado !== undefined || anterior.nombre_asignado !== undefined) {
      camposAMostrar = camposRelevantes.activo;
    } else {
      const todosCampos = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);
      camposAMostrar = Array.from(todosCampos).filter(campo =>
        !campo.startsWith('_') && !['id', 'created_at', 'updated_at', 'deleted_at', 'activo'].includes(campo)
      );
      camposAMostrar = camposAMostrar.filter(campo => campo !== 'ubicacion');
    }

    const campos: string[] = [];
    const valoresAnteriores: { [key: string]: string } = {};
    const valoresNuevos: { [key: string]: string } = {};
    const camposModificados = new Set<string>();
    const nombresAmigables: { [key: string]: string } = {
      nombre: 'Nombre',
      visibilidad: 'Visibilidad',
      descripcion: 'Descripción',
      tipo: 'Tipo',
      subtipo_material: 'Subtipo Material',
      subtipo_activo_fijo: 'Subtipo Activo',
      stock_minimo: 'Stock Mínimo',
      unidad_medida: 'Unidad de Medida',
      notificar_stock_bajo: 'Notificar Stock Bajo',
      permite_decimales: 'Permite Decimales',
      nro_lote: 'Nro. Lote',
      nro_serie: 'Nro. Serie',
      fecha_vencimiento: 'Fecha Vencimiento',
      cantidad_actual: 'Cantidad Actual',
      cantidad_reservada: 'Cantidad Reservada',
      costo_unitario: 'Costo Unitario',
      fecha_ingreso: 'Fecha Ingreso',
      codigo_interno: 'Código Interno',
      nombre_asignado: 'Nombre Asignado',
      estado: 'Estado',
      fecha_adquisicion: 'Fecha Adquisición',
      fecha_compra: 'Fecha Compra',
      costo_adquisicion: 'Costo Adquisición',
      costo_compra: 'Costo Compra',
      notas: 'Notas'
    };

    camposAMostrar.forEach(campo => {
      const valorAnterior = anterior[campo];
      const valorNuevo = nuevo[campo];
      if (valorAnterior === undefined && valorNuevo === undefined) return;

      const sonDiferentes = JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo);
      const nombreCampo = nombresAmigables[campo] || campo.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

      campos.push(nombreCampo);
      valoresAnteriores[nombreCampo] = formatearValor(valorAnterior);
      valoresNuevos[nombreCampo] = formatearValor(valorNuevo);

      if (sonDiferentes) {
        camposModificados.add(nombreCampo);
      }
    });

    return { campos, valoresAnteriores, valoresNuevos, camposModificados };
  };

  const formatearValor = (valor: any): string => {
    if (valor === null || valor === undefined) return 'SIN DATOS';
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    if (typeof valor === 'object') {
      if (Array.isArray(valor)) return valor.length > 0 ? JSON.stringify(valor) : '-';
      return JSON.stringify(valor);
    }
    return String(valor);
  };

  const {
    items_filtrados: inventarios_filtrados,
    items_paginados: inventarios_paginados,
    pagina_actual: pagina_actual_inventarios,
    setPaginaActual: setPaginaActualInventarios,
    items_por_pagina: inventarios_por_pagina,
    setItemsPorPagina: setInventariosPorPagina,
    total_paginas: total_paginas_inventarios,
  } = useBusquedaPaginacion({
    items: inventarios,
    busqueda: busqueda_inventarios,
    obtenerTexto: (inv) => inv.nombre,
    items_por_pagina_inicial: 3,
  });

  const productos_consumibles_base = useMemo(
    () => productos.filter((p) => p.activo !== false && p.tipo === 'material'),
    [productos],
  );

  const productos_activos_fijos_base = useMemo(
    () => productos.filter((p) => p.activo !== false && p.tipo === 'activo_fijo'),
    [productos],
  );

  const {
    items_filtrados: consumibles_filtrados,
    items_paginados: consumibles_paginados,
    pagina_actual: pagina_actual_consumibles,
    setPaginaActual: setPaginaActualConsumibles,
    items_por_pagina: consumibles_por_pagina,
    setItemsPorPagina: setConsumiblesPorPagina,
    total_paginas: total_paginas_consumibles,
  } = useBusquedaPaginacion({
    items: productos_consumibles_base,
    busqueda: busqueda_productos,
    obtenerTexto: (p) => `${p.nombre} ${p.descripcion ?? ''}`,
    items_por_pagina_inicial: 5,
  });

  const {
    items_filtrados: activos_fijos_filtrados,
    items_paginados: activos_fijos_paginados,
    pagina_actual: pagina_actual_activos_fijos,
    setPaginaActual: setPaginaActualActivosFijos,
    items_por_pagina: activos_fijos_por_pagina,
    setItemsPorPagina: setActivosFijosPorPagina,
    total_paginas: total_paginas_activos_fijos,
  } = useBusquedaPaginacion({
    items: productos_activos_fijos_base,
    busqueda: busqueda_productos,
    obtenerTexto: (p) => `${p.nombre} ${p.descripcion ?? ''}`,
    items_por_pagina_inicial: 5,
  });

  const HISTORIAL_TODOS = 999999;

  const {
    items_filtrados: kardex_filtrado,
    items_paginados: kardex_paginado,
    pagina_actual: pagina_actual_kardex,
    setPaginaActual: setPaginaActualKardex,
    items_por_pagina: kardex_por_pagina,
    setItemsPorPagina: setKardexPorPagina,
    total_paginas: total_paginas_kardex,
  } = useBusquedaPaginacion({
    items: kardex,
    busqueda: '',
    obtenerTexto: (mov) => `${mov.tipo ?? ''} ${mov.operacion ?? ''} ${mov.motivo ?? ''} ${mov.observaciones ?? ''} ${mov.producto?.nombre ?? ''}`,
    items_por_pagina_inicial: 10,
  });

  const {
    items_filtrados: bitacora_filtrada,
    items_paginados: bitacora_paginada,
    pagina_actual: pagina_actual_bitacora,
    setPaginaActual: setPaginaActualBitacora,
    items_por_pagina: bitacora_por_pagina,
    setItemsPorPagina: setBitacoraPorPagina,
    total_paginas: total_paginas_bitacora,
  } = useBusquedaPaginacion({
    items: bitacora,
    busqueda: '',
    obtenerTexto: (ev) => `${ev.estado_anterior ?? ''} ${ev.estado_nuevo ?? ''} ${ev.motivo ?? ''} ${ev.descripcion ?? ''} ${ev.activo?.nro_serie ?? ''} ${ev.activo?.codigo_interno ?? ''}`,
    items_por_pagina_inicial: 10,
  });

  const {
    items_filtrados: auditoria_filtrada,
    items_paginados: auditoria_paginada,
    pagina_actual: pagina_actual_auditoria,
    setPaginaActual: setPaginaActualAuditoria,
    items_por_pagina: auditoria_por_pagina,
    setItemsPorPagina: setAuditoriaPorPagina,
    total_paginas: total_paginas_auditoria,
  } = useBusquedaPaginacion({
    items: auditoria,
    busqueda: '',
    obtenerTexto: (reg) => `${reg.accion ?? ''} ${reg.categoria ?? ''} ${reg.producto?.nombre ?? ''} ${(reg.material as any)?.nro_lote ?? ''} ${(reg.material as any)?.nro_serie ?? ''} ${reg.activo?.nro_serie ?? ''} ${reg.activo?.codigo_interno ?? ''}`,
    items_por_pagina_inicial: 10,
  });

  const resumen_detalle = useMemo(() => {
    const activos = productos.filter((p) => p.activo !== false);
    const consumibles = activos.filter((p) => p.tipo === 'material');
    const activos_fijos = activos.filter((p) => p.tipo === 'activo_fijo');

    const consumibles_stock_bajo = consumibles.filter((p) => {
      const notifica = p.notificar_stock_bajo !== false;
      if (!notifica) return false;
      return obtenerStockTotal(p) < (p.stock_minimo ?? 0);
    }).length;

    const activos_en_mantenimiento = activos_fijos.reduce((acc, p) => {
      const count = (p.activos ?? []).filter(
        (a) => a.estado === 'en_mantenimiento',
      ).length;
      return acc + count;
    }, 0);

    return {
      total_productos: activos.length,
      consumibles_count: consumibles.length,
      activos_fijos_count: activos_fijos.length,
      consumibles_stock_bajo,
      activos_en_mantenimiento,
    };
  }, [productos]);

  const condicionesBloqueoTutoriales = useMemo(() => {
    const tieneInventarios = inventarios.length > 0;
    const tieneMaterialEnDetalle = productos.some(p => p.activo !== false && p.tipo === 'material');
    const tieneActivoFijoEnDetalle = productos.some(p => p.activo !== false && p.tipo === 'activo_fijo');
    const tieneMaterialEnResumen = inventarios.some(inv => (inv.resumen?.total_consumibles ?? 0) > 0);
    const tieneActivoFijoEnResumen = inventarios.some(inv => (inv.resumen?.total_activos ?? 0) > 0);
    const tieneMaterial = tieneMaterialEnDetalle || tieneMaterialEnResumen;
    const tieneActivoFijo = tieneActivoFijoEnDetalle || tieneActivoFijoEnResumen;
    const tieneEntradaMaterialEnDetalle = productos.some(
      p => p.activo !== false && p.tipo === 'material' && (p.materiales?.length ?? 0) > 0
    );
    const tieneActivoRegistradoEnDetalle = productos.some(
      p => p.activo !== false && p.tipo === 'activo_fijo' && (p.activos ?? []).some(a => a.estado !== 'vendido' && a.estado !== 'desechado')
    );

    const tieneEntradaMaterial = tieneEntradaMaterialEnDetalle || prereq_tiene_entrada_material === true;
    const tieneActivoRegistrado = tieneActivoRegistradoEnDetalle || prereq_tiene_activo_registrado === true;

    return {
      'inventarios-crear-consumible': {
        bloqueado: !tieneInventarios,
        mensaje: 'Requiere crear al menos un inventario.',
      },
      'inventarios-crear-activo-fijo': {
        bloqueado: !tieneInventarios,
        mensaje: 'Requiere crear al menos un inventario.',
      },
      'inventarios-registrar-entrada': {
        bloqueado: !tieneInventarios || !tieneMaterial,
        mensaje: !tieneInventarios
          ? 'Requiere crear al menos un inventario.'
          : 'Requiere tener al menos un producto tipo material.',
      },
      'inventarios-ajustar-stock': {
        bloqueado: !tieneInventarios || !tieneMaterial || !tieneEntradaMaterial,
        mensaje: !tieneInventarios
          ? 'Requiere crear al menos un inventario.'
          : !tieneMaterial
            ? 'Requiere tener al menos un producto tipo material.'
            : prereq_cargando
              ? 'Verificando prerequisitos...'
              : 'Requiere tener al menos una entrada registrada en un material.',
      },
      'inventarios-registrar-activo': {
        bloqueado: !tieneInventarios || !tieneActivoFijo,
        mensaje: !tieneInventarios
          ? 'Requiere crear al menos un inventario.'
          : 'Requiere tener al menos un producto tipo activo fijo.',
      },
      'inventarios-vender-activo': {
        bloqueado: !tieneInventarios || !tieneActivoFijo || !tieneActivoRegistrado,
        mensaje: !tieneInventarios
          ? 'Requiere crear al menos un inventario.'
          : !tieneActivoFijo
            ? 'Requiere tener al menos un producto tipo activo fijo.'
            : prereq_cargando
              ? 'Verificando prerequisitos...'
              : 'Requiere tener al menos un activo registrado.',
      },
      'inventarios-entender-historiales': {
        bloqueado: !tieneInventarios,
        mensaje: 'Requiere crear al menos un inventario.',
      },
    };
  }, [inventarios, productos, prereq_tiene_entrada_material, prereq_tiene_activo_registrado, prereq_cargando]);

  const tutorialesConCondiciones = useMemo(() => {
    const tieneInventarios = inventarios.length > 0;
    const tieneMaterialEnDetalle = productos.some(p => p.activo !== false && p.tipo === 'material');
    const tieneActivoFijoEnDetalle = productos.some(p => p.activo !== false && p.tipo === 'activo_fijo');
    const tieneMaterialEnResumen = inventarios.some(inv => (inv.resumen?.total_consumibles ?? 0) > 0);
    const tieneActivoFijoEnResumen = inventarios.some(inv => (inv.resumen?.total_activos ?? 0) > 0);
    const tieneMaterial = tieneMaterialEnDetalle || tieneMaterialEnResumen;
    const tieneActivoFijo = tieneActivoFijoEnDetalle || tieneActivoFijoEnResumen;
    const tieneEntradaMaterialEnDetalle = productos.some(
      p => p.activo !== false && p.tipo === 'material' && (p.materiales?.length ?? 0) > 0
    );
    const tieneActivoRegistradoEnDetalle = productos.some(
      p => p.activo !== false && p.tipo === 'activo_fijo' && (p.activos ?? []).some(a => a.estado !== 'vendido' && a.estado !== 'desechado')
    );

    const tieneEntradaMaterial = tieneEntradaMaterialEnDetalle || prereq_tiene_entrada_material === true;
    const tieneActivoRegistrado = tieneActivoRegistradoEnDetalle || prereq_tiene_activo_registrado === true;

    return TUTORIALES_INVENTARIOS.map(tutorial => {
      if (tutorial.nombre === 'inventarios-crear-consumible' && tutorial.condicionBloqueo) {
        return {
          ...tutorial,
          condicionBloqueo: {
            ...tutorial.condicionBloqueo,
            condicionesPrevias: [
              {
                id: 'tiene-inventarios',
                descripcion: 'Crear al menos un inventario',
                completada: tieneInventarios,
              },
            ],
          },
        };
      }

      if (tutorial.nombre === 'inventarios-crear-activo-fijo' && tutorial.condicionBloqueo) {
        return {
          ...tutorial,
          condicionBloqueo: {
            ...tutorial.condicionBloqueo,
            condicionesPrevias: [
              {
                id: 'tiene-inventarios',
                descripcion: 'Crear al menos un inventario',
                completada: tieneInventarios,
              },
            ],
          },
        };
      }

      if (tutorial.nombre === 'inventarios-entender-historiales' && tutorial.condicionBloqueo) {
        return {
          ...tutorial,
          condicionBloqueo: {
            ...tutorial.condicionBloqueo,
            condicionesPrevias: [
              {
                id: 'tiene-inventarios',
                descripcion: 'Crear al menos un inventario',
                completada: tieneInventarios,
              },
            ],
          },
        };
      }

      if (tutorial.nombre === 'inventarios-registrar-entrada' && tutorial.condicionBloqueo) {
        return {
          ...tutorial,
          condicionBloqueo: {
            ...tutorial.condicionBloqueo,
            condicionesPrevias: [
              {
                id: 'tiene-inventarios',
                descripcion: 'Crear al menos un inventario',
                completada: tieneInventarios,
              },
              {
                id: 'tiene-material',
                descripcion: 'Tener al menos un producto tipo material',
                completada: tieneMaterial,
              },
            ],
          },
        };
      }

      if (tutorial.nombre === 'inventarios-ajustar-stock' && tutorial.condicionBloqueo) {
        return {
          ...tutorial,
          condicionBloqueo: {
            ...tutorial.condicionBloqueo,
            condicionesPrevias: [
              {
                id: 'tiene-inventarios',
                descripcion: 'Crear al menos un inventario',
                completada: tieneInventarios,
              },
              {
                id: 'tiene-material',
                descripcion: 'Tener al menos un producto tipo material',
                completada: tieneMaterial,
              },
              {
                id: 'tiene-entrada-material',
                descripcion: 'Tener al menos una entrada registrada en un material',
                completada: tieneEntradaMaterial,
              },
            ],
          },
        };
      }

      if (tutorial.nombre === 'inventarios-registrar-activo' && tutorial.condicionBloqueo) {
        return {
          ...tutorial,
          condicionBloqueo: {
            ...tutorial.condicionBloqueo,
            condicionesPrevias: [
              {
                id: 'tiene-inventarios',
                descripcion: 'Crear al menos un inventario',
                completada: tieneInventarios,
              },
              {
                id: 'tiene-activo-fijo',
                descripcion: 'Tener al menos un producto tipo activo fijo',
                completada: tieneActivoFijo,
              },
            ],
          },
        };
      }

      if (tutorial.nombre === 'inventarios-vender-activo' && tutorial.condicionBloqueo) {
        return {
          ...tutorial,
          condicionBloqueo: {
            ...tutorial.condicionBloqueo,
            condicionesPrevias: [
              {
                id: 'tiene-inventarios',
                descripcion: 'Crear al menos un inventario',
                completada: tieneInventarios,
              },
              {
                id: 'tiene-activo-fijo',
                descripcion: 'Tener al menos un producto tipo activo fijo',
                completada: tieneActivoFijo,
              },
              {
                id: 'tiene-activo-registrado',
                descripcion: 'Tener al menos un activo registrado',
                completada: tieneActivoRegistrado,
              },
            ],
          },
        };
      }

      return tutorial;
    });
  }, [inventarios, productos, prereq_tiene_entrada_material, prereq_tiene_activo_registrado]);


  if (cargando) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <MenuLateral />
        <Toaster />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando inventarios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProveedorTutorialesPagina
      pagina="/inventarios"
      definicionesTutoriales={tutorialesConCondiciones}
      condicionesBloqueo={condicionesBloqueoTutoriales}
    >
      <div className="flex h-screen bg-background overflow-hidden">
        <MenuLateral />
        <Toaster />
        <TutorialModalWrapper tema="Inventarios" />

        {vista_actual === 'lista' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-8 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <h1
                  id={IDS_ELEMENTOS_INVENTARIOS.TITULO_PAGINA}
                  className="text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200"
                >
                  <TituloAccionable titulo="Inventarios">Inventarios</TituloAccionable>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Gestiona tus inventarios de productos y materiales
                </p>
              </div>

              <Button
                id={IDS_ELEMENTOS_INVENTARIOS.BTN_NUEVO_INVENTARIO}
                onClick={abrirDialogoNuevoInventario}
                size="lg"
                className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Inventario
              </Button>
            </div>

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar inventarios..."
                    value={busqueda_inventarios}
                    onChange={(e) => setBusquedaInventarios(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">Mostrar:</Label>
                  <Select
                    value={inventarios_por_pagina.toString()}
                    onValueChange={(v) => {
                      setInventariosPorPagina(Number(v));
                      setPaginaActualInventarios(1);
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {inventarios_filtrados.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {busqueda_inventarios ? 'No se encontraron inventarios' : 'No hay inventarios'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {busqueda_inventarios
                      ? 'Intenta con otros términos de búsqueda'
                      : 'Comienza creando tu primer inventario para gestionar productos y materiales'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {inventarios_paginados.map((inventario) => {
                  return (
                    <Card
                      key={inventario.id}
                      id={`inventario-card-${inventario.id}`}
                      className="hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer"
                      onClick={() => verDetalleInventario(inventario)}
                    >
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg whitespace-normal break-words">
                                {inventario.nombre}
                              </CardTitle>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirDialogoEditarInventario(inventario);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirDialogoConfirmarEliminar(inventario);
                              }}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 px-4 pb-4">
                        <div className="space-y-2">
                          {inventario.resumen && (
                            <div className="grid grid-cols-4 gap-2">
                              <div className="group p-1.5 bg-muted/50 rounded-md border border-border hover:bg-muted hover:border-primary/30 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-1.5 mb-0">
                                  <Coins className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Valor</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                  {formatearMonto(
                                    inventario.resumen.valor_total || 0,
                                    (inventario.resumen as any).valor_total_usd,
                                  )}
                                </span>
                              </div>

                              <div className="group p-1.5 bg-muted/50 rounded-md border border-border hover:bg-muted hover:border-primary/30 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-1.5 mb-0">
                                  <Package className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Productos</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                  {inventario.resumen.total_productos}
                                </span>
                              </div>

                              <div className="group p-1.5 bg-muted/50 rounded-md border border-border hover:bg-muted hover:border-primary/30 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-1.5 mb-0">
                                  <Box className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Consumibles</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                  {inventario.resumen.total_consumibles}
                                </span>
                              </div>

                              <div className="group p-1.5 bg-muted/50 rounded-md border border-border hover:bg-muted hover:border-primary/30 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-1.5 mb-0">
                                  <Settings className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Activos Fijos</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                  {inventario.resumen.total_activos}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {total_paginas_inventarios > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaActualInventarios((p) => Math.max(1, p - 1))}
                      disabled={pagina_actual_inventarios === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {pagina_actual_inventarios} de {total_paginas_inventarios}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaActualInventarios((p) => Math.min(total_paginas_inventarios, p + 1))}
                      disabled={pagina_actual_inventarios === total_paginas_inventarios}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-card">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <Button
                  id={IDS_ELEMENTOS_INVENTARIOS.BTN_VOLVER_LISTA}
                  onClick={volverALista}
                  variant="outline"
                  size="sm"
                  className="mt-0.5"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Volver
                </Button>

                <div className="min-w-0 flex-1">
                  <h1
                    className="text-2xl font-bold text-foreground truncate"
                    title={inventario_seleccionado?.nombre || ''}
                  >
                    <TituloAccionable titulo="Inventarios">{inventario_seleccionado?.nombre}</TituloAccionable>
                  </h1>
                </div>
              </div>

              {reporte_valor && (
                <div className="w-full md:w-1/2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm text-muted-foreground truncate">Valor Total</div>
                            <div className="text-base font-bold text-primary whitespace-nowrap">
                              {formatearMonto(reporte_valor.valor_total || 0, (reporte_valor as any).valor_total_usd)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Productos <span className="font-bold text-foreground">{resumen_detalle.total_productos}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    <Card>
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm text-muted-foreground truncate">Consumibles</div>
                            <div className="text-base font-bold text-purple-500 whitespace-nowrap">
                              {formatearMonto(
                                (reporte_valor as any).valor_materiales || reporte_valor.valor_consumibles || 0,
                                (reporte_valor as any).valor_materiales_usd || (reporte_valor as any).valor_consumibles_usd,
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {resumen_detalle.consumibles_stock_bajo} stock bajo
                            </div>
                          </div>
                          <div className="text-sm font-bold text-foreground whitespace-nowrap">
                            {reporte_valor.cantidad_materiales}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    <Card>
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm text-muted-foreground truncate">Activos Fijos</div>
                            <div className="text-base font-bold text-blue-500 whitespace-nowrap">
                              {formatearMonto(reporte_valor.valor_activos || 0, (reporte_valor as any).valor_activos_usd)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {resumen_detalle.activos_en_mantenimiento} en mantenimiento
                            </div>
                          </div>
                          <div className="text-sm font-bold text-foreground whitespace-nowrap">
                            {reporte_valor.cantidad_activos}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Tabs value={tab_activo} onValueChange={(value) => setTabActivo(value as any)} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b">
              <div className="px-4 flex items-center">
                <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger id={IDS_ELEMENTOS_INVENTARIOS.TAB_PRODUCTOS} value="productos">
                  <Box className="h-4 w-4 mr-2" />
                  Productos
                </TabsTrigger>
                <TabsTrigger id={IDS_ELEMENTOS_INVENTARIOS.TAB_KARDEX} value="kardex">
                  <History className="h-4 w-4 mr-2" />
                  Kardex
                </TabsTrigger>
                <TabsTrigger id={IDS_ELEMENTOS_INVENTARIOS.TAB_AUDITORIA} value="auditoria">
                  <Shield className="h-4 w-4 mr-2" />
                  Registro de Actividad
                </TabsTrigger>
                <TabsTrigger id={IDS_ELEMENTOS_INVENTARIOS.TAB_BITACORA} value="bitacora">
                  <History className="h-4 w-4 mr-2" />
                  Bitácora de Activos
                </TabsTrigger>
                </TabsList>
              </div>

              {tab_activo === 'productos' && (
                <div className="px-4 py-3 border-t">
                  <div className="space-y-3">
                    <Tabs value={subtab_productos} onValueChange={(v) => setSubtabProductos(v as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger id={IDS_ELEMENTOS_INVENTARIOS.SUBTAB_CONSUMIBLES} value="consumibles">Consumibles</TabsTrigger>
                        <TabsTrigger id={IDS_ELEMENTOS_INVENTARIOS.SUBTAB_ACTIVOS_FIJOS} value="activos_fijos">Activos Fijos</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar productos..."
                          value={busqueda_productos}
                          onChange={(e) => setBusquedaProductos(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <div className="flex items-center gap-2 sm:justify-end">
                        <Label className="text-sm text-muted-foreground">Mostrar:</Label>
                        <Select
                          value={
                            (subtab_productos === 'consumibles'
                              ? consumibles_por_pagina
                              : activos_fijos_por_pagina
                            ).toString()
                          }
                          onValueChange={(v) => {
                            const n = Number(v);
                            if (subtab_productos === 'consumibles') {
                              setConsumiblesPorPagina(n);
                              setPaginaActualConsumibles(1);
                            } else {
                              setActivosFijosPorPagina(n);
                              setPaginaActualActivosFijos(1);
                            }
                          }}
                        >
                          <SelectTrigger className="w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        id={IDS_ELEMENTOS_INVENTARIOS.BTN_NUEVO_PRODUCTO}
                        onClick={() => abrirDialogoNuevoProducto(subtab_productos === 'consumibles' ? 'material' : 'activo_fijo')}
                        className="sm:w-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {subtab_productos === 'consumibles' ? 'Crear Material' : 'Crear Activo Fijo'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <TabsContent id={IDS_ELEMENTOS_INVENTARIOS.CONTENIDO_PRODUCTOS} value="productos" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1 p-4">
                {cargando_detalle ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : subtab_productos === 'consumibles' ? (
                  consumibles_filtrados.length === 0 ? (
                    <div className="text-center py-10">
                      <Box className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <h3 className="text-base font-semibold mb-1">No hay consumibles</h3>
                      <p className="text-sm text-muted-foreground">
                        {busqueda_productos ? 'No se encontraron consumibles con ese nombre' : 'Comienza agregando consumibles al inventario'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {consumibles_paginados.map((producto) => {
                        const stock_total = obtenerStockTotal(producto);
                        const valor_total = obtenerValorTotal(producto);
                        const valor_total_usd = obtenerValorTotalUSD(producto);
                        const notifica_stock_bajo = producto.notificar_stock_bajo !== false;
                        const stock_bajo = notifica_stock_bajo && stock_total < (producto.stock_minimo ?? 0);
                        const esta_cargando = productos_cargando.has(producto.id);

                        return (
                          <Card key={producto.id} className={`${stock_bajo ? 'border-yellow-500' : ''} relative`}>
                            {esta_cargando && (
                              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              </div>
                            )}
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                                  <CardTitle className="text-lg whitespace-normal break-words flex-1 min-w-0">{producto.nombre}</CardTitle>
                                  <Badge className={`${obtenerColorTipoGestion(producto.tipo)} text-white`}>
                                    {obtenerEtiquetaTipoGestion(producto.tipo)}
                                  </Badge>
                                  {stock_bajo && (
                                    <Badge variant="destructive" className="flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Stock Bajo
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => abrirDialogoNuevoMaterial(producto)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <ShoppingCart className="h-4 w-4 mr-1" />
                                    Registrar Entrada
                                  </Button>
                                  <Button
                                    onClick={() => abrirDialogoEditarProducto(producto)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => abrirDialogoConfirmarEliminarProducto(producto)}
                                    size="sm"
                                    variant="destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {producto.descripcion && (
                                <CardDescription className="w-full whitespace-normal break-all">{producto.descripcion}</CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">Stock Total</p>
                                    <p className="text-lg font-semibold">
                                      {formatearCantidad(stock_total, producto.permite_decimales, producto.tipo)} {producto.unidad_medida}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">Stock Mínimo</p>
                                    <p className="text-lg font-semibold">
                                      {notifica_stock_bajo
                                        ? (
                                          <>
                                            {formatearCantidad(producto.stock_minimo ?? 0, producto.permite_decimales, producto.tipo)} {producto.unidad_medida}
                                          </>
                                        )
                                        : '-'
                                      }
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Coins className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">Valor Total</p>
                                    <p className="text-lg font-semibold">
                                      {usarUSD ? formatearUSD(valor_total_usd) : formatearMonedaJSX(valor_total)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {producto.materiales && producto.materiales.length > 0 && (
                                <div className="border-t pt-4">
                                  <h4 className="font-semibold mb-2 text-sm">Materiales Disponibles</h4>
                                  <Table className="w-full table-fixed">
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Identificación</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Costo Unit.</TableHead>
                                        <TableHead>Vencimiento</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {producto.materiales.map((material) => {
                                        const estado_vencimiento = obtenerEstadoVencimiento(material.fecha_vencimiento);
                                        const vencido = estado_vencimiento === 'vencido';

                                        const clase_fila =
                                          estado_vencimiento === 'vencido'
                                            ? 'bg-destructive/10 hover:bg-destructive/20'
                                            : estado_vencimiento === 'semana'
                                              ? 'bg-destructive/5 hover:bg-destructive/10'
                                              : estado_vencimiento === 'mes'
                                                ? 'bg-orange-50 hover:bg-orange-100/70'
                                                : estado_vencimiento === 'tres_meses'
                                                  ? 'bg-yellow-50 hover:bg-yellow-100/70'
                                                  : '';

                                        const clase_texto =
                                          estado_vencimiento === 'vencido' || estado_vencimiento === 'semana'
                                            ? 'text-destructive'
                                            : '';
                                        return (
                                          <TableRow
                                            key={material.id}
                                            className={clase_fila}
                                          >
                                            <TableCell className={`font-medium whitespace-normal break-all ${clase_texto}`}>
                                              {material.nro_lote || material.nro_serie || '-'}
                                            </TableCell>
                                            <TableCell className={`whitespace-normal break-words ${clase_texto}`}>
                                              {formatearCantidad(material.cantidad_actual, producto.permite_decimales, producto.tipo)} {producto.unidad_medida}
                                            </TableCell>
                                            <TableCell className={`whitespace-normal break-words ${clase_texto}`}>
                                              {formatearMonto(
                                                (material as any).costo_unitario || 0,
                                                (material as any).costo_unitario_usd,
                                              )}
                                            </TableCell>
                                            <TableCell className={vencido ? 'text-destructive font-semibold' : ''}>
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span>
                                                  {material.fecha_vencimiento
                                                    ? format(new Date(material.fecha_vencimiento), 'dd/MM/yyyy')
                                                    : 'Sin vencimiento'
                                                  }
                                                </span>
                                                {estado_vencimiento === 'vencido' && (
                                                  <span className="inline-flex items-center gap-1 text-destructive font-semibold">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    VENCIDO
                                                  </span>
                                                )}
                                                {estado_vencimiento === 'semana' && (
                                                  <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5">
                                                    ≤ 1 semana
                                                  </Badge>
                                                )}
                                                {estado_vencimiento === 'mes' && (
                                                  <Badge variant="outline" className="border-orange-200 text-orange-800 bg-orange-50">
                                                    ≤ 1 mes
                                                  </Badge>
                                                )}
                                                {estado_vencimiento === 'tres_meses' && (
                                                  <Badge variant="outline" className="border-yellow-200 text-yellow-800 bg-yellow-50">
                                                    ≤ 3 meses
                                                  </Badge>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <div className="flex gap-1 justify-end">
                                                <Button
                                                  onClick={() => abrirDialogoEditarVencimientoMaterial(producto, material)}
                                                  size="sm"
                                                  variant="outline"
                                                  title="Editar vencimiento"
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  onClick={() => abrirDialogoAjusteStock(producto, material)}
                                                  size="sm"
                                                  variant="outline"
                                                  title="Ajustar Stock"
                                                >
                                                  <Settings className="h-3 w-3" />
                                                </Button>
                                                {estado_vencimiento === 'vencido' && (
                                                  <Button
                                                    onClick={() => desecharMaterialCaducado(producto, material)}
                                                    size="sm"
                                                    variant="destructive"
                                                    title="Desechar caducado"
                                                  >
                                                    <AlertTriangle className="h-3 w-3" />
                                                  </Button>
                                                )}
                                                <Button
                                                  onClick={() => abrirDialogoConfirmarEliminarMaterial(material)}
                                                  size="sm"
                                                  variant="destructive"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}

                      {total_paginas_consumibles > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActualConsumibles((p) => Math.max(1, p - 1))}
                            disabled={pagina_actual_consumibles === 1}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Página {pagina_actual_consumibles} de {total_paginas_consumibles}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActualConsumibles((p) => Math.min(total_paginas_consumibles, p + 1))}
                            disabled={pagina_actual_consumibles === total_paginas_consumibles}
                          >
                            Siguiente
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  activos_fijos_filtrados.length === 0 ? (
                    <div className="text-center py-10">
                      <Box className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <h3 className="text-base font-semibold mb-1">No hay activos fijos</h3>
                      <p className="text-sm text-muted-foreground">
                        {busqueda_productos ? 'No se encontraron activos fijos con ese nombre' : 'Comienza agregando activos fijos al inventario'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activos_fijos_paginados.map((producto) => {
                        const stock_total = obtenerStockTotal(producto);
                        const valor_total = obtenerValorTotal(producto);
                        const valor_total_usd = obtenerValorTotalUSD(producto);
                        const tiene_en_mantenimiento = (producto.activos ?? []).some((a) => a.estado === 'en_mantenimiento');
                        const esta_cargando = productos_cargando.has(producto.id);

                        return (
                          <Card key={producto.id} className="relative">
                            {esta_cargando && (
                              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              </div>
                            )}
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                                  <CardTitle className="text-lg whitespace-normal break-words flex-1 min-w-0">{producto.nombre}</CardTitle>
                                  <Badge className={`${obtenerColorTipoGestion(producto.tipo)} text-white`}>
                                    {obtenerEtiquetaTipoGestion(producto.tipo)}
                                  </Badge>
                                  {tiene_en_mantenimiento && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      <Settings className="h-3 w-3" />
                                      En Mantenimiento
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => abrirDialogoNuevoActivo(producto)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Registrar Activo
                                  </Button>
                                  <Button
                                    onClick={() => abrirDialogoEditarProducto(producto)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => abrirDialogoConfirmarEliminarProducto(producto)}
                                    size="sm"
                                    variant="destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {producto.descripcion && (
                                <CardDescription className="w-full whitespace-normal break-all">{producto.descripcion}</CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">Stock Total</p>
                                    <p className="text-lg font-semibold">
                                      {formatearCantidad(stock_total, producto.permite_decimales, producto.tipo)} {producto.unidad_medida}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Coins className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">Valor Total</p>
                                    <p className="text-lg font-semibold">
                                      {usarUSD ? formatearUSD(valor_total_usd) : formatearMonedaJSX(valor_total)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {producto.activos && producto.activos.length > 0 && (
                                <div className="border-t pt-4">
                                  <h4 className="font-semibold mb-2 text-sm">Activos Registrados</h4>
                                  <Table className="w-full table-fixed">
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Identificación</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Costo</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {producto.activos
                                        .filter((activo) => activo.estado !== 'vendido' && activo.estado !== 'desechado')
                                        .map((activo) => (
                                          <TableRow key={activo.id}>
                                            <TableCell className="font-medium whitespace-normal break-all">
                                              {activo.nombre_asignado || activo.nro_serie || '-'}
                                            </TableCell>
                                            <TableCell>
                                              <Select
                                                value={activo.estado}
                                                onValueChange={(value) => manejarCambioEstadoActivo(producto, activo, value)}
                                              >
                                                <SelectTrigger className="h-8 w-[140px]">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {getEstadosParaSubtipo(producto.subtipo_activo_fijo).map((estado) => (
                                                    <SelectItem key={estado.valor} value={estado.valor}>
                                                      {estado.etiqueta}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell className="whitespace-normal break-words">
                                              {formatearMonto(
                                                Number((activo as any).costo_compra || 0),
                                                Number((activo as any).costo_compra_usd || 0),
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <div className="flex gap-1 justify-end">
                                                <Button
                                                  onClick={() => abrirDialogoVenderActivo(activo)}
                                                  size="sm"
                                                  variant="outline"
                                                  title="Vender"
                                                >
                                                  <Coins className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  onClick={() => abrirDialogoEditarActivo(producto, activo)}
                                                  size="sm"
                                                  variant="outline"
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  onClick={() => abrirDialogoConfirmarEliminarActivo(activo)}
                                                  size="sm"
                                                  variant="destructive"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}

                      {total_paginas_activos_fijos > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActualActivosFijos((p) => Math.max(1, p - 1))}
                            disabled={pagina_actual_activos_fijos === 1}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Página {pagina_actual_activos_fijos} de {total_paginas_activos_fijos}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActualActivosFijos((p) => Math.min(total_paginas_activos_fijos, p + 1))}
                            disabled={pagina_actual_activos_fijos === total_paginas_activos_fijos}
                          >
                            Siguiente
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="kardex" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b">
                    <h3 id={IDS_ELEMENTOS_INVENTARIOS.TITULO_KARDEX} className="text-lg font-semibold flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Kardex (Movimientos de Inventario)
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">Mostrar:</Label>
                        <Select
                          value={kardex_por_pagina.toString()}
                          onValueChange={(v) => {
                            const n = Number(v);
                            setKardexPorPagina(n);
                            setPaginaActualKardex(1);
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value={HISTORIAL_TODOS.toString()}>Todos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        id={IDS_ELEMENTOS_INVENTARIOS.BTN_FILTROS_KARDEX}
                        variant="outline"
                        onClick={() => setDialogoFiltrosHistorialAbierto(true)}
                        className="relative"
                        disabled={cargando_kardex}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                        {contarFiltrosHistorialActivos() > 0 && (
                          <Badge className="ml-2 bg-primary text-primary-foreground">
                            {contarFiltrosHistorialActivos()}
                          </Badge>
                        )}
                      </Button>
                      {contarFiltrosHistorialActivos() > 0 && (
                        <Button variant="outline" onClick={limpiarFiltrosHistorial} disabled={cargando_kardex}>
                          <X className="h-4 w-4 mr-2" />
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </div>

                  {cargando_kardex ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Operación</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Entidad</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Stock</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {kardex_paginado.map((mov) => (
                            <TableRow key={mov.id}>
                              <TableCell>{format(new Date(mov.fecha), 'dd/MM/yyyy HH:mm')}</TableCell>
                              <TableCell>{mov.tipo}</TableCell>
                              <TableCell>
                                <Badge variant={mov.operacion === 'entrada' ? 'default' : 'destructive'}>
                                  {mov.operacion}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {mov.motivo || mov.observaciones || '-'}
                              </TableCell>
                              <TableCell>{mov.producto?.nombre || '-'}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {(mov as any).material?.nro_lote || (mov as any).material?.nro_serie || '-'}
                              </TableCell>
                              <TableCell>
                                {formatearCantidad(mov.cantidad, mov.producto?.permite_decimales, mov.producto?.tipo)}
                              </TableCell>
                              <TableCell>
                                {`${formatearCantidad(mov.stock_anterior, mov.producto?.permite_decimales, mov.producto?.tipo)} → ${formatearCantidad(mov.stock_nuevo, mov.producto?.permite_decimales, mov.producto?.tipo)}`}
                              </TableCell>
                            </TableRow>
                          ))}
                          {kardex_filtrado.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                No hay movimientos registrados
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>

                      {total_paginas_kardex > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActualKardex((p) => Math.max(1, p - 1))}
                            disabled={pagina_actual_kardex === 1}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Página {pagina_actual_kardex} de {total_paginas_kardex}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActualKardex((p) => Math.min(total_paginas_kardex, p + 1))}
                            disabled={pagina_actual_kardex === total_paginas_kardex}
                          >
                            Siguiente
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="bitacora" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b">
                    <h3 id={IDS_ELEMENTOS_INVENTARIOS.TITULO_BITACORA} className="text-lg font-semibold flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Bitácora de Activos
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">Mostrar:</Label>
                        <Select
                          value={bitacora_por_pagina.toString()}
                          onValueChange={(v) => {
                            const n = Number(v);
                            setBitacoraPorPagina(n);
                            setPaginaActualBitacora(1);
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value={HISTORIAL_TODOS.toString()}>Todos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        id={IDS_ELEMENTOS_INVENTARIOS.BTN_FILTROS_BITACORA}
                        variant="outline"
                        onClick={() => setDialogoFiltrosHistorialAbierto(true)}
                        className="relative"
                        disabled={cargando_bitacora}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                        {contarFiltrosHistorialActivos() > 0 && (
                          <Badge className="ml-2 bg-primary text-primary-foreground">
                            {contarFiltrosHistorialActivos()}
                          </Badge>
                        )}
                      </Button>
                      {contarFiltrosHistorialActivos() > 0 && (
                        <Button variant="outline" onClick={limpiarFiltrosHistorial} disabled={cargando_bitacora}>
                          <X className="h-4 w-4 mr-2" />
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </div>

                  {cargando_bitacora ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Activo</TableHead>
                            <TableHead>Identificación</TableHead>
                            <TableHead>Cambio de Estado</TableHead>
                            <TableHead>Motivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bitacora_paginada.map((evento) => (
                            <TableRow key={evento.id}>
                              <TableCell>{format(new Date(evento.fecha), 'dd/MM/yyyy HH:mm')}</TableCell>
                              <TableCell>{evento.activo?.nombre_asignado || evento.activo?.codigo_interno || '-'}</TableCell>
                              <TableCell>{evento.activo?.nro_serie || evento.activo?.codigo_interno || '-'}</TableCell>
                              <TableCell>
                                {evento.estado_anterior && evento.estado_nuevo ? (
                                  <span className="flex items-center gap-2">
                                    <Badge variant="secondary">{evento.estado_anterior}</Badge>
                                    <span>→</span>
                                    <Badge variant="default">{evento.estado_nuevo}</Badge>
                                  </span>
                                ) : (
                                  <Badge>{evento.estado_nuevo || '-'}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {evento.motivo || evento.descripcion || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                          {bitacora_filtrada.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No hay eventos registrados
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>

                      {total_paginas_bitacora > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActualBitacora((p) => Math.max(1, p - 1))}
                            disabled={pagina_actual_bitacora === 1}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Página {pagina_actual_bitacora} de {total_paginas_bitacora}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActualBitacora((p) => Math.min(total_paginas_bitacora, p + 1))}
                            disabled={pagina_actual_bitacora === total_paginas_bitacora}
                          >
                            Siguiente
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="auditoria" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b">
                    <h3 id={IDS_ELEMENTOS_INVENTARIOS.TITULO_AUDITORIA} className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Registro de Actividad
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">Mostrar:</Label>
                        <Select
                          value={auditoria_por_pagina.toString()}
                          onValueChange={(v) => {
                            const n = Number(v);
                            setAuditoriaPorPagina(n);
                            setPaginaActualAuditoria(1);
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value={HISTORIAL_TODOS.toString()}>Todos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        id={IDS_ELEMENTOS_INVENTARIOS.BTN_FILTROS_AUDITORIA}
                        variant="outline"
                        onClick={() => setDialogoFiltrosHistorialAbierto(true)}
                        className="relative"
                        disabled={cargando_auditoria}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                        {contarFiltrosHistorialActivos() > 0 && (
                          <Badge className="ml-2 bg-primary text-primary-foreground">
                            {contarFiltrosHistorialActivos()}
                          </Badge>
                        )}
                      </Button>
                      {contarFiltrosHistorialActivos() > 0 && (
                        <Button variant="outline" onClick={limpiarFiltrosHistorial} disabled={cargando_auditoria}>
                          <X className="h-4 w-4 mr-2" />
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </div>

                  {cargando_auditoria ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Acción</TableHead>
                            <TableHead>Entidad</TableHead>
                            <TableHead>Identificación</TableHead>
                            <TableHead>Detalles</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {auditoria_paginada.map((reg) => (
                            <TableRow key={reg.id}>
                              <TableCell>{format(new Date(reg.fecha), 'dd/MM/yyyy HH:mm')}</TableCell>
                              <TableCell>
                                {(() => {
                                const accion = reg.accion || '';
                                const accion_normalizada = accion.toLowerCase();
                                const es_crear =
                                  accion_normalizada.includes('crear') ||
                                  accion_normalizada.includes('creado') ||
                                  accion_normalizada.includes('creada') ||
                                  accion_normalizada.includes('_creado') ||
                                  accion_normalizada.includes('_creada') ||
                                  accion_normalizada.includes('create') ||
                                  accion_normalizada.includes('created') ||
                                  accion_normalizada.includes('insert');

                                const es_eliminar =
                                  accion_normalizada.includes('eliminar') ||
                                  accion_normalizada.includes('eliminado') ||
                                  accion_normalizada.includes('eliminada') ||
                                  accion_normalizada.includes('_eliminado') ||
                                  accion_normalizada.includes('_eliminada') ||
                                  accion_normalizada.includes('borrar') ||
                                  accion_normalizada.includes('borrado') ||
                                  accion_normalizada.includes('delete') ||
                                  accion_normalizada.includes('deleted') ||
                                  accion_normalizada.includes('remove') ||
                                  accion_normalizada.includes('removed') ||
                                  accion_normalizada.includes('desecho') ||
                                  accion_normalizada.includes('desechado') ||
                                  accion_normalizada.includes('vendido');

                                const es_editar =
                                  accion_normalizada.includes('editar') ||
                                  accion_normalizada.includes('editado') ||
                                  accion_normalizada.includes('editada') ||
                                  accion_normalizada.includes('_editado') ||
                                  accion_normalizada.includes('_editada') ||
                                  accion_normalizada.includes('actualizar') ||
                                  accion_normalizada.includes('actualizado') ||
                                  accion_normalizada.includes('modificar') ||
                                  accion_normalizada.includes('modificado') ||
                                  accion_normalizada.includes('update') ||
                                  accion_normalizada.includes('updated') ||
                                  accion_normalizada.includes('ajuste');

                                const etiqueta = accion.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '-';
                                const variant = es_eliminar ? 'destructive' : es_crear ? 'default' : es_editar ? 'secondary' : 'outline';

                                return (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant={variant as any}>
                                      {etiqueta}
                                    </Badge>
                                  </div>
                                );
                              })()}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {(() => {
                                  const categoria = reg.categoria || '';
                                  const categoria_normalizada = categoria.toLowerCase();
                                  const { variant, className } =
                                    categoria_normalizada === 'inventario'
                                      ? { variant: 'default', className: '' }
                                      : categoria_normalizada === 'producto'
                                        ? { variant: 'secondary', className: '' }
                                        : categoria_normalizada === 'material'
                                          ? { variant: 'outline', className: 'bg-accent text-accent-foreground border-transparent' }
                                          : categoria_normalizada === 'activo'
                                            ? { variant: 'outline', className: 'bg-muted text-muted-foreground border-border' }
                                            : { variant: 'outline', className: 'bg-muted text-muted-foreground border-border' };

                                  return (
                                    <Badge variant={variant as any} className={`w-fit text-xs ${className}`}>
                                      {categoria.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '-'}
                                    </Badge>
                                  );
                                })()}
                                  <span className="text-sm">
                                    {reg.producto?.nombre ||
                                      (reg.material as any)?.producto?.nombre ||
                                      reg.activo?.nombre_asignado ||
                                      reg.activo?.nro_serie ||
                                      '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {reg.material?.nro_lote || reg.material?.nro_serie || reg.activo?.nro_serie || reg.activo?.codigo_interno || '-'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setDetallesAuditoriaSeleccionada(reg);
                                    setDialogoDetallesAuditoriaAbierto(true);
                                  }}
                                >
                                  Ver cambios
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {auditoria_filtrada.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No hay registros de actividad
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>

                      {total_paginas_auditoria > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActualAuditoria((p) => Math.max(1, p - 1))}
                            disabled={pagina_actual_auditoria === 1}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Página {pagina_actual_auditoria} de {total_paginas_auditoria}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActualAuditoria((p) => Math.min(total_paginas_auditoria, p + 1))}
                            disabled={pagina_actual_auditoria === total_paginas_auditoria}
                          >
                            Siguiente
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <Dialog open={dialogo_inventario_abierto} onOpenChange={handleInventarioOpenChange}>
        <DialogContent id={IDS_ELEMENTOS_INVENTARIOS.DIALOGO_INVENTARIO} className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion ? 'Editar Inventario' : 'Nuevo Inventario'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion
                ? 'Modifica la información del inventario'
                : 'Crea un nuevo inventario para gestionar productos'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formulario_inventario.nombre}
                onChange={(e) => {
                  limpiarCampoResaltado('inventario_nombre');
                  setFormularioInventario({ ...formulario_inventario, nombre: e.target.value });
                }}
                placeholder="Inventario Principal"
                className={cn(claseCampoResaltado('inventario_nombre'))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleInventarioOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              id={IDS_ELEMENTOS_INVENTARIOS.BTN_GUARDAR_INVENTARIO}
              onClick={manejarGuardarInventario}
              disabled={guardando || !puedeGuardarInventario}
            >
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                modo_edicion ? 'Guardar Cambios' : 'Crear Inventario'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={inventarioCloseConfirmation.open} onOpenChange={inventarioCloseConfirmation.onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. ¿Estás seguro de que deseas salir sin guardar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={inventarioCloseConfirmation.onCancel}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={inventarioCloseConfirmation.onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Descartar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el inventario "{inventario_a_eliminar?.nombre}"?
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
                setInventarioAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarEliminarInventario}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_producto_abierto} onOpenChange={handleProductoOpenChange}>
        <DialogContent id={IDS_ELEMENTOS_INVENTARIOS.DIALOGO_PRODUCTO} className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion_producto ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion_producto
                ? 'Modifica la información del producto'
                : 'Crea un nuevo producto en el inventario'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_producto">Nombre *</Label>
                <Input
                  id="nombre_producto"
                  value={formulario_producto.nombre}
                  onChange={(e) => {
                    limpiarCampoResaltado('producto_nombre');
                    setFormularioProducto({ ...formulario_producto, nombre: e.target.value });
                  }}
                  placeholder="Nombre del producto..."
                  className={cn(claseCampoResaltado('producto_nombre'))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="tipo_producto" className="text-base font-medium">
                    {formulario_producto.tipo === 'material' ? 'Material (Consumible)' : 'Activo Fijo'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formulario_producto.tipo === 'material'
                      ? 'Recursos que se consumen y agotan (fármacos, guantes, etc.)'
                      : 'Equipos o instrumentos con ciclo de vida (sillas, autoclaves, etc.)'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {formulario_producto.tipo === 'material' ? (
                  <div className="space-y-2">
                    <Label htmlFor="subtipo_material">Subtipo de Material *</Label>
                    <Select
                      value={formulario_producto.subtipo_material}
                      onValueChange={(value: 'con_lote_vencimiento' | 'con_serie' | 'sin_lote') =>
                        setFormularioProducto({ ...formulario_producto, subtipo_material: value })
                      }
                      disabled={modo_edicion_producto}
                    >
                      <SelectTrigger id={IDS_ELEMENTOS_INVENTARIOS.SELECT_SUBTIPO_MATERIAL}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subtipos_material.map((subtipo) => (
                          <SelectItem key={subtipo.valor} value={subtipo.valor}>
                            <div className="flex flex-col">
                              <span>{subtipo.etiqueta}</span>
                              <span className="text-xs text-muted-foreground">{subtipo.descripcion}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="subtipo_activo">Subtipo de Activo *</Label>
                    <Select
                      value={formulario_producto.subtipo_activo_fijo}
                      onValueChange={(value: 'instrumental' | 'mobiliario_equipo') =>
                        setFormularioProducto({ ...formulario_producto, subtipo_activo_fijo: value })
                      }
                      disabled={modo_edicion_producto}
                    >
                      <SelectTrigger id={IDS_ELEMENTOS_INVENTARIOS.SELECT_SUBTIPO_ACTIVO_FIJO}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subtipos_activo_fijo.map((subtipo) => (
                          <SelectItem key={subtipo.valor} value={subtipo.valor}>
                            <div className="flex flex-col">
                              <span>{subtipo.etiqueta}</span>
                              <span className="text-xs text-muted-foreground">{subtipo.descripcion}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formulario_producto.tipo === 'material' && (
                  <div className="space-y-2">
                    <Label htmlFor="unidad_medida">Unidad de Medida *</Label>
                    <Input
                      id="unidad_medida"
                      value={formulario_producto.unidad_medida}
                      onChange={(e) => {
                        limpiarCampoResaltado('producto_unidad_medida');
                        setFormularioProducto({ ...formulario_producto, unidad_medida: e.target.value });
                      }}
                      placeholder="Ej: cajas, frascos, ml, gramos..."
                      className={cn(claseCampoResaltado('producto_unidad_medida'))}
                    />
                  </div>
                )}
              </div>

              {formulario_producto.tipo === 'material' && (
                <div className="space-y-2 pt-1">
                  <Label className="text-sm font-medium">Formato de Cantidad</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`border rounded-md p-3 transition-all relative ${formulario_producto.permite_decimales === false
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : modo_edicion_producto
                          ? 'opacity-50 cursor-not-allowed border-muted'
                          : 'hover:bg-muted/50 border-muted cursor-pointer'
                        }`}
                      onClick={() => {
                        if (modo_edicion_producto) return;
                        let nuevo_stock_minimo = formulario_producto.stock_minimo;
                        if (nuevo_stock_minimo.includes('.')) {
                          nuevo_stock_minimo = nuevo_stock_minimo.split('.')[0];
                        }
                        setFormularioProducto({
                          ...formulario_producto,
                          permite_decimales: false,
                          stock_minimo: nuevo_stock_minimo
                        });
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">Solo Enteros</span>
                        {formulario_producto.permite_decimales === false && (
                          <div className="h-3 w-3 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-2 w-2 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ej: 10 {formulario_producto.unidad_medida || 'unidades'}
                      </div>
                    </div>

                    <div
                      className={`border rounded-md p-3 transition-all relative ${formulario_producto.permite_decimales !== false
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : modo_edicion_producto
                          ? 'opacity-50 cursor-not-allowed border-muted'
                          : 'hover:bg-muted/50 border-muted cursor-pointer'
                        }`}
                      onClick={() => {
                        if (modo_edicion_producto) return;
                        let nuevo_stock_minimo = formulario_producto.stock_minimo;
                        if (nuevo_stock_minimo && !nuevo_stock_minimo.includes('.')) {
                          nuevo_stock_minimo = nuevo_stock_minimo + '.00';
                        }
                        setFormularioProducto({
                          ...formulario_producto,
                          permite_decimales: true,
                          stock_minimo: nuevo_stock_minimo
                        });
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">Con Decimales</span>
                        {formulario_producto.permite_decimales !== false && (
                          <div className="h-3 w-3 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-2 w-2 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ej: 1.5 {formulario_producto.unidad_medida || 'unidades'}
                      </div>
                    </div>
                  </div>
                  {modo_edicion_producto && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      El formato de cantidad no se puede cambiar una vez creado el producto.
                    </p>
                  )}
                </div>
              )}
              {formulario_producto.tipo === 'material' && (
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="stock_minimo">Stock Mínimo *</Label>
                    <Input
                      id="stock_minimo"
                      type="number"
                      disabled={!formulario_producto.notificar_stock_bajo}
                      step={formulario_producto.permite_decimales !== false ? '0.01' : '1'}
                      min="0"
                      placeholder={formulario_producto.permite_decimales !== false ? '0.00' : '0'}
                      value={formulario_producto.stock_minimo}
                      onKeyDown={(e) => {
                        if (formulario_producto.permite_decimales === false && (e.key === '.' || e.key === ',')) {
                          e.preventDefault();
                        }
                        const isNumber = /^[0-9]$/.test(e.key);
                        const isDecimalPoint = e.key === '.' || e.key === ',';
                        const isControlKey = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key);
                        const isCopyPaste = (e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase());

                        if (!isNumber && !isDecimalPoint && !isControlKey && !isCopyPaste) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        let valor = e.target.value;
                        if (formulario_producto.permite_decimales === false && valor.includes('.')) {
                          valor = valor.split('.')[0];
                        }
                        if (formulario_producto.permite_decimales !== false && valor.includes('.')) {
                          const partes = valor.split('.');
                          if (partes[1] && partes[1].length > 2) {
                            valor = partes[0] + '.' + partes[1].substring(0, 2);
                          }
                        }
                        setFormularioProducto({ ...formulario_producto, stock_minimo: valor });
                      }}
                      onBlur={() => {
                        if (formulario_producto.stock_minimo !== '') return;
                        const valorPorDefecto = formulario_producto.permite_decimales !== false ? '0.00' : '0';
                        setFormularioProducto({ ...formulario_producto, stock_minimo: valorPorDefecto });
                      }}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pb-2.5">
                    <Switch
                      id="notificar_stock_bajo"
                      checked={formulario_producto.notificar_stock_bajo}
                      onCheckedChange={(checked) => setFormularioProducto({ ...formulario_producto, notificar_stock_bajo: checked })}
                    />
                    <Label htmlFor="notificar_stock_bajo" className="cursor-pointer text-sm">
                      Notificar bajo stock
                    </Label>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formulario_producto.descripcion}
                  onChange={(e) => setFormularioProducto({ ...formulario_producto, descripcion: e.target.value })}
                  placeholder="Descripción del producto (opcional)"
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleProductoOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button id={IDS_ELEMENTOS_INVENTARIOS.BTN_GUARDAR_PRODUCTO} onClick={manejarGuardarProducto} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                modo_edicion_producto ? 'Guardar Cambios' : 'Crear Producto'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={productoCloseConfirmation.open} onOpenChange={productoCloseConfirmation.onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. ¿Estás seguro de que deseas salir sin guardar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={productoCloseConfirmation.onCancel}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={productoCloseConfirmation.onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Descartar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogo_confirmar_eliminar_producto_abierto} onOpenChange={setDialogoConfirmarEliminarProductoAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el producto "{producto_a_eliminar?.nombre}"?
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
                setDialogoConfirmarEliminarProductoAbierto(false);
                setProductoAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarEliminarProducto}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_material_abierto} onOpenChange={handleMaterialOpenChange}>
        <DialogContent id={IDS_ELEMENTOS_INVENTARIOS.DIALOGO_REGISTRAR_MATERIAL} className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Registrar Nuevo Material
            </DialogTitle>
            <DialogDescription>
              Registra una entrada de material para {producto_seleccionado?.nombre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {producto_seleccionado?.subtipo_material === 'con_lote_vencimiento' && (
                <div className="space-y-2">
                  <Label htmlFor="nro_lote">Número de Lote</Label>
                  <Input
                    id="nro_lote"
                    value={formulario_material.nro_lote}
                    onChange={(e) => {
                      limpiarCampoResaltado('material_nro_lote');
                      setFormularioMaterial({ ...formulario_material, nro_lote: e.target.value });
                    }}
                    placeholder="L001-2024"
                    className={cn(claseCampoResaltado('material_nro_lote'))}
                  />
                </div>
              )}
              {producto_seleccionado?.subtipo_material === 'con_serie' && (
                <div className="space-y-2">
                  <Label htmlFor="nro_serie">Número de Serie</Label>
                  <Input
                    id="nro_serie"
                    value={formulario_material.nro_serie}
                    onChange={(e) => {
                      limpiarCampoResaltado('material_nro_serie');
                      setFormularioMaterial({ ...formulario_material, nro_serie: e.target.value });
                    }}
                    placeholder="SN-001"
                    className={cn(claseCampoResaltado('material_nro_serie'))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <Input
                  id="cantidad"
                  type="number"
                  step={producto_seleccionado?.permite_decimales !== false ? '0.01' : '1'}
                  min="0"
                  placeholder={producto_seleccionado?.permite_decimales !== false ? '0.00' : '0'}
                  value={formulario_material.cantidad}
                  onKeyDown={(e) => {
                    if (producto_seleccionado?.permite_decimales === false && (e.key === '.' || e.key === ',')) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    let valor = e.target.value;
                    if (producto_seleccionado?.permite_decimales === false && valor.includes('.')) {
                      valor = valor.split('.')[0];
                    }
                    limpiarCampoResaltado('material_cantidad');
                    setFormularioMaterial({ ...formulario_material, cantidad: valor });
                  }}
                  onBlur={() => {
                    if (formulario_material.cantidad !== '') return;
                    const valorPorDefecto = producto_seleccionado?.permite_decimales !== false ? '0.00' : '0';
                    setFormularioMaterial({ ...formulario_material, cantidad: valorPorDefecto });
                  }}
                  className={cn(claseCampoResaltado('material_cantidad'))}
                />
              </div>
            </div>

            <div id={IDS_ELEMENTOS_INVENTARIOS.CONTENEDOR_COSTO_ENTRADA_MATERIAL} className="space-y-2">
              <Label>Costo Total *</Label>
              <InputMoneda
                valorLocal={formulario_material.costo_total}
                valorUSD={formulario_material.costo_total_usd}
                onMontoChange={(local, usd) => {
                  limpiarCampoResaltado('material_costo_total');
                  setFormularioMaterial(prev => ({
                    ...prev,
                    costo_total: local,
                    costo_total_usd: usd
                  }));
                }}
                inputClassName={cn(claseCampoResaltado('material_costo_total'))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div id={IDS_ELEMENTOS_INVENTARIOS.CONTENEDOR_FECHA_COMPRA_MATERIAL} className="space-y-2">
                <Label htmlFor="fecha_compra">Fecha de Compra *</Label>
                <DateTimePicker
                  valor={formulario_material.fecha_compra}
                  onChange={(fecha) => setFormularioMaterial({ ...formulario_material, fecha_compra: fecha || new Date() })}
                />
              </div>

              {producto_seleccionado?.subtipo_material === 'con_lote_vencimiento' && (
                <div className="space-y-2">
                  <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento</Label>
                  <DatePicker
                    valor={formulario_material.fecha_vencimiento}
                    onChange={(fecha) => setFormularioMaterial({ ...formulario_material, fecha_vencimiento: fecha })}
                    fromYear={2025}
                    toYear={2125}
                    deshabilitarAnteriores
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="registrar_egreso_material"
                checked={formulario_material.registrar_egreso}
                onCheckedChange={(checked) => setFormularioMaterial({ ...formulario_material, registrar_egreso: checked })}
              />
              <Label htmlFor="registrar_egreso_material" className="cursor-pointer flex items-center gap-2">
                {formulario_material.registrar_egreso ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Se registrará un GASTO en finanzas
                  </>
                ) : (
                  'No afectar finanzas'
                )}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleMaterialOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button id={IDS_ELEMENTOS_INVENTARIOS.BTN_CONFIRMAR_REGISTRAR_MATERIAL} onClick={manejarGuardarMaterial} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Registrar Material'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={materialCloseConfirmation.open} onOpenChange={materialCloseConfirmation.onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. ¿Estás seguro de que deseas salir sin guardar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={materialCloseConfirmation.onCancel}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={materialCloseConfirmation.onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Descartar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogo_confirmar_eliminar_material_abierto} onOpenChange={setDialogoConfirmarEliminarMaterialAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este material?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="motivo_eliminar_material">Motivo *</Label>
            <Input
              id="motivo_eliminar_material"
              value={motivo_eliminar_material}
              onChange={(e) => {
                limpiarCampoResaltado('material_motivo_eliminacion');
                setMotivoEliminarMaterial(e.target.value);
              }}
              placeholder="Ej: material dañado, merma, ajuste por conteo..."
              className={cn(claseCampoResaltado('material_motivo_eliminacion'))}
            />
          </div>

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Esta acción no se puede deshacer.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoConfirmarEliminarMaterialAbierto(false);
                setMaterialAEliminar(null);
                setMotivoEliminarMaterial('');
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarEliminarMaterial}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_editar_vencimiento_material_abierto} onOpenChange={setDialogoEditarVencimientoMaterialAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Vencimiento</DialogTitle>
            <DialogDescription>
              Modifica la fecha de vencimiento del material {material_vencimiento_seleccionado?.nro_lote || material_vencimiento_seleccionado?.nro_serie || ''}
            </DialogDescription>
          </DialogHeader>

          {material_vencimiento_seleccionado && (() => {
            const estado_actual = obtenerEstadoVencimiento(material_vencimiento_seleccionado.fecha_vencimiento);
            if (estado_actual !== 'vencido' && estado_actual !== 'semana') return null;
            return (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">
                  ⚠️ Este material está {estado_actual === 'vencido' ? 'vencido' : 'próximo a vencer (≤ 1 semana)'}.
                  Al editar el vencimiento, revisa que sea correcto.
                </p>
              </div>
            );
          })()}

          <div className="space-y-2">
            <Label htmlFor="fecha_vencimiento_edicion">Fecha de Vencimiento</Label>
            <DatePicker
              valor={fecha_vencimiento_edicion}
              onChange={(fecha) => setFechaVencimientoEdicion(fecha || undefined)}
              fromYear={2025}
              toYear={2125}
              deshabilitarAnteriores
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoEditarVencimientoMaterialAbierto(false);
                setProductoVencimientoSeleccionado(null);
                setMaterialVencimientoSeleccionado(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={confirmarEditarVencimientoMaterial} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_ajuste_stock_abierto} onOpenChange={setDialogoAjusteStockAbierto}>
        <DialogContent id={IDS_ELEMENTOS_INVENTARIOS.DIALOGO_AJUSTE_STOCK} className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
            <DialogDescription>
              Ajusta el stock del material {material_seleccionado?.nro_lote || material_seleccionado?.nro_serie || ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_ajuste">Tipo de Ajuste *</Label>
              <div className="flex items-center space-x-4">
                <Switch
                  id="tipo_ajuste"
                  checked={formulario_ajuste_stock.tipo_ajuste === 'decremento'}
                  onCheckedChange={(checked) =>
                    setFormularioAjusteStock({
                      ...formulario_ajuste_stock,
                      tipo_ajuste: checked ? 'decremento' : 'incremento',
                      generar_movimiento_financiero: checked ? false : true,
                    })
                  }
                />
                <Label htmlFor="tipo_ajuste" className="cursor-pointer">
                  {formulario_ajuste_stock.tipo_ajuste === 'incremento' ? (
                    <span className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-green-600" />
                      Entrada (Incrementar Stock)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Minus className="h-5 w-5 text-red-600" />
                      Salida (Reducir Stock)
                    </span>
                  )}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad_ajuste">Cantidad *</Label>
              <Input
                id="cantidad_ajuste"
                type="number"
                step={producto_seleccionado?.permite_decimales !== false ? '0.01' : '1'}
                min="0"
                placeholder={producto_seleccionado?.permite_decimales !== false ? '0.00' : '0'}
                value={formulario_ajuste_stock.cantidad}
                onKeyDown={(e) => {
                  if (producto_seleccionado?.permite_decimales === false && (e.key === '.' || e.key === ',')) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  let nueva_cantidad = e.target.value;
                  if (producto_seleccionado?.permite_decimales === false && nueva_cantidad.includes('.')) {
                    nueva_cantidad = nueva_cantidad.split('.')[0];
                  }
                  limpiarCampoResaltado('ajuste_cantidad');
                  const cantidad_num = parseFloat(nueva_cantidad || '0');
                  const costo_unitario = material_seleccionado ? Number(material_seleccionado.costo_unitario || 0) : 0;
                  const nuevo_monto = (cantidad_num * costo_unitario).toFixed(2);
                  setFormularioAjusteStock({
                    ...formulario_ajuste_stock,
                    cantidad: nueva_cantidad,
                    monto: nuevo_monto
                  });
                }}
                onBlur={() => {
                  if (formulario_ajuste_stock.cantidad !== '') return;
                  const valorPorDefecto = producto_seleccionado?.permite_decimales !== false ? '0.00' : '0';
                  setFormularioAjusteStock({ ...formulario_ajuste_stock, cantidad: valorPorDefecto });
                }}
                className={cn(claseCampoResaltado('ajuste_cantidad'))}
              />
              {material_seleccionado && (
                <p className="text-sm text-muted-foreground">
                  Stock actual: {formatearCantidad(material_seleccionado.cantidad_actual, producto_seleccionado?.permite_decimales, producto_seleccionado?.tipo)} {producto_seleccionado?.unidad_medida}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto_ajuste">
                Monto {formulario_ajuste_stock.tipo_ajuste === 'incremento' ? '(Costo de Compra)' : '(Monto de Salida)'} *
              </Label>
              <Input
                id="monto_ajuste"
                type="number"
                step="0.01"
                min="0"
                value={formulario_ajuste_stock.monto}
                onChange={(e) => {
                  const valor = parseFloat(e.target.value || '0').toFixed(2);
                  setFormularioAjusteStock({ ...formulario_ajuste_stock, monto: valor });
                }}
                onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_ajuste">Fecha y Hora del Ajuste *</Label>
              <DateTimePicker
                valor={formulario_ajuste_stock.fecha_ajuste}
                onChange={(fecha) => setFormularioAjusteStock({ ...formulario_ajuste_stock, fecha_ajuste: fecha || new Date() })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo_ajuste">Motivo *</Label>
              <Input
                id="motivo_ajuste"
                value={formulario_ajuste_stock.motivo}
                onChange={(e) => {
                  limpiarCampoResaltado('ajuste_motivo');
                  setFormularioAjusteStock({ ...formulario_ajuste_stock, motivo: e.target.value });
                }}
                placeholder={formulario_ajuste_stock.tipo_ajuste === 'incremento'
                  ? 'Ej: reposición, compra, donación...'
                  : 'Ej: salida por uso, merma, ajuste por conteo...'}
                className={cn(claseCampoResaltado('ajuste_motivo'))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="generar_movimiento_ajuste"
                checked={formulario_ajuste_stock.generar_movimiento_financiero}
                onCheckedChange={(checked) => setFormularioAjusteStock({ ...formulario_ajuste_stock, generar_movimiento_financiero: checked })}
              />
              <Label htmlFor="generar_movimiento_ajuste" className="cursor-pointer flex items-center gap-2">
                {formulario_ajuste_stock.generar_movimiento_financiero ? (
                  formulario_ajuste_stock.tipo_ajuste === 'decremento' ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Se registrará un INGRESO en finanzas
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Se registrará un GASTO en finanzas
                    </>
                  )
                ) : (
                  'No afectar finanzas'
                )}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAjusteStockAbierto(false)}>
              Cancelar
            </Button>
            <Button id={IDS_ELEMENTOS_INVENTARIOS.BTN_CONFIRMAR_AJUSTE_STOCK} onClick={manejarAjusteStock} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajustando...
                </>
              ) : (
                'Ajustar Stock'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_activo_abierto} onOpenChange={handleActivoOpenChange}>
        <DialogContent id={IDS_ELEMENTOS_INVENTARIOS.DIALOGO_REGISTRAR_ACTIVO} className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion_activo ? (
                'Editar Activo'
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-600" />
                  Registrar Nuevo Activo
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion_activo
                ? `Modifica la información del activo`
                : `Registra un nuevo activo de ${producto_seleccionado?.nombre}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {producto_seleccionado?.subtipo_activo_fijo === 'instrumental' && (
              <div className="space-y-2">
                <Label htmlFor="nro_serie">Número de Serie</Label>
                <Input
                  id="nro_serie"
                  value={formulario_activo.nro_serie}
                  onChange={(e) => {
                    limpiarCampoResaltado('activo_nro_serie');
                    setFormularioActivo({ ...formulario_activo, nro_serie: e.target.value });
                  }}
                  placeholder="SN-123456"
                  disabled={modo_edicion_activo}
                  className={cn(claseCampoResaltado('activo_nro_serie'))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombre_asignado">Nombre Asignado</Label>
              <Input
                id="nombre_asignado"
                value={formulario_activo.nombre_asignado}
                onChange={(e) => setFormularioActivo({ ...formulario_activo, nombre_asignado: e.target.value })}
                placeholder="Equipo Sala 1"
              />
            </div>

            {!modo_edicion_activo && (
              <>
                <div id={IDS_ELEMENTOS_INVENTARIOS.CONTENEDOR_COSTO_COMPRA_ACTIVO} className="space-y-2">
                  <InputMoneda
                    label="Costo de Compra *"
                    valorLocal={formulario_activo.costo_compra}
                    valorUSD={formulario_activo.costo_compra_usd}
                    onMontoChange={(local, usd) => {
                      limpiarCampoResaltado('activo_costo_compra');
                      setFormularioActivo(prev => ({
                        ...prev,
                        costo_compra: local,
                        costo_compra_usd: usd
                      }));
                    }}
                    inputClassName={cn(claseCampoResaltado('activo_costo_compra'))}
                  />
                </div>

                <div id={IDS_ELEMENTOS_INVENTARIOS.CONTENEDOR_FECHA_COMPRA_ACTIVO} className="space-y-2">
                  <Label htmlFor="fecha_compra">Fecha de Compra *</Label>
                  <DateTimePicker
                    valor={formulario_activo.fecha_compra}
                    onChange={(fecha) => setFormularioActivo({ ...formulario_activo, fecha_compra: fecha || new Date() })}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select
                disabled={!modo_edicion_activo}
                value={formulario_activo.estado}
                onValueChange={(value) => {
                  setFormularioActivo({ ...formulario_activo, estado: value });
                  if (
                    modo_edicion_activo &&
                    value !== (activo_inicial.estado as any) &&
                    !motivo_cambio_estado_activo.trim()
                  ) {
                    setMotivoCambioEstadoActivo('Cambio de estado manual');
                  }
                }}
              >
                <SelectTrigger id={IDS_ELEMENTOS_INVENTARIOS.SELECT_ESTADO_ACTIVO} disabled={!modo_edicion_activo}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getEstadosParaSubtipo(producto_seleccionado?.subtipo_activo_fijo).map((estado) => (
                    <SelectItem key={estado.valor} value={estado.valor}>
                      {estado.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {modo_edicion_activo && formulario_activo.estado !== (activo_inicial.estado as any) && (
              <div className="space-y-2">
                <Label htmlFor="motivo_estado_activo">Motivo (cambio de estado) *</Label>
                <Input
                  id="motivo_estado_activo"
                  value={motivo_cambio_estado_activo}
                  onChange={(e) => {
                    limpiarCampoResaltado('activo_motivo_cambio_estado');
                    setMotivoCambioEstadoActivo(e.target.value);
                  }}
                  placeholder="Ej: mantenimiento, desuso, reasignación..."
                  className={cn(claseCampoResaltado('activo_motivo_cambio_estado'))}
                />
              </div>
            )}

            {!modo_edicion_activo && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="registrar_egreso_activo"
                  checked={formulario_activo.registrar_egreso}
                  onCheckedChange={(checked) => setFormularioActivo({ ...formulario_activo, registrar_egreso: checked })}
                />
                <Label htmlFor="registrar_egreso_activo" className="cursor-pointer flex items-center gap-2">
                  {formulario_activo.registrar_egreso ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Se registrará un GASTO en finanzas
                    </>
                  ) : (
                    'No afectar finanzas'
                  )}
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleActivoOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button id={IDS_ELEMENTOS_INVENTARIOS.BTN_CONFIRMAR_REGISTRAR_ACTIVO} onClick={manejarGuardarActivo} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                modo_edicion_activo ? 'Guardar Cambios' : 'Registrar Activo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={activoCloseConfirmation.open} onOpenChange={activoCloseConfirmation.onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. ¿Estás seguro de que deseas salir sin guardar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={activoCloseConfirmation.onCancel}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={activoCloseConfirmation.onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Descartar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogo_confirmar_eliminar_activo_abierto} onOpenChange={setDialogoConfirmarEliminarActivoAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este activo?
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
                setDialogoConfirmarEliminarActivoAbierto(false);
                setActivoAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarEliminarActivo}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_cambio_desechado_abierto} onOpenChange={setDialogoConfirmarCambioDesechadoAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas marcar este activo como desechado?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="motivo_desechar_activo">Motivo *</Label>
            <Input
              id="motivo_desechar_activo"
              value={motivo_cambio_estado_activo}
              onChange={(e) => {
                limpiarCampoResaltado('activo_motivo_desechado');
                setMotivoCambioEstadoActivo(e.target.value);
              }}
              placeholder="Ej: dañado, fin de vida útil, reemplazo..."
              className={cn(claseCampoResaltado('activo_motivo_desechado'))}
            />
          </div>

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-semibold mb-1">
              ⚠️ Esta acción eliminará permanentemente el activo
            </p>
            <p className="text-sm text-destructive">
              Cambiar el estado a "desechado" eliminará este activo del inventario. Esta acción no se puede deshacer.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoConfirmarCambioDesechadoAbierto(false);
                setActivoADesechar(null);
                setMotivoCambioEstadoActivo('');
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarCambioDesechado}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Marcar como Desechado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_vender_activo_abierto} onOpenChange={setDialogoVenderActivoAbierto}>
        <DialogContent id={IDS_ELEMENTOS_INVENTARIOS.DIALOGO_VENDER_ACTIVO} className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="h-5 w-5 flex items-center justify-center text-red-600 font-bold text-xl">−</span>
              Vender Activo
            </DialogTitle>
            <DialogDescription>
              Registra la venta de {activo_seleccionado?.nombre_asignado || activo_seleccionado?.nro_serie || 'este activo'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div id={IDS_ELEMENTOS_INVENTARIOS.CONTENEDOR_MONTO_VENTA_ACTIVO} className="space-y-2">
              <InputMoneda
                label="Monto de Venta *"
                valorLocal={formulario_venta_activo.monto_venta}
                valorUSD={formulario_venta_activo.monto_venta_usd}
                onMontoChange={(local, usd) => {
                  limpiarCampoResaltado('activo_monto_venta');
                  setFormularioVentaActivo(prev => ({
                    ...prev,
                    monto_venta: local,
                    monto_venta_usd: usd
                  }));
                }}
                inputClassName={cn(claseCampoResaltado('activo_monto_venta'))}
              />
              {activo_seleccionado && (
                <p className="text-sm text-muted-foreground">
                  Costo de compra: {formatearMonto(
                    Number((activo_seleccionado as any)?.costo_compra || 0),
                    Number((activo_seleccionado as any)?.costo_compra_usd || 0),
                  )}
                </p>
              )}
            </div>

            <div id={IDS_ELEMENTOS_INVENTARIOS.CONTENEDOR_FECHA_VENTA_ACTIVO} className="space-y-2">
              <Label htmlFor="fecha_venta">Fecha y Hora de la Venta *</Label>
              <DateTimePicker
                valor={formulario_venta_activo.fecha_venta}
                onChange={(fecha) => setFormularioVentaActivo({ ...formulario_venta_activo, fecha_venta: fecha || new Date() })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="registrar_pago_venta"
                checked={formulario_venta_activo.registrar_pago}
                onCheckedChange={(checked) => setFormularioVentaActivo({ ...formulario_venta_activo, registrar_pago: checked })}
              />
              <Label htmlFor="registrar_pago_venta" className="cursor-pointer flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Registrar ingreso en finanzas
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoVenderActivoAbierto(false)}>
              Cancelar
            </Button>
            <Button id={IDS_ELEMENTOS_INVENTARIOS.BTN_CONFIRMAR_VENDER_ACTIVO} onClick={manejarVenderActivo} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vendiendo...
                </>
              ) : (
                'Vender Activo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogo_filtros_historial_abierto} onOpenChange={setDialogoFiltrosHistorialAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Filtros de Historial</DialogTitle>
            <DialogDescription>
              Filtra los registros de {tab_activo === 'kardex' ? 'Kardex' : tab_activo === 'bitacora' ? 'Bitácora de Activos' : 'Registro de Actividad'} por fecha
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <DatePicker
                valor={filtros_historial.fecha_inicio}
                onChange={(date) => setFiltrosHistorial({ ...filtros_historial, fecha_inicio: date })}
                placeholder="Seleccionar fecha de inicio"
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <DatePicker
                valor={filtros_historial.fecha_fin}
                onChange={(date) => setFiltrosHistorial({ ...filtros_historial, fecha_fin: date })}
                placeholder="Seleccionar fecha de fin"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoFiltrosHistorialAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={aplicarFiltrosHistorial}>
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogo_detalles_auditoria_abierto} onOpenChange={setDialogoDetallesAuditoriaAbierto}>
        <DialogContent className="sm:max-w-[900px] flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Detalles del Cambio</DialogTitle>
            <DialogDescription>
              Comparación de valores antes y después de la modificación
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden py-4">
            {detalles_auditoria_seleccionada && (() => {
              const resultado = compararCambios(detalles_auditoria_seleccionada.datos_anteriores, detalles_auditoria_seleccionada.datos_nuevos);

              if (resultado.campos.length === 0) {
                return <p className="text-center text-muted-foreground">No hay cambios detectados o registrados.</p>;
              }

              return (
                <ScrollArea className="h-full w-full border rounded-md">
                  <div className="min-w-max pb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px] sticky left-0 bg-background z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Estado</TableHead>
                          {resultado.campos.map((campo, idx) => (
                            <TableHead key={idx} className="whitespace-nowrap px-4">{campo}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium sticky left-0 bg-background z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Antes</TableCell>
                          {resultado.campos.map((campo, idx) => (
                            <TableCell key={idx} className="whitespace-nowrap px-4">
                              {resultado.valoresAnteriores[campo]}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium sticky left-0 bg-background z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Ahora</TableCell>
                          {resultado.campos.map((campo, idx) => (
                            <TableCell
                              key={idx}
                              className={`whitespace-nowrap px-4 ${resultado.camposModificados.has(campo) ? 'text-red-600 font-medium bg-red-50 dark:bg-red-900/20' : ''}`}
                            >
                              {resultado.valoresNuevos[campo]}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <ScrollBar orientation="horizontal" />
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              );
            })()}
          </div>

          <DialogFooter>
            <Button onClick={() => setDialogoDetallesAuditoriaAbierto(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ProveedorTutorialesPagina>
  );
}