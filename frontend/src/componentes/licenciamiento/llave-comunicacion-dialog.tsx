import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/componentes/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/componentes/ui/dialog';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Loader2, KeyRound } from 'lucide-react';

type Props = {
  open: boolean;
  motivo?: string | null;
  onGuardar: (llave: string) => Promise<void>;
  allowClose?: boolean;
  onCerrar?: () => void;
};

export function LlaveComunicacionDialogObligatorio({ open, motivo, onGuardar, allowClose, onCerrar }: Props) {
  const [llave, setLlave] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLlave('');
    setError('');
    setGuardando(false);
  }, [open]);

  const descripcion = useMemo(() => {
    if (motivo) return motivo;
    return 'Ingresa la llave de comunicación proporcionada por el validador para habilitar activación y sugerencias.';
  }, [motivo]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const tokenPlano = llave.trim();
    if (!tokenPlano) {
      setError('Ingresa la llave.');
      return;
    }

    setGuardando(true);
    try {
      await onGuardar(tokenPlano);
    } catch (err: any) {
      setError(String(err?.message || err || 'No se pudo guardar la llave.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(siguiente) => {
        if (!siguiente && allowClose) {
          onCerrar?.();
        }
      }}
    >
      <DialogContent
        className="max-w-xl"
        hideCloseButton={!allowClose}
        onEscapeKeyDown={(e) => {
          if (!allowClose) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (!allowClose) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (!allowClose) e.preventDefault();
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <KeyRound className="h-6 w-6" />
            Llave de comunicación
          </DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="llave">Llave</Label>
            <Input
              id="llave"
              value={llave}
              onChange={(e) => setLlave(e.target.value)}
              placeholder="Pega aquí tu llave"
              disabled={guardando}
              className="h-11 bg-secondary/50"
              autoComplete="off"
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={guardando || !llave.trim()} className="min-w-56">
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Validar y continuar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
