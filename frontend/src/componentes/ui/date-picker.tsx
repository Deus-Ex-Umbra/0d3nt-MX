import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utilidades"
import { Button } from "@/componentes/ui/button"
import { Calendar } from "@/componentes/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/componentes/ui/popover"
import * as React from "react"

interface DatePickerProps {
  valor?: Date
  onChange: (fecha: Date | undefined) => void
  placeholder?: string
  className?: string
  deshabilitarAnteriores?: boolean
  deshabilitarPosteriores?: boolean
  fechaMinima?: Date
  fechaMaxima?: Date
  fromYear?: number
  toYear?: number
}

export function DatePicker({
  valor,
  onChange,
  placeholder = "Selecciona una fecha",
  className,
  deshabilitarAnteriores = false,
  deshabilitarPosteriores = false,
  fechaMinima,
  fechaMaxima,
  fromYear = 2000,
  toYear = 2100,
}: DatePickerProps) {
  const fecha_valida = valor && valor instanceof Date && !isNaN(valor.getTime()) ? valor : undefined;

  const fromYearSeguro = Math.min(2100, Math.max(2000, fromYear))
  const toYearSeguro = Math.max(fromYearSeguro, Math.min(2100, Math.max(2000, toYear)))

  const [abierto, setAbierto] = React.useState(false)

  const mesInicial = React.useMemo(() => {
    const base = fecha_valida ?? new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  }, [fecha_valida])

  const [mesVisible, setMesVisible] = React.useState<Date>(mesInicial)

  React.useEffect(() => {
    if (abierto) {
      setMesVisible(mesInicial)
    }
  }, [abierto, mesInicial])

  const esDisabled = (fecha: Date) => {
    if (deshabilitarAnteriores && fecha < new Date()) {
      return true;
    }
    if (deshabilitarPosteriores && fecha > new Date()) {
      return true;
    }
    if (fechaMinima && fecha < fechaMinima) {
      return true;
    }
    if (fechaMaxima && fecha > fechaMaxima) {
      return true;
    }
    return false;
  };

  const manejarSeleccion = (fecha: Date | undefined) => {
    if (fecha) {
      setMesVisible(new Date(fecha.getFullYear(), fecha.getMonth(), 1))
    }
    onChange(fecha)
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-between text-left font-normal hover:border-primary/50 transition-all duration-200",
            !fecha_valida && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {fecha_valida ? format(fecha_valida, "PPP", { locale: es }) : <span>{placeholder}</span>}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={fecha_valida}
          onSelect={manejarSeleccion}
          initialFocus
          locale={es}
          captionLayout="dropdown"
          disabled={esDisabled}
          fromYear={fromYearSeguro}
          toYear={toYearSeguro}
          month={mesVisible}
          onMonthChange={setMesVisible}
        />
      </PopoverContent>
    </Popover>
  )
}
