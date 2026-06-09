import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/componentes/ui/dialog";
import { Button } from "@/componentes/ui/button";
import { Label } from "@/componentes/ui/label";
import { Combobox } from "@/componentes/ui/combobox";
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { Loader2, Calendar, Clock, DollarSign, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useMoneda } from '@/hooks/use-moneda';
import { useSafeClose } from '@/hooks/use-safe-close';
import { Tratamiento, Paciente } from '@/tipos';
import { useClinica } from '@/contextos/clinica-contexto';

interface DialogoAsignarTratamientoProps {
  abierto: boolean;
  onCerrar: () => void;
  tratamientos: Tratamiento[];
  pacientes: Paciente[];
  tratamientoPreseleccionado: Tratamiento | null;
  onAsignar: (datos: { paciente_id: number; tratamiento_id: number; fecha_inicio: Date }) => Promise<void>;
}

export default function DialogoAsignarTratamiento({
  abierto,
  onCerrar,
  tratamientos,
  pacientes,
  tratamientoPreseleccionado,
  onAsignar
}: DialogoAsignarTratamientoProps) {
  const { formatearMonedaJSX, formatearMoneda } = useMoneda();
  const { config_clinica } = useClinica();
  const usarUSD = config_clinica?.trabajar_con === 'usd';
  const cambio_dolar = config_clinica?.cambio_dolar || 1;
  const [guardando, setGuardando] = useState(false);
  const [tratamientoSeleccionado, setTratamientoSeleccionado] = useState<Tratamiento | null>(null);

  const [formulario, setFormulario] = useState({
    paciente_id: "",
    tratamiento_id: "",
    fecha_inicio: undefined as Date | undefined,
  });

  const [formularioInicial, setFormularioInicial] = useState({
    paciente_id: "",
    tratamiento_id: "",
    fecha_inicio: undefined as Date | undefined,
  });

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

  useEffect(() => {
    if (abierto) {
      const fechaInicio = redondearA15Minutos(new Date());
      const tratamientoId = tratamientoPreseleccionado ? tratamientoPreseleccionado.id.toString() : "";
      
      const inicial = {
        paciente_id: "",
        tratamiento_id: tratamientoId,
        fecha_inicio: fechaInicio,
      };

      setFormulario(inicial);
      setFormularioInicial(inicial);
      setTratamientoSeleccionado(tratamientoPreseleccionado);
    }
  }, [abierto, tratamientoPreseleccionado]);
  useEffect(() => {
    if (formulario.tratamiento_id) {
      const tratamiento = tratamientos.find(t => t.id.toString() === formulario.tratamiento_id);
      setTratamientoSeleccionado(tratamiento || null);
    } else {
      setTratamientoSeleccionado(null);
    }
  }, [formulario.tratamiento_id, tratamientos]);

  const { handleOpenChange, closeConfirmationProps } = useSafeClose({
    isOpen: abierto,
    onOpenChange: (open) => !open && onCerrar(),
    isDirty: JSON.stringify(formulario) !== JSON.stringify(formularioInicial),
  });

  const manejarGuardar = async () => {
    if (!formulario.paciente_id || !formulario.tratamiento_id || !formulario.fecha_inicio) {
      return;
    }

    setGuardando(true);
    try {
      await onAsignar({
        paciente_id: parseInt(formulario.paciente_id),
        tratamiento_id: parseInt(formulario.tratamiento_id),
        fecha_inicio: formulario.fecha_inicio,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setGuardando(false);
    }
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

  const formatearDuracion = (horas: number, minutos: number): string => {
    if (horas > 0 && minutos > 0) {
      return `${horas}h ${minutos}min`;
    } else if (horas > 0) {
      return `${horas}h`;
    } else {
      return `${minutos}min`;
    }
  };

  const opciones_pacientes = pacientes.map(p => ({
    valor: p.id.toString(),
    etiqueta: `${p.nombre} ${p.apellidos}`
  }));

  const opciones_tratamientos = tratamientos.map(t => ({
    valor: t.id.toString(),
    etiqueta: `${t.nombre} • ${t.numero_citas} citas • ${usarUSD
      ? `USD ${(Number(t.costo_total || 0) / Number(cambio_dolar || 1)).toFixed(2)}`
      : formatearMoneda(t.costo_total)
      }`
  }));

  const autoCompletarAl100 = tratamientoSeleccionado
    ? (tratamientoSeleccionado.auto_completar_al_100 !== false)
    : true;

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <DialogContent id="dialog-tratamientos-asignar" className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Asignar Plan de Tratamiento</DialogTitle>
          <DialogDescription>
            Busca una plantilla y asígnala a un paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!tratamientoPreseleccionado && (
            <div id="tratamientos-asignar-select-plantilla" className="space-y-2">
              <Label>Plantilla de Tratamiento</Label>
              <Combobox
                opciones={opciones_tratamientos}
                valor={formulario.tratamiento_id}
                onChange={(valor) => setFormulario({ ...formulario, tratamiento_id: valor })}
                placeholder="Buscar plantilla por nombre..."
                textoVacio="No se encontraron plantillas"
              />
            </div>
          )}

          {tratamientoSeleccionado && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
              <div id="tratamientos-asignar-select-paciente" className="space-y-2">
                <Label htmlFor="paciente">Paciente *</Label>
                <Combobox
                  opciones={opciones_pacientes}
                  valor={formulario.paciente_id}
                  onChange={(valor) => setFormulario({ ...formulario, paciente_id: valor })}
                  placeholder="Selecciona un paciente"
                />
              </div>

              <div id="tratamientos-asignar-fecha-inicio" className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha y Hora de Inicio de las Citas *</Label>
                <DateTimePicker
                  valor={formulario.fecha_inicio}
                  onChange={(fecha) => fecha && setFormulario({ ...formulario, fecha_inicio: fecha })}
                  placeholder="Selecciona fecha y hora"
                />
                <p className="text-xs text-muted-foreground">
                  Todas las citas comenzarán a esta hora
                </p>
              </div>

               <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
                <h4 className="font-semibold text-sm text-foreground">
                  Detalles del Tratamiento:
                </h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {tratamientoSeleccionado.numero_citas} citas programadas
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {obtenerTextoIntervalo(tratamientoSeleccionado)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duración por cita: {formatearDuracion((tratamientoSeleccionado as any).horas_aproximadas_citas || 0, (tratamientoSeleccionado as any).minutos_aproximados_citas || 30)}
                  </p>
                  <p className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Costo total:{" "}
                    {usarUSD
                      ? <>USD {(Number(tratamientoSeleccionado.costo_total || 0) / Number(cambio_dolar || 1)).toFixed(2)}</>
                      : formatearMonedaJSX(tratamientoSeleccionado.costo_total)
                    }
                  </p>
                  <p className="flex items-center gap-2">
                    {autoCompletarAl100 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    Finalizar al Completar Pagos: <span className="font-medium text-foreground">{autoCompletarAl100 ? 'Sí' : 'No'}</span>
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  El sistema validará automáticamente que no haya conflictos de horario considerando la duración de cada cita.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            id="btn-tratamientos-asignar-cancelar"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={guardando}
            className="hover:scale-105 transition-all duration-200"
          >
            Cancelar
          </Button>
          <Button
            id="btn-tratamientos-asignar-guardar"
            onClick={manejarGuardar}
            disabled={guardando || !formulario.tratamiento_id || !formulario.paciente_id || !formulario.fecha_inicio}
            className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
          >
            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Asignar Tratamiento
          </Button>
        </DialogFooter>
         <Dialog open={closeConfirmationProps.open} onOpenChange={closeConfirmationProps.onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>¿Descartar cambios?</DialogTitle>
                    <DialogDescription>
                        Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={closeConfirmationProps.onCancel}>
                        Continuar editando
                    </Button>
                    <Button variant="destructive" onClick={closeConfirmationProps.onConfirm}>
                        Descartar cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
