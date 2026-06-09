import React from "react";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { useClinica } from "@/contextos/clinica-contexto";
import { cn } from "@/lib/utilidades";

interface InputMonedaProps {
  valorLocal: string;
  setValorLocal?: (v: string) => void;
  valorUSD: string;
  setValorUSD?: (v: string) => void;
  onMontoChange?: (local: string, usd: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  label?: string;
  footerRight?: React.ReactNode;
}

export function InputMoneda({
  valorLocal,
  setValorLocal,
  valorUSD,
  setValorUSD,
  onMontoChange,
  className,
  inputClassName,
  placeholder,
  label,
  footerRight
}: InputMonedaProps) {
  const { config_clinica } = useClinica();
  const { trabajar_con, cambio_dolar } = config_clinica;
  const moneda_principal = config_clinica.moneda_principal || 'Local';
  const tasa = cambio_dolar || 1;

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    let nuevoUSD = '';
    if (val.trim().startsWith('-')) {
      const cero = '0.00';
      if (onMontoChange) onMontoChange(cero, cero);
      else {
        setValorLocal?.(cero);
        setValorUSD?.(cero);
      }
      return;
    }
    
    if (val !== '') {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        if (num < 0) {
          const cero = '0.00';
          if (onMontoChange) onMontoChange(cero, cero);
          else {
            setValorLocal?.(cero);
            setValorUSD?.(cero);
          }
          return;
        }
        nuevoUSD = (num / tasa).toFixed(2);
      }
    }

    if (onMontoChange) {
      onMontoChange(val, nuevoUSD);
    } else {
      setValorLocal?.(val);
      setValorUSD?.(nuevoUSD);
    }
  };

  const handleUSDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    let nuevoLocal = '';
    if (val.trim().startsWith('-')) {
      const cero = '0.00';
      if (onMontoChange) onMontoChange(cero, cero);
      else {
        setValorUSD?.(cero);
        setValorLocal?.(cero);
      }
      return;
    }

    if (val !== '') {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        if (num < 0) {
          const cero = '0.00';
          if (onMontoChange) onMontoChange(cero, cero);
          else {
            setValorUSD?.(cero);
            setValorLocal?.(cero);
          }
          return;
        }
        nuevoLocal = (num * tasa).toFixed(2);
      }
    }

    if (onMontoChange) {
      onMontoChange(nuevoLocal, val);
    } else {
      setValorUSD?.(val);
      setValorLocal?.(nuevoLocal);
    }
  };

  const esLocal = trabajar_con !== 'usd';

  const setMontos = (local: string, usd: string) => {
    if (onMontoChange) {
      onMontoChange(local, usd);
    } else {
      setValorLocal?.(local);
      setValorUSD?.(usd);
    }
  };

  const handleBlur = () => {
    const montoActual = esLocal ? valorLocal : valorUSD;
    if (montoActual !== '') return;

    const cero = '0.00';
    setMontos(cero, cero);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2 items-start mt-4">
        <div className="flex-1 space-y-1 relative">
          <Label className="text-[10px] uppercase text-muted-foreground absolute -top-5 left-0">
            {esLocal ? moneda_principal : 'USD'}
          </Label>
          <Input
            value={esLocal ? valorLocal : valorUSD}
            onChange={esLocal ? handleLocalChange : handleUSDChange}
            onBlur={handleBlur}
            placeholder={placeholder || "0.00"}
            type="number"
            step="0.01"
            min={0}
            className={cn("border-primary/50 focus-visible:ring-primary", inputClassName)}
          />
        </div>

        <div className="flex-1 space-y-1 relative">
          <Label className="text-[10px] uppercase text-muted-foreground absolute -top-5 left-0">
            {esLocal ? 'USD' : moneda_principal}
          </Label>
          <Input
            value={esLocal ? valorUSD : valorLocal}
            readOnly
            placeholder={placeholder || "0.00"}
            type="number"
            step="0.01"
            className="bg-muted text-muted-foreground opacity-70 cursor-not-allowed focus-visible:ring-0"
            tabIndex={-1}
          />
        </div>
      </div>
      {footerRight ? (
        <div className="w-full flex items-center justify-between text-muted-foreground">
          <span className="text-[11px]">{footerRight}</span>
          <span className="text-[10px] text-right">
            1 USD ≈ {tasa} {moneda_principal}
          </span>
        </div>
      ) : (
        <div className="text-[10px] text-muted-foreground text-right w-full">
          1 USD ≈ {tasa} {moneda_principal}
        </div>
      )}
    </div>
  );
}

export default InputMoneda;
