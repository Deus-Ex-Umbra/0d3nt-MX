export interface PasoTutorial {
    ruta: string;
    elementoId: string | null;
    titulo: string;
    descripcion: string;
    accionPrevia?: () => void | Promise<void>;
    accionPosterior?: () => void | Promise<void>;
    esperarElemento?: boolean;
    bloquearAtras?: boolean;
}

export interface CondicionPrevia {
    id: string;
    descripcion: string;
    completada: boolean;
}

export interface CondicionBloqueo {
    tipo: 'api_gemini' | 'requiere_datos' | 'requiere_reporte' | 'requiere_plantilla';
    mensaje: string;
    condicionesPrevias?: CondicionPrevia[];
}

export interface TutorialDefinicion {
    nombre: string;
    titulo: string;
    descripcion: string;
    icono?: string;
    pagina: string;
    condicionBloqueo: CondicionBloqueo | null;
    pasos: PasoTutorial[];
}

export interface TutorialEstado {
    nombre: string;
    titulo: string;
    completado: boolean;
    bloqueado: boolean;
    condicionBloqueo?: string;
    iniciado?: boolean;
}

export interface ProgresoPagina {
    pagina: string;
    totalTutoriales: number;
    tutorialesCompletados: number;
    porcentajeCompletado: number;
    tutoriales: TutorialEstado[];
}

export interface ProgresoPaginaResponse {
    pagina: string;
    total_tutoriales: number;
    tutoriales_completados: number;
    porcentaje_completado: number;
    tutoriales: {
        nombre: string;
        titulo: string;
        completado: boolean;
        bloqueado: boolean;
        condicion_bloqueo?: string;
    }[];
}

export function convertirProgresoPagina(response: ProgresoPaginaResponse): ProgresoPagina {
    return {
        pagina: response.pagina,
        totalTutoriales: response.total_tutoriales,
        tutorialesCompletados: response.tutoriales_completados,
        porcentajeCompletado: response.porcentaje_completado,
        tutoriales: response.tutoriales.map(t => ({
            nombre: t.nombre,
            titulo: t.titulo,
            completado: t.completado,
            bloqueado: t.bloqueado,
            condicionBloqueo: t.condicion_bloqueo,
        })),
    };
}
