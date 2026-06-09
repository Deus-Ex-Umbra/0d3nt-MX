export interface DienteSVGProps {
    baseSize: number;
    invertido?: boolean;
    modoAsignacion: boolean;
    cursorClassName?: string;
    colores: {
        top: string;
        left: string;
        right: string;
        bottom: string;
        center: string;
        'root-1': string;
        'root-2': string;
        'root-3': string;
    };
    eventos: {
        onClick: (parte: string) => void;
        onEnter: (parte: string) => void;
        onLeave: (parte: string) => void;
    };
}
