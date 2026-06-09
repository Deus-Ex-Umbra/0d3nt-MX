import { useTutorialesPagina } from '@/contextos/tutoriales';
import { TutorialModal } from './tutorial-modal';

interface TutorialModalWrapperProps {
    tema?: string;
    ocultarBotonCerrar?: boolean;
    bloquearCierreFuera?: boolean;
}

export function TutorialModalWrapper({ tema, ocultarBotonCerrar, bloquearCierreFuera }: TutorialModalWrapperProps) {
    const { modalAbierto, cerrarModal } = useTutorialesPagina();

    return (
        <TutorialModal
            abierto={modalAbierto}
            alCerrar={cerrarModal}
            tema={tema}
            ocultarBotonCerrar={ocultarBotonCerrar}
            bloquearCierreFuera={bloquearCierreFuera}
        />
    );
}
