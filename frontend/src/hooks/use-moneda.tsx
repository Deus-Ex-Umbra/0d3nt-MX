import * as React from "react";
import { useAutenticacion } from "@/contextos/autenticacion-contexto";

export function useMoneda(): {
  moneda: string;
  formatearMoneda: (monto: number | string) => string;
  formatearMonedaJSX: (monto: number | string) => React.ReactNode;
} {
  const { usuario } = useAutenticacion();
  const monedaVisible = (usuario?.moneda || '$').trim();

  const formatearMoneda = (monto: number | string) => {
    const valor = typeof monto === 'string' ? parseFloat(monto) : monto;
    if (typeof valor !== 'number' || isNaN(valor)) return `${monedaVisible} 0.00`;

    return `${monedaVisible} ${valor.toFixed(2)}`;
  };

  const formatearMonedaJSX = (monto: number | string) => {
    const valor = typeof monto === 'string' ? parseFloat(monto) : monto;
    if (typeof valor !== 'number' || isNaN(valor)) {
      return formatearMonedaSimboloJSX('0.00');
    }
    return formatearMonedaSimboloJSX(valor.toFixed(2));
  };

  const formatearMonedaSimboloJSX = (valorFormateado: string) => {
    const match = monedaVisible.match(/^([^\(]+)(\(.+\))$/);
    if (match) {
      return (
        <>
          {match[1]}<span className="text-xs opacity-70">{match[2]}</span> {valorFormateado}
        </>
      );
    }
    return <>{monedaVisible} {valorFormateado}</>;
  };

  return { moneda: monedaVisible, formatearMoneda, formatearMonedaJSX };
}
