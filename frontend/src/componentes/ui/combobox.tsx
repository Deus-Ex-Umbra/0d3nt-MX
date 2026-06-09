import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utilidades"
import { Button } from "@/componentes/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/componentes/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/componentes/ui/popover"

export interface OpcionCombobox {
  valor: string
  etiqueta: string
  componente?: React.ReactNode
}

interface ComboboxProps {
  opciones: OpcionCombobox[]
  valor?: string
  onChange: (valor: string) => void
  placeholder?: string
  textoVacio?: string
  textoAgregar?: string
  onAgregarNuevo?: () => void
  idTrigger?: string
  className?: string
  disabled?: boolean
  maxLengthEtiqueta?: number
}

export function Combobox({
  opciones,
  valor,
  onChange,
  placeholder = "Seleccionar...",
  textoVacio = "No se encontraron resultados",
  textoAgregar,
  onAgregarNuevo,
  idTrigger,
  className,
  disabled = false,
  maxLengthEtiqueta,
}: ComboboxProps) {
  const [abierto, setAbierto] = React.useState(false)

  const acortarEtiqueta = React.useCallback(
    (texto: string) => {
      if (!maxLengthEtiqueta || maxLengthEtiqueta <= 0) return texto
      if (texto.length <= maxLengthEtiqueta) return texto
      return `${texto.slice(0, Math.max(0, maxLengthEtiqueta - 1)).trimEnd()}…`
    },
    [maxLengthEtiqueta]
  )

  const opcion_seleccionada = opciones.find((opcion) => opcion.valor === valor)
  const texto_trigger = opcion_seleccionada ? acortarEtiqueta(opcion_seleccionada.etiqueta) : placeholder
  const contenido_trigger = (!maxLengthEtiqueta && opcion_seleccionada?.componente)
    ? opcion_seleccionada.componente
    : texto_trigger

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button
          id={idTrigger}
          variant="outline"
          role="combobox"
          aria-expanded={abierto}
          className={cn("w-full max-w-full justify-between gap-2 min-w-0 overflow-hidden", className)}
          disabled={disabled}
        >
          <span className="flex-1 min-w-0 max-w-full text-left overflow-hidden">
            <span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {contenido_trigger}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[--radix-popover-trigger-width] max-w-[--radix-popover-content-available-width]"
        align="start"
      >
        <Command>
          <CommandInput placeholder={`Buscar ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>
              {textoVacio}
            </CommandEmpty>
            <CommandGroup>
              {opciones.map((opcion) => (
                <CommandItem
                  key={opcion.valor}
                  value={opcion.etiqueta}
                  className="min-w-0"
                  onSelect={() => {
                    onChange(opcion.valor === valor ? "" : opcion.valor)
                    setAbierto(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      valor === opcion.valor ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1 min-w-0 max-w-full overflow-hidden">
                    {maxLengthEtiqueta ? (
                      <span
                        className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
                        title={opcion.etiqueta}
                      >
                        {acortarEtiqueta(opcion.etiqueta)}
                      </span>
                    ) : opcion.componente ? (
                      opcion.componente
                    ) : (
                      <span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                        {opcion.etiqueta}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
              {textoAgregar && onAgregarNuevo && (
                <CommandItem
                  onSelect={() => {
                    setAbierto(false)
                    onAgregarNuevo()
                  }}
                  className="text-primary font-medium"
                >
                  <ChevronsUpDown className="mr-2 h-4 w-4" />
                  {textoAgregar}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
