import { useState, useEffect } from 'react';
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
import { Button } from "@/componentes/ui/button";
import { Label } from "@/componentes/ui/label";

interface DialogoAccionPagoProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: (accion: 'mantener' | 'reembolsar' | 'eliminar') => void;
}

export default function DialogoAccionPago({
  abierto,
  onCerrar,
  onConfirmar
}: DialogoAccionPagoProps) {
  const [accion, setAccion] = useState<'mantener' | 'reembolsar' | 'eliminar' | null>(null);
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);

  useEffect(() => {
    if (abierto) {
      setAccion(null);
      setMostrarConfirmacionEliminar(false);
    }
  }, [abierto]);

  const manejarContinuar = () => {
    if (accion === 'eliminar') {
      setMostrarConfirmacionEliminar(true);
    } else if (accion) {
      onConfirmar(accion);
    }
  };

  const confirmarEliminacion = () => {
    setMostrarConfirmacionEliminar(false);
    if (accion) {
      onConfirmar(accion);
    }
  };

  return (
    <>
      <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Acción sobre el Pago</DialogTitle>
            <DialogDescription>
              La cita que estás cancelando ya tiene un pago registrado. ¿Qué deseas hacer con el pago?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="mantener"
                name="accion_pago"
                value="mantener"
                checked={accion === 'mantener'}
                onChange={() => setAccion('mantener')}
                className="accent-indigo-600 h-4 w-4"
              />
              <Label htmlFor="mantener" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                Mantener el Pago
                <span className="block text-xs text-muted-foreground font-normal mt-1">
                  Desvincula el pago de esta cita, pero lo mantiene en el sistema.
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="reembolsar"
                name="accion_pago"
                value="reembolsar"
                checked={accion === 'reembolsar'}
                onChange={() => setAccion('reembolsar')}
                className="accent-indigo-600 h-4 w-4"
              />
              <Label htmlFor="reembolsar" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                Reembolsar el Pago
                <span className="block text-xs text-muted-foreground font-normal mt-1">
                  Crea un egreso por "Reembolso por cancelación de cita".
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="eliminar"
                name="accion_pago"
                value="eliminar"
                checked={accion === 'eliminar'}
                onChange={() => setAccion('eliminar')}
                className="accent-red-600 h-4 w-4 text-red-600"
              />
              <Label htmlFor="eliminar" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-red-600 cursor-pointer">
                Eliminar el Pago
                <span className="block text-xs text-muted-foreground font-normal mt-1 text-red-500">
                  Borra el registro del pago (úsalo si fue un error).
                </span>
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button onClick={manejarContinuar} disabled={!accion}>Continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={mostrarConfirmacionEliminar} onOpenChange={setMostrarConfirmacionEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el registro del pago asociado a esta cita. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarEliminacion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sí, eliminar pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
