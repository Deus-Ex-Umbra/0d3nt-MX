export interface InfoDiente {
    numero: number;
    nombre: string;
    nombreCorto: string;
    cuadrante: string;
    cuadranteNumero: number;
    tipo: 'incisivo' | 'canino' | 'premolar' | 'molar';
    posicion: 'superior' | 'inferior';
    lado: 'derecho' | 'izquierdo';
}

const NOMBRES_DIENTES: Record<number, { nombre: string; nombreCorto: string; tipo: InfoDiente['tipo'] }> = {
    1: { nombre: 'Incisivo Central', nombreCorto: 'IC', tipo: 'incisivo' },
    2: { nombre: 'Incisivo Lateral', nombreCorto: 'IL', tipo: 'incisivo' },
    3: { nombre: 'Canino', nombreCorto: 'C', tipo: 'canino' },
    4: { nombre: 'Primer Premolar', nombreCorto: '1PM', tipo: 'premolar' },
    5: { nombre: 'Segundo Premolar', nombreCorto: '2PM', tipo: 'premolar' },
    6: { nombre: 'Primer Molar', nombreCorto: '1M', tipo: 'molar' },
    7: { nombre: 'Segundo Molar', nombreCorto: '2M', tipo: 'molar' },
    8: { nombre: 'Tercer Molar (Cordal)', nombreCorto: '3M', tipo: 'molar' },
};

const NOMBRES_DIENTES_TEMPORALES: Record<number, { nombre: string; nombreCorto: string; tipo: InfoDiente['tipo'] }> = {
    1: { nombre: 'Incisivo Central', nombreCorto: 'IC', tipo: 'incisivo' },
    2: { nombre: 'Incisivo Lateral', nombreCorto: 'IL', tipo: 'incisivo' },
    3: { nombre: 'Canino', nombreCorto: 'C', tipo: 'canino' },
    4: { nombre: 'Primer Molar', nombreCorto: '1M', tipo: 'molar' },
    5: { nombre: 'Segundo Molar', nombreCorto: '2M', tipo: 'molar' }
};

const CUADRANTES: Record<number, { nombre: string; posicion: InfoDiente['posicion']; lado: InfoDiente['lado'] }> = {
    1: { nombre: 'Superior Derecho', posicion: 'superior', lado: 'derecho' },
    2: { nombre: 'Superior Izquierdo', posicion: 'superior', lado: 'izquierdo' },
    3: { nombre: 'Inferior Izquierdo', posicion: 'inferior', lado: 'izquierdo' },
    4: { nombre: 'Inferior Derecho', posicion: 'inferior', lado: 'derecho' },
    5: { nombre: 'Superior Derecho Temporal', posicion: 'superior', lado: 'derecho' },
    6: { nombre: 'Superior Izquierdo Temporal', posicion: 'superior', lado: 'izquierdo' },
    7: { nombre: 'Inferior Izquierdo Temporal', posicion: 'inferior', lado: 'izquierdo' },
    8: { nombre: 'Inferior Derecho Temporal', posicion: 'inferior', lado: 'derecho' },
};

export const NOMBRES_CARAS: Record<string, string> = {
    'top': 'Oclusal/Incisal',
    'bottom': 'Cervical',
    'left': 'Mesial',
    'right': 'Distal',
    'center': 'Centro',
    'root-1': 'Raíz Mesial',
    'root-2': 'Raíz Central',
    'root-3': 'Raíz Distal',
};

export const DESCRIPCIONES_CARAS: Record<string, string> = {
    'top': 'Superficie de masticación (superiores) o borde cortante (incisivos)',
    'bottom': 'Superficie hacia la encía',
    'left': 'Superficie hacia el centro de la boca',
    'right': 'Superficie hacia el fondo de la boca',
    'center': 'Centro de la corona',
    'root-1': 'Raíz del lado mesial',
    'root-2': 'Raíz central (cuando hay 3 raíces)',
    'root-3': 'Raíz del lado distal',
};

export function obtenerInfoDiente(numero: number): InfoDiente {
    const cuadranteNum = Math.floor(numero / 10);
    const posicionDiente = numero % 10;
    const esTemporal = cuadranteNum >= 5 && cuadranteNum <= 8;

    const cuadrante = CUADRANTES[cuadranteNum] || { nombre: 'Desconocido', posicion: 'superior', lado: 'derecho' };
    
    const listaNombres = esTemporal ? NOMBRES_DIENTES_TEMPORALES : NOMBRES_DIENTES;
    const diente = listaNombres[posicionDiente] || { nombre: 'Desconocido', nombreCorto: '?', tipo: 'incisivo' as const };
    return {
        numero,
        nombre: `${diente.nombre} ${cuadrante.nombre}`,
        nombreCorto: `${diente.nombreCorto} ${cuadrante.nombre.charAt(0)}${cuadrante.nombre.includes('Izquierdo') ? 'I' : 'D'}`,
        cuadrante: cuadrante.nombre,
        cuadranteNumero: cuadranteNum,
        tipo: diente.tipo,
        posicion: cuadrante.posicion,
        lado: cuadrante.lado,
    };
}

export function obtenerNombreCara(cara: string): string {
    return NOMBRES_CARAS[cara] || cara;
}

export function obtenerDescripcionCara(cara: string): string {
    return DESCRIPCIONES_CARAS[cara] || '';
}

export function formatearPiezaDental(numero: number): string {
    const info = obtenerInfoDiente(numero);
    return `Pieza ${numero} - ${info.nombre}`;
}

export function formatearPiezaCorta(numero: number): string {
    const info = obtenerInfoDiente(numero);
    return `${numero} (${info.nombreCorto})`;
}

export const DIENTES_SUPERIORES = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const DIENTES_INFERIORES = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
export const TODOS_LOS_DIENTES = [...DIENTES_SUPERIORES, ...DIENTES_INFERIORES];
