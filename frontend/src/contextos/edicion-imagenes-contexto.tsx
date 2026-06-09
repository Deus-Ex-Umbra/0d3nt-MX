import { createContext, useContext, useState, ReactNode } from 'react';

interface EdicionImagenesContexto {
  paciente_id: number | null;
  setPacienteId: (id: number | null) => void;
  archivo_id: number | null;
  setArchivoId: (id: number | null) => void;
  limpiarEstado: () => void;
}

const EdicionImagenesContext = createContext<EdicionImagenesContexto | undefined>(undefined);

export function ProveedorEdicionImagenes({ children }: { children: ReactNode }) {
  const [paciente_id, setPacienteIdState] = useState<number | null>(() => {
    try {
      const guardado = sessionStorage.getItem('edicion-imagenes-paciente-id');
      return guardado ? parseInt(guardado) : null;
    } catch {
      return null;
    }
  });

  const [archivo_id, setArchivoIdState] = useState<number | null>(() => {
    try {
      const guardado = sessionStorage.getItem('edicion-imagenes-archivo-id');
      return guardado ? parseInt(guardado) : null;
    } catch {
      return null;
    }
  });

  const setPacienteId = (id: number | null) => {
    setPacienteIdState(id);
    if (id === null) {
      try {
        sessionStorage.removeItem('edicion-imagenes-paciente-id');
      } catch {
      }
      setArchivoId(null);
    } else {
      try {
        sessionStorage.setItem('edicion-imagenes-paciente-id', id.toString());
      } catch {
      }
    }
  };

  const setArchivoId = (id: number | null) => {
    setArchivoIdState(id);
    if (id === null) {
      try {
        sessionStorage.removeItem('edicion-imagenes-archivo-id');
      } catch {
      }
    } else {
      try {
        sessionStorage.setItem('edicion-imagenes-archivo-id', id.toString());
      } catch {
      }
    }
  };

  const limpiarEstado = () => {
    setPacienteId(null);
    setArchivoId(null);
  };

  return (
    <EdicionImagenesContext.Provider value={{ paciente_id, setPacienteId, archivo_id, setArchivoId, limpiarEstado }}>
      {children}
    </EdicionImagenesContext.Provider>
  );
}

export function useEdicionImagenes() {
  const contexto = useContext(EdicionImagenesContext);
  if (contexto === undefined) {
    throw new Error('useEdicionImagenes debe usarse dentro de un ProveedorEdicionImagenes');
  }
  return contexto;
}
