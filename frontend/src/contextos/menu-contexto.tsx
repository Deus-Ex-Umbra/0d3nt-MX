import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MenuContexto {
  colapsado: boolean;
  setColapsado: (colapsado: boolean) => void;
}

const MenuContext = createContext<MenuContexto | undefined>(undefined);

export function ProveedorMenu({ children }: { children: ReactNode }) {
  const [colapsado, setColapsadoState] = useState(() => {
    try {
      const guardado = sessionStorage.getItem('menu-colapsado');
      if (guardado === null) return true;
      return guardado === 'true';
    } catch {
      return true;
    }
  });

  const setColapsado = (valor: boolean) => {
    setColapsadoState(valor);
    try {
      sessionStorage.setItem('menu-colapsado', valor.toString());
    } catch {
    }
  };

  useEffect(() => {
    try {
      sessionStorage.setItem('menu-colapsado', colapsado.toString());
    } catch {
    }
  }, [colapsado]);

  return (
    <MenuContext.Provider value={{ colapsado, setColapsado }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const contexto = useContext(MenuContext);
  if (contexto === undefined) {
    throw new Error('useMenu debe usarse dentro de un ProveedorMenu');
  }
  return contexto;
}

