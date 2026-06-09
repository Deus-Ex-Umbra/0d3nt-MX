import { ReactNode, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import InputMoneda from '../ui/input-moneda';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Combobox } from '../ui/combobox';
import { DateTimePicker } from '../ui/date-time-picker';
import { Loader2, Calendar, Package2, Package, AlertTriangle } from 'lucide-react';
import WizardConsumibles from '../materiales/wizard-consumibles';
import { Inventario, Producto, Paciente } from '@/tipos';
import { useAutenticacion } from '@/contextos/autenticacion-contexto';
import { IDS_ELEMENTOS_AGENDA } from '@/tutoriales/agenda/definiciones-tutoriales-agenda';
import { useMoneda } from '@/hooks/use-moneda';
import { useClinica } from '@/contextos/clinica-contexto';

interface DialogoGestionCitaProps {
  abierto: boolean;
  onCerrar: () => void;
  modoEdicion: boolean;
  soloVisualizar?: boolean;
  mensajeVisualizacion?: string | null;
  recursosSoloLectura?: boolean;
  bloquearSelectorFecha?: boolean;
  tienePlanTratamiento?: boolean;
  cargandoPlanTratamiento?: boolean;
  planTratamiento?: {
    costo_total?: number;
    costo_total_usd?: number;
    tasa_cambio?: number;
    total_abonado?: number;
    total_abonado_usd?: number;
    citas?: Array<{ estado_pago?: string | null }>;
  } | null;
  formulario: {
    paciente_id: string;
    fecha: Date | undefined;
    descripcion: string;
    estado_pago: string;
    monto_esperado: string;
    monto_esperado_usd: string;
    horas_aproximadas: string;
    minutos_aproximados: string;
  };
  setFormulario: (formulario: any) => void;
  pacientes: Paciente[];
  inventarios: Inventario[];
  productosPorInventario: Record<number, Producto[]>;
  cargarInventarios: () => Promise<void>;
  cargarProductosInventario: (id: number) => Promise<void>;
  consumiblesSeleccionados: any[];
  setConsumiblesSeleccionados: (consumibles: any[]) => void;
  guardando: boolean;
  hayCambios: boolean;
  manejarGuardar: () => void;
  opcionesEstadosPago: { valor: string; etiqueta: string }[];
  pacienteDeshabilitado?: boolean;
  accionPagoUI?: ReactNode;
}

const formatearFechaHoraLocal = (fecha?: Date): string => {
  if (!fecha) return '';
  const f = new Date(fecha);
  const dia = String(f.getDate()).padStart(2, '0');
  const mes = String(f.getMonth() + 1).padStart(2, '0');
  const anio = f.getFullYear();
  const horas = String(f.getHours()).padStart(2, '0');
  const minutos = String(f.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
};

export default function DialogoGestionCita({
  abierto,
  onCerrar,
  modoEdicion,
  soloVisualizar = false,
  mensajeVisualizacion = null,
  recursosSoloLectura = false,
  bloquearSelectorFecha = false,
  tienePlanTratamiento = false,
  cargandoPlanTratamiento = false,
  planTratamiento = null,
  formulario,
  setFormulario,
  pacientes,
  inventarios,
  productosPorInventario,
  cargarInventarios,
  cargarProductosInventario,
  consumiblesSeleccionados,
  setConsumiblesSeleccionados,
  guardando,
  hayCambios,
  manejarGuardar,
  opcionesEstadosPago,
  pacienteDeshabilitado = false,
  accionPagoUI
}: DialogoGestionCitaProps) {

  const { usuario } = useAutenticacion();
  const modo_edicion_historica_activo = !!usuario?.modo_edicion_historica;
  const { formatearMonedaJSX } = useMoneda();
  const { config_clinica } = useClinica();
  const usarUSD = config_clinica?.trabajar_con === 'usd';
  const tasa = Number(config_clinica?.cambio_dolar ?? 0);
  const tasaSegura = tasa > 0 ? tasa : 1;

  const deshabilitado_general = !!soloVisualizar;
  const recursos_solo_lectura = deshabilitado_general || !!recursosSoloLectura;

  const montoSugerido = useMemo(() => {
    if (!tienePlanTratamiento) return null;
    if (!planTratamiento) return null;
    const tasaPlan = Number(planTratamiento.tasa_cambio ?? 0);
    const tasaPlanSegura = tasaPlan > 0 ? tasaPlan : tasaSegura;

    const totalLocal = Number(planTratamiento.costo_total ?? 0);
    const totalUSD = Number(planTratamiento.costo_total_usd ?? 0);
    const abonadoLocal = Number(planTratamiento.total_abonado ?? 0);
    const abonadoUSD = Number(planTratamiento.total_abonado_usd ?? 0);

    const total = usarUSD
      ? (totalUSD > 0 ? totalUSD : totalLocal / tasaPlanSegura)
      : totalLocal;
    const abonado = usarUSD
      ? (abonadoUSD > 0 ? abonadoUSD : abonadoLocal / tasaPlanSegura)
      : abonadoLocal;
    const restante = Math.max(0, total - abonado);
    const citas = Array.isArray(planTratamiento.citas) ? planTratamiento.citas : [];
    const pendientes = citas.filter((c) => {
      const estado = String(c?.estado_pago ?? 'pendiente').toLowerCase();
      return estado !== 'pagado' && estado !== 'cancelado';
    }).length;

    if (restante <= 0 || pendientes <= 0) return 0;
    return restante / pendientes;
  }, [tienePlanTratamiento, planTratamiento, usarUSD, tasaSegura]);

  const footerSugerido = useMemo(() => {
    if (!tienePlanTratamiento) return null;
    if (cargandoPlanTratamiento) return <>Sugerido: cargando...</>;
    const valor = montoSugerido ?? 0;
    return (
      <>
        Sugerido:{' '}
        <span className="font-medium text-foreground">
          {usarUSD ? `USD ${Number(valor).toFixed(2)}` : formatearMonedaJSX(valor)}
        </span>
      </>
    );
  }, [tienePlanTratamiento, cargandoPlanTratamiento, montoSugerido, usarUSD, formatearMonedaJSX]);

  const opciones_pacientes = [
    { valor: '', etiqueta: 'Evento general (sin paciente)' },
    ...pacientes.map(p => ({
      valor: p.id.toString(),
      etiqueta: `${p.nombre} ${p.apellidos}`
    }))
  ];

  const tiene_paciente = formulario.paciente_id !== '';

  const clampEnteroEnRango = (valor: string, min: number, max: number, valorVacio: string = '0'): string => {
    if (valor === '') return valorVacio;
    const n = parseInt(valor, 10);
    if (Number.isNaN(n)) return valorVacio;
    return String(Math.min(max, Math.max(min, n)));
  };

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {soloVisualizar ? 'Ver Cita' : (modoEdicion ? 'Editar Cita' : 'Nueva Cita')}
          </DialogTitle>
          <div id="dialog-gestion-cita"></div>
          <DialogDescription>
            {soloVisualizar
              ? 'Solo visualización.'
              : (modoEdicion ? 'Modifica los detalles de la cita' : 'Programa una nueva cita o evento')}
          </DialogDescription>
        </DialogHeader>

        {soloVisualizar && !!mensajeVisualizacion && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {mensajeVisualizacion}
            </p>
          </div>
        )}

        <Tabs defaultValue="datos" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger id={IDS_ELEMENTOS_AGENDA.TAB_DATOS} value="datos" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Datos de la Cita
            </TabsTrigger>
            <TabsTrigger
              id={IDS_ELEMENTOS_AGENDA.TAB_RECURSOS}
              value="recursos"
              disabled={!formulario.paciente_id}
              className="flex items-center gap-2"
            >
              <Package2 className="h-4 w-4" />
              Recursos
              {consumiblesSeleccionados.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {consumiblesSeleccionados.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="datos" className="flex-1 overflow-y-auto px-1 space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="paciente">Paciente (opcional)</Label>
              <div id="cita-input-paciente">
                <Combobox
                  opciones={opciones_pacientes}
                  valor={formulario.paciente_id}
                  onChange={(valor) => setFormulario({ ...formulario, paciente_id: valor })}
                  placeholder="Selecciona un paciente"
                  disabled={deshabilitado_general || pacienteDeshabilitado}
                  idTrigger={IDS_ELEMENTOS_AGENDA.TRIGGER_PACIENTE}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Si no seleccionas un paciente, será un evento general sin estado ni monto
              </p>
            </div>

            <div id="cita-grupo-campos-basicos" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha y Hora *</Label>
                <div id="cita-input-fecha">
                  {deshabilitado_general ? (
                    <Input
                      value={formatearFechaHoraLocal(formulario.fecha)}
                      disabled
                      className="bg-muted"
                    />
                  ) : (
                    <DateTimePicker
                      valor={formulario.fecha}
                      onChange={(fecha) => setFormulario({ ...formulario, fecha })}
                      placeholder="Selecciona fecha y hora"
                      deshabilitarFecha={bloquearSelectorFecha}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2" id="cita-input-fecha-container">
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <div id="cita-input-descripcion">
                  <Textarea
                    id="descripcion"
                    value={formulario.descripcion}
                    onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                    placeholder="Ej: Consulta general, Limpieza dental, Reunión..."
                    rows={3}
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                    disabled={deshabilitado_general}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duración Aproximada</Label>
                <div className="grid grid-cols-2 gap-4" id="cita-input-horas-container">
                  <div className="space-y-2">
                    <Label htmlFor="horas_aproximadas" className="text-xs text-muted-foreground">
                      Horas
                    </Label>
                    <div id="cita-input-horas">
                      <Input
                        id="horas_aproximadas"
                        type="number"
                        min="0"
                        max="23"
                        value={formulario.horas_aproximadas}
                        onChange={(e) => setFormulario({
                          ...formulario,
                          horas_aproximadas: clampEnteroEnRango(e.target.value, 0, 23, '0'),
                        })}
                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') e.preventDefault(); }}
                        placeholder="0"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                        disabled={deshabilitado_general}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minutos_aproximados" className="text-xs text-muted-foreground">
                      Minutos
                    </Label>
                    <Input
                      id="minutos_aproximados"
                      type="number"
                      min="0"
                      max="59"
                      value={formulario.minutos_aproximados}
                      onChange={(e) => setFormulario({
                        ...formulario,
                        minutos_aproximados: clampEnteroEnRango(e.target.value, 0, 59, '0'),
                      })}
                      onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') e.preventDefault(); }}
                      placeholder="30"
                      className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                      disabled={deshabilitado_general}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tiempo estimado de la cita (para validación de conflictos de horario)
                </p>
              </div>
            </div>

            {tiene_paciente && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estado_pago">Estado de Pago</Label>
                    <div id="cita-input-estado-pago">
                      <Combobox
                        opciones={opcionesEstadosPago.map(e => ({ valor: e.valor, etiqueta: e.etiqueta }))}
                        valor={formulario.estado_pago}
                        onChange={(valor) => {
                          const seleccionado = valor || formulario.estado_pago || opcionesEstadosPago[0]?.valor || 'pendiente';
                          setFormulario({ ...formulario, estado_pago: seleccionado });
                        }}
                        placeholder="Estado"
                        disabled={deshabilitado_general || (!modoEdicion && !modo_edicion_historica_activo)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div id="cita-input-monto">
                      <InputMoneda
                        label="Monto Esperado"
                        valorLocal={formulario.monto_esperado}
                        valorUSD={formulario.monto_esperado_usd}
                        onMontoChange={(local, usd) =>
                          setFormulario({ ...formulario, monto_esperado: local, monto_esperado_usd: usd })
                        }
                        footerRight={footerSugerido ?? undefined}
                      />
                    </div>
                  </div>
                </div>
                {accionPagoUI}
              </>
            )}
          </TabsContent>

          <TabsContent
            value="recursos"
            className="flex-1 overflow-y-auto px-1 space-y-4 mt-4"
            onFocus={async () => {
              if (inventarios.length === 0) {
                await cargarInventarios();
              }
            }}
          >
            {!formulario.paciente_id ? (
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Paciente requerido
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Debes seleccionar un paciente en la pestaña "Datos" para poder asignar recursos a esta cita.
                  </p>
                </div>
              </div>
            ) : (
              <div id="cita-recursos-contenido" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium text-foreground">Consumibles</h3>
                  {consumiblesSeleccionados.length > 0 && (
                    <Badge variant="secondary">
                      {consumiblesSeleccionados.length}
                    </Badge>
                  )}
                </div>
                <WizardConsumibles
                  inventarios={inventarios}
                  productos_por_inventario={productosPorInventario}
                  cargarProductos={cargarProductosInventario}
                  materialesSeleccionados={consumiblesSeleccionados}
                  onAgregarMaterial={(material) => setConsumiblesSeleccionados([...consumiblesSeleccionados, material])}
                  onEliminarMaterial={(idx) => setConsumiblesSeleccionados(consumiblesSeleccionados.filter((_, i) => i !== idx))}
                  onActualizarCantidad={(idx, cantidad) => {
                    const nuevos = [...consumiblesSeleccionados];
                    nuevos[idx] = { ...nuevos[idx], cantidad };
                    setConsumiblesSeleccionados(nuevos);
                  }}
                  readOnly={recursos_solo_lectura}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            id="cita-btn-cancelar"
            variant="outline"
            onClick={onCerrar}
            disabled={guardando}
            className="hover:scale-105 transition-all duration-200"
          >
            {soloVisualizar ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!soloVisualizar && (
            <Button
              id="cita-btn-guardar"
              onClick={manejarGuardar}
              disabled={guardando || (modoEdicion && !hayCambios)}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modoEdicion ? 'Actualizar' : 'Crear'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}
