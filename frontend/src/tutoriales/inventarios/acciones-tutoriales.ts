import { IDS_ELEMENTOS_INVENTARIOS } from './constantes';

const esperar = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const esperarElemento = (selector: string | (() => string), timeout = 6000): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const sel = typeof selector === 'function' ? selector() : selector;

    const buscar = () => {
      const porId = document.getElementById(sel) as HTMLElement | null;
      if (porId) return porId;
      const porSelector = document.querySelector(sel) as HTMLElement | null;
      if (porSelector) return porSelector;
      const porHash = document.querySelector(`#${sel}`) as HTMLElement | null;
      if (porHash) return porHash;
      return null;
    };

    const existente = buscar();
    if (existente) {
      resolve(existente);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = buscar();
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento ${sel} no encontrado tras ${timeout}ms`));
    }, timeout);
  });
};

export const clickElemento = async (selector: string | (() => string), esperaMs = 450): Promise<void> => {
  try {
    const el = await esperarElemento(selector);

    const crearEvento = (type: string) => {
      const opts = { bubbles: true, cancelable: true, view: window };
      try {
        const w = window as any;
        if (type.startsWith('pointer') && typeof w.PointerEvent === 'function') {
          return new w.PointerEvent(type, opts);
        }
      } catch {
      }
      return new MouseEvent(type, opts);
    };

    try {
      el.dispatchEvent(crearEvento('pointerdown'));
      el.dispatchEvent(crearEvento('mousedown'));
      el.dispatchEvent(crearEvento('pointerup'));
      el.dispatchEvent(crearEvento('mouseup'));
    } catch {
    }

    el.click();
    await esperar(esperaMs);
  } catch (e) {
    console.warn('[Tutorial Inventarios] No se pudo hacer click:', selector, e);
  }
};

export const scrollAElemento = async (selector: string | (() => string)): Promise<void> => {
  try {
    const el = await esperarElemento(selector);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await esperar(350);
  } catch (e) {
    console.warn('[Tutorial Inventarios] No se pudo hacer scroll:', selector, e);
  }
};

const selectorPrimerInventario = () => '[id^="inventario-card-"]';

const limpiarIdSiExiste = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.removeAttribute('id');
};

const buscarBotonDentroDe = (contenedor: HTMLElement | null, texto: string): HTMLButtonElement | null => {
  if (!contenedor) return null;
  const botones = Array.from(contenedor.querySelectorAll('button')) as HTMLButtonElement[];
  const textoObjetivo = texto.trim().toLowerCase();

  const obtenerTextoBoton = (b: HTMLButtonElement): string => {
    const texto = (b.textContent || '').trim();
    const title = (b.getAttribute('title') || '').trim();
    const aria = (b.getAttribute('aria-label') || '').trim();
    return `${texto} ${title} ${aria}`.trim();
  };

  const candidatos = botones.filter(b => obtenerTextoBoton(b).toLowerCase().includes(textoObjetivo));
  const habilitados = candidatos.filter(b => !b.disabled && b.getAttribute('aria-disabled') !== 'true');
  const visibles = (list: HTMLButtonElement[]) => list.filter(b => (b as any).offsetParent !== null);

  return visibles(habilitados)[0] || habilitados[0] || visibles(candidatos)[0] || candidatos[0] || null;
};

const buscarBotonConReintentos = async (
  contenedorId: string,
  texto: string,
  timeoutMs = 4500,
  intervaloMs = 250
): Promise<HTMLButtonElement | null> => {
  try {
    await esperarElemento(contenedorId, Math.min(timeoutMs, 3000));
  } catch {
  }

  const inicio = Date.now();
  while (Date.now() - inicio < timeoutMs) {
    const contenedor = document.getElementById(contenedorId);
    const btn = buscarBotonDentroDe(contenedor, texto);
    if (btn) return btn;
    await esperar(intervaloMs);
  }
  return null;
};

export const accionesInventarios = {
  asegurarListaInventarios: async () => {
    const enDetalle = document.getElementById(IDS_ELEMENTOS_INVENTARIOS.TAB_PRODUCTOS);
    if (!enDetalle) return;

    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_VOLVER_LISTA, 800);
  },

  asegurarDetalleInventario: async () => {
    const yaEnDetalle = document.getElementById(IDS_ELEMENTOS_INVENTARIOS.TAB_PRODUCTOS);
    if (yaEnDetalle) return;

    await clickElemento(selectorPrimerInventario(), 700);
  },

  abrirDialogoNuevoInventario: async () => {
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_NUEVO_INVENTARIO, 600);
    try {
      await esperarElemento(IDS_ELEMENTOS_INVENTARIOS.DIALOGO_INVENTARIO, 4000);
    } catch {
    }
  },

  abrirDialogoNuevoProducto: async () => {
    await accionesInventarios.asegurarDetalleInventario();
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_NUEVO_PRODUCTO, 650);
    try {
      await esperarElemento(IDS_ELEMENTOS_INVENTARIOS.DIALOGO_PRODUCTO, 4000);
    } catch {
    }
  },

  asegurarTipoMaterial: async () => {
    try {
      const sw = await esperarElemento('tipo_producto', 2500);
      const checked = sw.getAttribute('aria-checked');
      if (checked === 'true') {
        sw.click();
        await esperar(450);
      }
    } catch {
    }
  },

  asegurarTipoActivoFijo: async () => {
    try {
      const sw = await esperarElemento('tipo_producto', 2500);
      const checked = sw.getAttribute('aria-checked');
      if (checked !== 'true') {
        sw.click();
        await esperar(450);
      }
    } catch {
    }
  },

  cambiarTabProductos: async () => {
    await accionesInventarios.asegurarDetalleInventario();
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.TAB_PRODUCTOS, 500);
  },

  cambiarSubtabConsumibles: async () => {
    await accionesInventarios.cambiarTabProductos();
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.SUBTAB_CONSUMIBLES, 500);
  },

  cambiarSubtabActivosFijos: async () => {
    await accionesInventarios.cambiarTabProductos();
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.SUBTAB_ACTIVOS_FIJOS, 500);
  },

  prepararAnclaRegistrarEntradaMaterial: async () => {
    limpiarIdSiExiste(IDS_ELEMENTOS_INVENTARIOS.BTN_REGISTRAR_ENTRADA_MATERIAL);
    await accionesInventarios.cambiarSubtabConsumibles();
    const btn = await buscarBotonConReintentos(IDS_ELEMENTOS_INVENTARIOS.CONTENIDO_PRODUCTOS, 'Registrar Entrada');
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await esperar(220);
      btn.id = IDS_ELEMENTOS_INVENTARIOS.BTN_REGISTRAR_ENTRADA_MATERIAL;
    }
  },

  abrirDialogoRegistrarEntradaMaterial: async () => {
    await accionesInventarios.prepararAnclaRegistrarEntradaMaterial();
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_REGISTRAR_ENTRADA_MATERIAL, 650);
    try {
      await esperarElemento(IDS_ELEMENTOS_INVENTARIOS.DIALOGO_REGISTRAR_MATERIAL, 4000);
    } catch {
    }
  },

  clickRegistrarEntradaMaterial: async () => {
    await scrollAElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_REGISTRAR_ENTRADA_MATERIAL);
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_REGISTRAR_ENTRADA_MATERIAL, 650);
    try {
      await esperarElemento(IDS_ELEMENTOS_INVENTARIOS.DIALOGO_REGISTRAR_MATERIAL, 4000);
    } catch {
    }
  },

  prepararAnclaRegistrarActivo: async () => {
    limpiarIdSiExiste(IDS_ELEMENTOS_INVENTARIOS.BTN_REGISTRAR_ACTIVO);
    await accionesInventarios.cambiarSubtabActivosFijos();
    const btn = await buscarBotonConReintentos(IDS_ELEMENTOS_INVENTARIOS.CONTENIDO_PRODUCTOS, 'Registrar Activo');
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await esperar(220);
      btn.id = IDS_ELEMENTOS_INVENTARIOS.BTN_REGISTRAR_ACTIVO;
    }
  },

  prepararAnclaAjustarStock: async () => {
    limpiarIdSiExiste(IDS_ELEMENTOS_INVENTARIOS.BTN_AJUSTAR_STOCK);
    await accionesInventarios.cambiarSubtabConsumibles();
    const btn = await buscarBotonConReintentos(IDS_ELEMENTOS_INVENTARIOS.CONTENIDO_PRODUCTOS, 'Ajustar Stock');
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await esperar(220);
      btn.id = IDS_ELEMENTOS_INVENTARIOS.BTN_AJUSTAR_STOCK;
    }
  },

  abrirDialogoAjusteStock: async () => {
    await accionesInventarios.prepararAnclaAjustarStock();
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_AJUSTAR_STOCK, 650);
    try {
      await esperarElemento(IDS_ELEMENTOS_INVENTARIOS.DIALOGO_AJUSTE_STOCK, 4000);
    } catch {
    }
  },

  clickAjustarStock: async () => {
    await scrollAElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_AJUSTAR_STOCK);
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_AJUSTAR_STOCK, 650);
    try {
      await esperarElemento(IDS_ELEMENTOS_INVENTARIOS.DIALOGO_AJUSTE_STOCK, 4000);
    } catch {
    }
  },

  prepararAnclaVenderActivo: async () => {
    limpiarIdSiExiste(IDS_ELEMENTOS_INVENTARIOS.BTN_VENDER_ACTIVO);
    await accionesInventarios.cambiarSubtabActivosFijos();
    const btn = await buscarBotonConReintentos(IDS_ELEMENTOS_INVENTARIOS.CONTENIDO_PRODUCTOS, 'Vender');
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await esperar(220);
      btn.id = IDS_ELEMENTOS_INVENTARIOS.BTN_VENDER_ACTIVO;
    }
  },

  abrirDialogoVenderActivo: async () => {
    await accionesInventarios.prepararAnclaVenderActivo();
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_VENDER_ACTIVO, 650);
    try {
      await esperarElemento(IDS_ELEMENTOS_INVENTARIOS.DIALOGO_VENDER_ACTIVO, 4000);
    } catch {
    }
  },

  clickVenderActivo: async () => {
    await scrollAElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_VENDER_ACTIVO);
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_VENDER_ACTIVO, 650);
    try {
      await esperarElemento(IDS_ELEMENTOS_INVENTARIOS.DIALOGO_VENDER_ACTIVO, 4000);
    } catch {
    }
  },

  abrirDialogoRegistrarActivo: async () => {
    await accionesInventarios.prepararAnclaRegistrarActivo();
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_REGISTRAR_ACTIVO, 650);
    try {
      await esperarElemento(IDS_ELEMENTOS_INVENTARIOS.DIALOGO_REGISTRAR_ACTIVO, 4000);
    } catch {
    }
  },

  clickRegistrarActivo: async () => {
    await scrollAElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_REGISTRAR_ACTIVO);
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.BTN_REGISTRAR_ACTIVO, 650);
    try {
      await esperarElemento(IDS_ELEMENTOS_INVENTARIOS.DIALOGO_REGISTRAR_ACTIVO, 4000);
    } catch {
    }
  },

  cambiarTabKardex: async () => {
    await accionesInventarios.asegurarDetalleInventario();
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.TAB_KARDEX, 800);
  },

  cambiarTabAuditoria: async () => {
    await accionesInventarios.asegurarDetalleInventario();
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.TAB_AUDITORIA, 800);
  },

  cambiarTabBitacora: async () => {
    await accionesInventarios.asegurarDetalleInventario();
    await clickElemento(IDS_ELEMENTOS_INVENTARIOS.TAB_BITACORA, 800);
  },

  scrollATituloKardex: async () => {
    await scrollAElemento(IDS_ELEMENTOS_INVENTARIOS.TITULO_KARDEX);
  },

  scrollATituloAuditoria: async () => {
    await scrollAElemento(IDS_ELEMENTOS_INVENTARIOS.TITULO_AUDITORIA);
  },

  scrollATituloBitacora: async () => {
    await scrollAElemento(IDS_ELEMENTOS_INVENTARIOS.TITULO_BITACORA);
  },
};
