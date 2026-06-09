import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/componentes/ui/dialog";
import { Button } from "@/componentes/ui/button";
import { Progress } from "@/componentes/ui/progress";
import { ScrollArea } from "@/componentes/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/componentes/ui/accordion";
import { Check, Lock, PlayCircle, BookOpen, Loader2, X, AlertCircle } from "lucide-react";
import { useTutorialesPagina } from "@/contextos/tutoriales";
import type { TutorialDefinicion } from "@/contextos/tutoriales/tipos-tutoriales";
import { cn } from "@/lib/utilidades";

interface TutorialModalProps {
  abierto: boolean;
  alCerrar: () => void;
  tema?: string;
  ocultarBotonCerrar?: boolean;
  bloquearCierreFuera?: boolean;
}

export function TutorialModal({ abierto, alCerrar, tema, ocultarBotonCerrar, bloquearCierreFuera }: TutorialModalProps) {
  let contextDisponible = false;
  let progreso = null;
  let cargando = true;
  let definiciones: TutorialDefinicion[] = [];
  let iniciarTutorial = (nombre: string) => { void nombre; };
  let tutorialesIniciados = new Set<string>();

  try {
    const context = useTutorialesPagina();
    contextDisponible = true;
    progreso = context.progreso;
    cargando = context.cargando;
    definiciones = context.definiciones;
    iniciarTutorial = context.iniciarTutorial;
    tutorialesIniciados = new Set(
      context.progreso?.tutoriales
        .filter(t => t.completado || t.iniciado)
        .map(t => t.nombre) || []
    );
  } catch {
    contextDisponible = false;
  }

  const handleIniciarTutorial = (nombre: string) => {
    alCerrar();
    setTimeout(() => {
      iniciarTutorial(nombre);
    }, 300);
  };

  const manejarCambioApertura = (open: boolean) => {
    if (!open && !bloquearCierreFuera) alCerrar();
  };

  const bloquearInteraccionFuera = (e: Event) => {
    if (bloquearCierreFuera) e.preventDefault();
  };

  if (!contextDisponible) {
    return (
      <Dialog open={abierto} onOpenChange={manejarCambioApertura}>
        <DialogContent
          className="sm:max-w-[425px]"
          hideCloseButton={ocultarBotonCerrar}
          onInteractOutside={bloquearInteraccionFuera}
          onEscapeKeyDown={bloquearInteraccionFuera}
        >
          <DialogHeader>
            <DialogTitle>Tutorial {tema ? `- ${tema}` : ''}</DialogTitle>
            <DialogDescription>
              ¿En qué deseas ayuda?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Próximamente encontrarás aquí guías y tutoriales interactivos para ayudarte a utilizar el sistema.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={alCerrar}>Entendido</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const porcentaje = progreso?.porcentajeCompletado ?? 0;
  const tutorialesCompletados = progreso?.tutorialesCompletados ?? 0;
  const totalTutoriales = progreso?.totalTutoriales ?? 0;

  return (
    <Dialog open={abierto} onOpenChange={manejarCambioApertura}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[85vh]"
        hideCloseButton={ocultarBotonCerrar}
        onInteractOutside={bloquearInteraccionFuera}
        onEscapeKeyDown={bloquearInteraccionFuera}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Tutoriales {tema ? `- ${tema}` : ''}
          </DialogTitle>
          <DialogDescription>
            Aprende a usar todas las funcionalidades de esta sección
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">
              {tutorialesCompletados} de {totalTutoriales} completados ({porcentaje}%)
            </span>
          </div>
          <Progress value={porcentaje} className="h-2" />
        </div>

        <ScrollArea className="h-[400px] pr-4 -mr-4">
          {cargando ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {definiciones.map((tutorial) => {
                const estado = progreso?.tutoriales.find(t => t.nombre === tutorial.nombre);
                const completado = estado?.completado ?? false;
                const bloqueado = estado?.bloqueado ?? false;
                const iniciado = tutorialesIniciados.has(tutorial.nombre);
                const condicionesPrevias = tutorial.condicionBloqueo?.condicionesPrevias || [];
                const tieneCondiciones = condicionesPrevias.length > 0;

                return (
                  <div
                    key={tutorial.nombre}
                    className={cn(
                      "rounded-lg border transition-all",
                      bloqueado
                        ? "bg-muted/50 border-muted opacity-60"
                        : completado
                          ? "bg-emerald-500/10 border-emerald-500/25"
                          : iniciado
                            ? "bg-blue-500/10 border-blue-500/25"
                            : "bg-background border-border"
                    )}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                          bloqueado
                            ? "bg-muted text-muted-foreground"
                            : completado
                              ? "bg-emerald-500/15 text-emerald-600"
                              : iniciado
                                ? "bg-blue-500/15 text-blue-600"
                                : "bg-primary/10 text-primary"
                        )}>
                          {bloqueado ? (
                            <Lock className="h-4 w-4" />
                          ) : completado ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <span className="text-sm">{tutorial.icono || '📖'}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            "font-medium text-sm",
                            bloqueado && "text-muted-foreground"
                          )}>
                            {tutorial.titulo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tutorial.descripcion}
                          </p>
                        </div>
                      </div>
                      {!bloqueado && (
                        <Button
                          variant={completado ? "outline" : "default"}
                          size="sm"
                          className="flex-shrink-0 ml-2"
                          onClick={() => handleIniciarTutorial(tutorial.nombre)}
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          {completado ? 'Repetir' : 'Iniciar'}
                        </Button>
                      )}
                    </div>
                    {bloqueado && tieneCondiciones && (
                      <Accordion type="single" collapsible className="px-3 pb-2">
                        <AccordionItem value="condiciones" className="border-none">
                          <AccordionTrigger className="py-2 text-xs hover:no-underline">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-3 w-3" />
                              <span>Ver condiciones previas</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pl-2 pt-2">
                              {condicionesPrevias.map((condicion: { id: string; descripcion: string; completada: boolean }) => (
                                <div key={condicion.id} className="flex items-start gap-2 text-xs">
                                  <div className={cn(
                                    "mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center",
                                    condicion.completada
                                      ? "bg-emerald-500/15 text-emerald-600"
                                      : "bg-red-500/15 text-red-600"
                                  )}>
                                    {condicion.completada ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <X className="h-3 w-3" />
                                    )}
                                  </div>
                                  <span className={cn(
                                    "flex-1",
                                    condicion.completada ? "text-muted-foreground line-through" : ""
                                  )}>
                                    {condicion.descripcion}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                    {bloqueado && !tieneCondiciones && estado?.condicionBloqueo && (
                      <div className="px-3 pb-3 pt-0">
                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                          <Lock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{estado.condicionBloqueo}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {!ocultarBotonCerrar && (
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={alCerrar}>Cerrar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
