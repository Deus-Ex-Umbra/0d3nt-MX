import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Checkbox } from '@/componentes/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/componentes/ui/dialog';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { EULA_TEXTO, EULA_VERSION } from '@/lib/eula-texto';

type Props = {
  open: boolean;
  cargando?: boolean;
  error?: string;
  onAceptar: () => Promise<void> | void;
};

export function EulaDialogObligatorio({ open, cargando, error, onAceptar }: Props) {
  const [confirmoLectura, setConfirmoLectura] = useState(false);
  const [confirmoConsentimiento, setConfirmoConsentimiento] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirmoLectura(false);
    setConfirmoConsentimiento(false);
  }, [open]);

  const puedeAceptar = useMemo(() => {
    if (cargando) return false;
    return confirmoLectura && confirmoConsentimiento;
  }, [cargando, confirmoLectura, confirmoConsentimiento]);

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-3xl"
        hideCloseButton
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl">Acuerdo de licencia (EULA)</DialogTitle>
          <DialogDescription>
            Para usar 0d3ntApp debes leer y aceptar el EULA.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="rounded-lg border bg-secondary/20">
            <ScrollArea className="h-[45vh]">
              <div className="p-4 text-sm text-foreground/90 leading-relaxed text-justify space-y-4">
                <div dangerouslySetInnerHTML={{ __html: EULA_TEXTO }} />

                <div className="mt-6 text-xs text-muted-foreground">
                  Versión: <span className="font-mono">{EULA_VERSION}</span>
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="eula-leido"
                checked={confirmoLectura}
                onCheckedChange={(v) => setConfirmoLectura(v === true)}
              />
              <label htmlFor="eula-leido" className="text-sm leading-5">
                Confirmo que he leído completamente el EULA.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="eula-acepto"
                checked={confirmoConsentimiento}
                onCheckedChange={(v) => setConfirmoConsentimiento(v === true)}
              />
              <label htmlFor="eula-acepto" className="text-sm leading-5">
                Acepto los términos y condiciones del EULA.
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onAceptar()}
            disabled={!puedeAceptar}
            className="min-w-56"
          >
            {cargando ? 'Registrando...' : 'Aceptar y continuar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
