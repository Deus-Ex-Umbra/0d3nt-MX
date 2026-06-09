import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/componentes/ui/accordion';
import { useMemo, useState } from 'react';

type PacienteLite = {
  nombre?: string;
  apellidos?: string;
  paciente_eliminado?: boolean;
};

export type CitaReferenciaLite = {
  descripcion?: string;
  paciente?: PacienteLite | null;
};

export type PlanTratamientoReferenciaLite = {
  tratamiento?: { nombre?: string } | null;
};

function formatearPaciente(paciente?: PacienteLite | null): string {
  const nombre = paciente?.nombre?.trim() || '';
  const apellidos = paciente?.apellidos?.trim() || '';
  const completo = `${nombre} ${apellidos}`.trim();
  if (!completo) return 'Paciente no especificado';
  if (paciente?.paciente_eliminado) return `${completo} (eliminado)`;
  return completo;
}

export function ReferenciaCitaTratamiento({
  cita,
  plan,
  className,
}: {
  cita?: CitaReferenciaLite | null;
  plan?: PlanTratamientoReferenciaLite | null;
  className?: string;
}) {
  const nombre_tratamiento = plan?.tratamiento?.nombre?.trim();
  const descripcion_cita = cita?.descripcion?.trim();
  const paciente = formatearPaciente(cita?.paciente);

  const tiene_cita = !!cita;
  const tiene_tratamiento = !!plan;

  if (!tiene_cita && !tiene_tratamiento) return null;

  const [valor, setValor] = useState<string>('');
  const esta_abierto = useMemo(() => valor === 'ref', [valor]);

  return (
    <Accordion
      type="single"
      collapsible
      className={className}
      value={valor}
      onValueChange={setValor}
    >
      <AccordionItem value="ref" className="border-0">
        <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
          {esta_abierto ? 'Menos Detalles…' : 'Más Detalles…'}
        </AccordionTrigger>
        <AccordionContent className="pt-2">
          <div className="space-y-1 text-xs text-muted-foreground whitespace-pre-wrap break-words">
            {tiene_tratamiento && (
              <div>
                <span className="font-medium text-foreground">Tratamiento:</span> {nombre_tratamiento || 'Sin nombre'}
              </div>
            )}
            {tiene_cita && (
              <div>
                <span className="font-medium text-foreground">Cita:</span> {descripcion_cita || 'Sin descripción'}
              </div>
            )}
            {tiene_cita && (
              <div>
                <span className="font-medium text-foreground">Paciente:</span> {paciente}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
