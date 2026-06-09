import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronDown, Clock } from "lucide-react"

import { cn } from "@/lib/utilidades"
import { Button } from "@/componentes/ui/button"
import { Calendar } from "@/componentes/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/componentes/ui/popover"
import { Input } from "@/componentes/ui/input"

interface DateTimePickerProps {
  valor?: Date
  onChange: (fecha: Date | undefined) => void
  placeholder?: string
  className?: string
  deshabilitarFecha?: boolean
}

export function DateTimePicker({
  valor,
  onChange,
  placeholder = "Selecciona fecha y hora",
  className,
  deshabilitarFecha = false,
}: DateTimePickerProps) {
  const [abierto, setAbierto] = React.useState(false)
  const [hora, setHora] = React.useState<string>(
    valor ? format(valor, "HH:mm") : "09:00"
  )

  const mesInicial = React.useMemo(() => {
    const base = valor ?? new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  }, [valor])

  const [mesVisible, setMesVisible] = React.useState<Date>(mesInicial)

  React.useEffect(() => {
    if (valor) {
      setHora(format(valor, "HH:mm"))
    }
  }, [valor])

  React.useEffect(() => {
    if (deshabilitarFecha) {
      setAbierto(false)
    }
  }, [deshabilitarFecha])

  React.useEffect(() => {
    if (abierto) {
      setMesVisible(mesInicial)
    }
  }, [abierto, mesInicial])

  const manejarCambioFecha = (nueva_fecha: Date | undefined) => {
    if (nueva_fecha) {
      const [horas, minutos] = hora.split(':').map(Number)
      const fecha_actualizada = new Date(nueva_fecha)
      fecha_actualizada.setHours(horas, minutos, 0, 0)
      onChange(fecha_actualizada)
      setMesVisible(new Date(nueva_fecha.getFullYear(), nueva_fecha.getMonth(), 1))
      setAbierto(false)
    }
  }

  const manejarCambioHora = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nueva_hora = e.target.value
    setHora(nueva_hora)

    if (valor && nueva_hora) {
      const [horas, minutos] = nueva_hora.split(':').map(Number)
      const fecha_actualizada = new Date(valor)
      fecha_actualizada.setHours(horas, minutos, 0, 0)
      onChange(fecha_actualizada)
    }
  }

  return (
    <div className="flex gap-2">
      <Popover
        open={deshabilitarFecha ? false : abierto}
        onOpenChange={(valor) => {
          if (deshabilitarFecha) return
          setAbierto(valor)
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            disabled={deshabilitarFecha}
            className={cn(
              "flex-1 justify-between text-left font-normal hover:border-primary/50 transition-all duration-200",
              !valor && "text-muted-foreground",
              className
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {valor ? format(valor, "PPP", { locale: es }) : <span>{placeholder}</span>}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={valor}
            onSelect={manejarCambioFecha}
            initialFocus
            locale={es}
            captionLayout="dropdown"
            fromYear={2000}
            toYear={2100}
            month={mesVisible}
            onMonthChange={setMesVisible}
          />
        </PopoverContent>
      </Popover>

      <div className="min-w-[120px]">
        <div className="relative">
          <Input
            type="time"
            value={hora}
            onChange={manejarCambioHora}
            className="w-full pr-9"
          />
          <Clock
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  )
}
