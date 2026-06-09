import React, { useState, useEffect, useRef } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/componentes/ui/tooltip";
import { TutorialModal } from './tutorial-modal';
import { useTutorialesPaginaOpcional } from '@/contextos/tutoriales';

interface TituloAccionableProps {
  children: React.ReactNode;
  titulo?: string;
}

export function TituloAccionable({ children, titulo }: TituloAccionableProps) {
  const [clicks, setClicks] = useState(0);
  const [modalLocalAbierto, setModalLocalAbierto] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const context = useTutorialesPaginaOpcional();

  const CLICKS_REQUERIDOS = 3;
  const TIEMPO_LIMITE_MS = 5000;

  useEffect(() => {
    if (clicks > 0 && clicks < CLICKS_REQUERIDOS) {
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          setClicks(0);
          timerRef.current = null;
        }, TIEMPO_LIMITE_MS);
      }
    }

    if (clicks >= CLICKS_REQUERIDOS) {
      if (context) {
        context.abrirModal();
      } else {
        setModalLocalAbierto(true);
      }
      setClicks(0);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [clicks, context]);

  const manejarClick = () => {
    setClicks(prev => prev + 1);
  };

  const clicksRestantes = CLICKS_REQUERIDOS - clicks;

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <Tooltip open={clicks > 0 && clicks < CLICKS_REQUERIDOS}>
          <TooltipTrigger asChild>
            <span
              onClick={manejarClick}
              className="cursor-help select-none transition-colors hover:text-primary/80"
            >
              {children}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Faltan {clicksRestantes} clicks para el tutorial</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {!context && (
        <TutorialModal
          abierto={modalLocalAbierto}
          alCerrar={() => setModalLocalAbierto(false)}
          tema={titulo || (typeof children === 'string' ? children : undefined)}
        />
      )}
    </>
  );
}
