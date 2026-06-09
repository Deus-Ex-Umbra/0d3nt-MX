import { ReactNode, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Combobox } from '../ui/combobox';
import { Loader2, Package, AlertTriangle, Coins } from 'lucide-react';
import WizardConsumibles from '../materiales/wizard-consumibles';
import { Inventario, Producto } from '@/tipos';

import { useMoneda } from '@/hooks/use-moneda';
import { useClinica } from '@/contextos/clinica-contexto';
import InputMoneda from '../ui/input-moneda';

interface DialogoConfirmacionCitaProps {
  abierto: boolean;
  onCerrar: () => void;
  planTratamiento?: {
    costo_total?: number;
    costo_total_usd?: number;
    tasa_cambio?: number;
    total_abonado?: number;
    total_abonado_usd?: number;
    citas?: Array<{ estado_pago?: string | null }>;
  } | null;
  tienePlanTratamiento?: boolean;
  cargandoPlanTratamiento?: boolean;
  estadoPago: string;
  setEstadoPago: (estado: string) => void;
  montoLocal: string;
  montoUSD: string;
  onMontoChange: (local: string, usd: string) => void;
  consumibles: any[];
  setConsumibles: (consumibles: any[]) => void;
  inventarios: Inventario[];
  productosPorInventario: Record<number, Producto[]>;
  cargarProductosInventario: (id: number) => Promise<void>;
  cargandoMateriales: boolean;
  guardando: boolean;
  manejarConfirmar: () => void;
  opcionesEstadosPago: { valor: string; etiqueta: string }[];
  accionPagoUI?: ReactNode;
  accionPago?: 'mantener' | 'reembolsar' | 'eliminar';
  setAccionPago?: (accion: 'mantener' | 'reembolsar' | 'eliminar') => void;
  confirmarPagoAbierto?: boolean;
}

export default function DialogoConfirmacionCita({
  abierto,
  onCerrar,
  planTratamiento = null,
  tienePlanTratamiento = false,
  cargandoPlanTratamiento = false,
  estadoPago,
  setEstadoPago,
  montoLocal,
  montoUSD,
  onMontoChange,
  consumibles,
  setConsumibles,
  inventarios,
  productosPorInventario,
  cargarProductosInventario,
  guardando,
  manejarConfirmar,
  opcionesEstadosPago,
  accionPagoUI
}: DialogoConfirmacionCitaProps) {
  const { formatearMonedaJSX } = useMoneda();
  const { config_clinica } = useClinica();
  const usarUSD = config_clinica?.trabajar_con === 'usd';
  const tasa = Number(config_clinica?.cambio_dolar ?? 0);
  const tasaSegura = tasa > 0 ? tasa : 1;

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

  const textoSugerido = useMemo(() => {
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

  const excedeStock = useMemo(() => {
    return (consumibles || []).some((m: any) => Number(m?.cantidad ?? 0) > Number(m?.stock_disponible ?? 0));
  }, [consumibles]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Confirmar Cita Realizada</DialogTitle>
          <div id="dialog-confirmacion-cita"></div>
          <DialogDescription>
            Confirma el estado de pago, monto y materiales realmente utilizados en esta cita
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
          <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Esta acción registrará el estado final de la cita, consumo de materiales y actualizará el inventario
          </p>
        </div>

        {excedeStock && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Hay consumibles con cantidad mayor al stock disponible. Ajusta las cantidades para poder confirmar.
            </p>
          </div>
        )}

        <Tabs defaultValue="datos" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger id="confirmacion-tab-datos" value="datos" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Datos de Cierre
            </TabsTrigger>
            <TabsTrigger id="confirmacion-tab-recursos" value="recursos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Recursos Utilizados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="datos" className="flex-1 overflow-y-auto">
            <div className="border rounded-lg p-4 space-y-3 bg-blue-500/5">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Estado de Pago y Monto
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado de Pago</Label>
                  <div id="confirmacion-input-estado-pago">
                    <Combobox
                      opciones={opcionesEstadosPago.map(e => ({ valor: e.valor, etiqueta: e.etiqueta }))}
                      valor={estadoPago}
                      onChange={(valor) => {
                        const seleccionado = valor || estadoPago || opcionesEstadosPago[0]?.valor || 'pendiente';
                        setEstadoPago(seleccionado);
                      }}
                      placeholder="Selecciona estado"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div id="confirmacion-input-monto">
                    <InputMoneda
                      label="Monto Final"
                      valorLocal={montoLocal}
                      valorUSD={montoUSD}
                      onMontoChange={onMontoChange}
                      footerRight={tienePlanTratamiento ? textoSugerido ?? undefined : undefined}
                    />
                  </div>
                </div>
              </div>
              {accionPagoUI}
            </div>
          </TabsContent>

          <TabsContent value="recursos" className="flex-1 overflow-y-auto flex flex-col">
            <div id="confirmacion-recursos-contenido" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium text-foreground">Consumibles Utilizados</h3>
                {consumibles.length > 0 && (
                  <Badge variant="secondary">
                    {consumibles.length}
                  </Badge>
                )}
              </div>
              <div id="confirmacion-wizard-consumibles">
              <WizardConsumibles
                inventarios={inventarios}
                productos_por_inventario={productosPorInventario}
                cargarProductos={cargarProductosInventario}
                materialesSeleccionados={consumibles}
                onAgregarMaterial={(material) => setConsumibles([...consumibles, material])}
                onEliminarMaterial={(idx) => setConsumibles(consumibles.filter((_, i) => i !== idx))}
                onActualizarCantidad={(idx, cantidad) => {
                  const nuevos = [...consumibles];
                  nuevos[idx] = { ...nuevos[idx], cantidad };
                  setConsumibles(nuevos);
                }}
                readOnly={false}
              />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            id="confirmacion-btn-cancelar"
            variant="outline"
            onClick={onCerrar}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button
            id="confirmacion-btn-confirmar"
            onClick={manejarConfirmar}
            disabled={guardando || excedeStock}
            className="bg-green-600 hover:bg-green-700"
          >
            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Cita y Materiales
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
