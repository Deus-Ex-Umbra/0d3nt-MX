import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function obtenerMensajeError(error: any): string {
  if (!error) return 'Ha ocurrido un error desconocido.';

  if (error.code === 'ERR_NETWORK') {
    return 'No se puede conectar con el servidor. Por favor, verifica tu conexión a internet o intenta más tarde.';
  }

  const data = error?.response?.data;
  if (data) {
    const formateado = formatearConflictoHorariosDesdeRespuesta(data);
    if (formateado) return formateado;

    const message = (data as any)?.message;
    if (error.response?.status === 500) {
      const msg = Array.isArray(message) ? message.join(', ') : message;
      return `Error del Servidor: ${msg || 'Ha ocurrido un problema interno.'}`;
    }

    if (message) {
      return Array.isArray(message) ? message.join(', ') : message;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  return 'Ha ocurrido un error al procesar tu solicitud.';
}

const pad = (valor: number) => valor.toString().padStart(2, '0');

function normalizarAFechaLocal(fecha: Date | string): Date {
  if (fecha instanceof Date) {
    return fecha;
  }

  if (typeof fecha === 'string') {
    const texto = fecha.trim();
    const coincideISO = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);

    if (coincideISO) {
      const [, anioStr, mesStr, diaStr, horasStr = '0', minutosStr = '0', segundosStr = '0'] = coincideISO;
      return new Date(
        Number(anioStr),
        Number(mesStr) - 1,
        Number(diaStr),
        Number(horasStr),
        Number(minutosStr),
        Number(segundosStr),
      );
    }
  }

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Fecha no valida');
  }
  return d;
}

function desglosarFechaLocal(fecha: Date | string) {
  const d = normalizarAFechaLocal(fecha);
  return {
    anio: d.getFullYear(),
    mes: pad(d.getMonth() + 1),
    dia: pad(d.getDate()),
    horas: pad(d.getHours()),
    minutos: pad(d.getMinutes()),
    segundos: pad(d.getSeconds()),
  };
}

export function formatearFechaLocal(fecha: Date | string): string {
  const { anio, mes, dia, horas, minutos, segundos } = desglosarFechaLocal(fecha);
  return `${anio}-${mes}-${dia}T${horas}:${minutos}:${segundos}`;
}

export function serializarFechaHoraParaApi(fecha: Date | string): string {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Fecha no valida');
  }
  return d.toISOString();
}

export function formatearFechaSoloFecha(fecha: Date | string): string {
  const { anio, mes, dia } = desglosarFechaLocal(fecha);
  return `${anio}-${mes}-${dia}`;
}

export function formatearFecha(fecha: Date | string): string {
  const { anio, mes, dia, horas, minutos } = desglosarFechaLocal(fecha);
  return `${anio}-${mes}-${dia} ${horas}:${minutos}`;
}

const MESES_CORTOS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatearFechaCortaHora(fecha: Date | string): string {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = MESES_CORTOS_ES[d.getMonth()] ?? '';
  const anio = d.getFullYear();
  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');
  return `${dia} ${mes} ${anio} ${horas}:${minutos}`.trim();
}

function formatearHora(fecha: Date | string): string {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

export function formatearConflictoHorariosDesdeRespuesta(data: any): string | null {
  const detalles = data?.detalles;
  if (!detalles || typeof detalles !== 'object') return null;

  const tipo = String(detalles.tipo || '');

  if (tipo === 'AGENDA_PASADO' && detalles.fecha) {
    const f = formatearFechaCortaHora(detalles.fecha);
    return f
      ? `No se pueden crear citas en el pasado. La fecha seleccionada (${f}) ya pasó.`
      : 'No se pueden crear citas en el pasado.';
  }

  if (tipo === 'AGENDA_SOLAPAMIENTO') {
    const nueva = detalles.nueva;
    const conflictos = Array.isArray(detalles.conflictos) ? detalles.conflictos : [];
    const inicio = nueva?.inicio ? formatearHora(nueva.inicio) : '';
    const fin = nueva?.fin ? formatearHora(nueva.fin) : '';
    const encabezado = (inicio && fin)
      ? `La cita que intentas guardar (${inicio} - ${fin}) se solapa con las siguientes citas:`
      : 'La cita que intentas guardar se solapa con las siguientes citas:';

    const lineas = conflictos
      .map((c: any) => {
        const hi = c?.inicio ? formatearHora(c.inicio) : '';
        const hf = c?.fin ? formatearHora(c.fin) : '';
        const desc = String(c?.descripcion || '').trim();
        const rango = hi && hf ? `${hi} - ${hf}` : (hi || hf || '').trim();
        const texto = rango ? `${rango}: ${desc || 'Cita'}` : (desc || 'Cita');
        return `• ${texto}`;
      })
      .filter(Boolean);

    const sugerencia = detalles?.sugerencia?.despues_de
      ? formatearHora(detalles.sugerencia.despues_de)
      : '';

    const cola = sugerencia
      ? `Por favor, elige un horario disponible (después de las ${sugerencia} o antes del primer conflicto).`
      : 'Por favor, elige un horario disponible.';

    return `${encabezado}\n\n${lineas.join('\n')}\n\n${cola}`.trim();
  }

  if (tipo === 'PLANES_TRATAMIENTO_CONFLICTO') {
    const conflictos = Array.isArray(detalles.conflictos) ? detalles.conflictos : [];
    const lineas = conflictos.map((c: any) => {
      const fecha = c?.fecha ? formatearFechaCortaHora(c.fecha) : '';
      const citas = Array.isArray(c?.citas) ? c.citas : [];
      const citasStr = citas.map((x: any) => String(x?.descripcion || '').trim()).filter(Boolean).join(', ');
      const cuerpo = citasStr ? `conflicto con ${citasStr}` : 'conflicto de horario';
      return fecha ? `• ${fecha}: ${cuerpo}` : `• ${cuerpo}`;
    });

    return `No se puede asignar el plan de tratamiento debido a conflictos de horario:\n\n${lineas.join('\n\n')}`.trim();
  }

  return null;
}