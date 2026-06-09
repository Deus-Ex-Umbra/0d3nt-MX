export const limpiarAccionesPendientes = (): void => {
	console.debug('[Tutorial Configuración] Limpiando contexto de acciones');
};

type TabConfiguracion = 'perfil' | 'clinica' | 'apariencia' | 'catalogos';

const emitirNavegacionConfiguracion = (detalle: { tab?: TabConfiguracion }) => {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new CustomEvent('tutorial:navegar-configuracion', { detail: detalle }));
};

export const esperarElemento = (selector: string, timeout = 5000): Promise<HTMLElement> => {
	return new Promise((resolve, reject) => {
		const elemento = document.querySelector(selector) as HTMLElement;
		if (elemento) {
			resolve(elemento);
			return;
		}

		const observer = new MutationObserver(() => {
			const el = document.querySelector(selector) as HTMLElement;
			if (el) {
				observer.disconnect();
				resolve(el);
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		setTimeout(() => {
			observer.disconnect();
			reject(new Error(`Elemento ${selector} no encontrado después de ${timeout}ms`));
		}, timeout);
	});
};

const esScrollContenedor = (el: HTMLElement): boolean => {
	const estilo = window.getComputedStyle(el);
	const overflowY = estilo.overflowY;
	const overflowX = estilo.overflowX;
	const overflow = estilo.overflow;

	const puedeScrollY = ['auto', 'scroll', 'overlay'].includes(overflowY);
	const puedeScrollX = ['auto', 'scroll', 'overlay'].includes(overflowX);
	const puedeScroll = ['auto', 'scroll', 'overlay'].includes(overflow);

	const hayOverflowY = el.scrollHeight > el.clientHeight + 4;
	const hayOverflowX = el.scrollWidth > el.clientWidth + 4;

	return (puedeScrollY && hayOverflowY) || (puedeScrollX && hayOverflowX) || (puedeScroll && (hayOverflowY || hayOverflowX));
};

const encontrarScrollPadre = (el: HTMLElement): HTMLElement | null => {
	let actual: HTMLElement | null = el.parentElement;
	while (actual && actual !== document.body) {
		if (esScrollContenedor(actual)) return actual;
		actual = actual.parentElement;
	}
	return null;
};

const scrollEnContenedor = async (contenedor: HTMLElement, elemento: HTMLElement): Promise<void> => {
	const rectContenedor = contenedor.getBoundingClientRect();
	const rectElemento = elemento.getBoundingClientRect();

	const objetivo = rectElemento.top - rectContenedor.top + contenedor.scrollTop - contenedor.clientHeight / 2 + rectElemento.height / 2;

	contenedor.scrollTo({
		top: Math.max(0, objetivo),
		behavior: 'smooth',
	});
	await new Promise(resolve => setTimeout(resolve, 350));
	contenedor.scrollTo({
		top: Math.max(0, objetivo),
		behavior: 'auto',
	});
	await new Promise(resolve => setTimeout(resolve, 50));
};

export const scrollAElemento = async (selector: string): Promise<void> => {
	try {
		const elemento = await esperarElemento(selector);
		elemento.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
		await new Promise(resolve => setTimeout(resolve, 150));
		const contenedor = encontrarScrollPadre(elemento);
		if (contenedor) {
			await scrollEnContenedor(contenedor, elemento);
		} else {
			await new Promise(resolve => setTimeout(resolve, 250));
		}
	} catch (error) {
		console.warn(`No se pudo hacer scroll a ${selector}:`, error);
	}
};

export const clickElemento = async (selector: string, esperaMilisegundos = 300): Promise<void> => {
	try {
		const elemento = await esperarElemento(selector);
		const eventos: Array<[string, MouseEventInit | PointerEventInit]> = [
			['pointerdown', { bubbles: true } as PointerEventInit],
			['mousedown', { bubbles: true } as MouseEventInit],
			['pointerup', { bubbles: true } as PointerEventInit],
			['mouseup', { bubbles: true } as MouseEventInit],
			['click', { bubbles: true } as MouseEventInit],
		];

		try {
			(elemento as HTMLElement).focus?.();
		} catch {
		}

		for (const [tipo, init] of eventos) {
			try {
				if (tipo.startsWith('pointer')) {
					elemento.dispatchEvent(new PointerEvent(tipo, init as PointerEventInit));
				} else {
					elemento.dispatchEvent(new MouseEvent(tipo, init as MouseEventInit));
				}
			} catch {
			}
		}

		elemento.click();
		await new Promise(resolve => setTimeout(resolve, esperaMilisegundos));
	} catch (error) {
		console.warn(`No se pudo hacer click en ${selector}:`, error);
	}
};

const clickTab = async (tabId: string): Promise<void> => {
	await clickElemento(`#${tabId}`, 350);
};

export const irATabPerfil = async (): Promise<void> => {
	emitirNavegacionConfiguracion({ tab: 'perfil' });
	await clickTab('tab-configuracion-perfil');
};

export const irATabClinica = async (): Promise<void> => {
	emitirNavegacionConfiguracion({ tab: 'clinica' });
	await clickTab('tab-configuracion-clinica');
};

export const irATabApariencia = async (): Promise<void> => {
	emitirNavegacionConfiguracion({ tab: 'apariencia' });
	await clickTab('tab-configuracion-apariencia');
};

export const irATabCatalogos = async (): Promise<void> => {
	emitirNavegacionConfiguracion({ tab: 'catalogos' });
	await clickTab('tab-configuracion-catalogos');
};

const idBotonTema = (valorTema: string): string => {
	return `config-apariencia-tema-${valorTema}`;
};

export const seleccionarTemaApariencia = async (valorTema: string): Promise<void> => {
	await irATabApariencia();
	await clickElemento(`#${idBotonTema(valorTema)}`, 350);
};

export const abrirEditorTemaPersonalizado = async (): Promise<void> => {
	await seleccionarTemaApariencia('personalizado');
	await scrollAElemento('#config-apariencia-panel-personalizado');
	await clickElemento('#config-apariencia-btn-personalizar-colores', 350);
	await esperarElemento('#config-apariencia-dialog-editor-personalizado');
};

export const cerrarEditorTemaPersonalizado = async (): Promise<void> => {
	await clickElemento('#config-apariencia-btn-cancelar-editor', 250);
};

export const asegurarSeccionExpandida = async (toggleId: string, contenidoId: string): Promise<void> => {
	await scrollAElemento(`#${toggleId}`);
	const contenido = document.getElementById(contenidoId);
	if (!contenido) {
		await clickElemento(`#${toggleId}`, 350);
		try {
			await esperarElemento(`#${contenidoId}`, 3000);
		} catch {
		}
	}
};

export const abrirDialogoCrearCatalogo = async (idBase: string): Promise<void> => {
	await irATabCatalogos();
	await asegurarSeccionExpandida(`${idBase}-toggle`, `${idBase}-contenido`);
	await clickElemento(`#${idBase}-btn-agregar`, 350);
	try {
		await esperarElemento(`#${idBase}-dialog-crear`, 3000);
	} catch {
	}
};

export const cerrarDialogoCrearCatalogo = async (idBase: string): Promise<void> => {
	await clickElemento(`#${idBase}-btn-cancelar-crear`, 250);
};

export const abrirDialogoCrearTamanoHoja = async (): Promise<void> => {
	await irATabCatalogos();
	await asegurarSeccionExpandida('config-catalogos-tamanos-hoja-toggle', 'config-catalogos-tamanos-hoja-contenido');
	await clickElemento('#config-catalogos-tamanos-hoja-btn-agregar', 350);
	try {
		await esperarElemento('#config-catalogos-tamanos-hoja-dialog-crear', 3000);
	} catch {
	}
};

export const cerrarDialogoCrearTamanoHoja = async (): Promise<void> => {
	await clickElemento('#config-catalogos-tamanos-hoja-btn-cancelar-crear', 250);
};

export const abrirEditorSimbologia = async (): Promise<void> => {
	await irATabCatalogos();
	await asegurarSeccionExpandida('config-catalogos-simbologia-toggle', 'config-catalogos-simbologia-contenido');
	await clickElemento('#config-catalogos-simbologia-btn-agregar', 350);
	try {
		await esperarElemento('#config-catalogos-simbologia-editor-dialog', 4000);
	} catch {
	}
};

export const scrollRelativoAElemento = async (selectorReferencia: string, deltaY: number): Promise<void> => {
	try {
		const elemento = await esperarElemento(selectorReferencia);
		const contenedor = encontrarScrollPadre(elemento);
		if (!contenedor) return;
		contenedor.scrollTo({ top: Math.max(0, contenedor.scrollTop + deltaY), behavior: 'smooth' });
		await new Promise(resolve => setTimeout(resolve, 220));
		contenedor.scrollTo({ top: Math.max(0, contenedor.scrollTop), behavior: 'auto' });
		await new Promise(resolve => setTimeout(resolve, 50));
	} catch (error) {
		console.warn(`No se pudo hacer scroll relativo desde ${selectorReferencia}:`, error);
	}
};

export const abrirTabDescripcionEditorSimbologia = async (): Promise<void> => {
	await clickElemento('#config-catalogos-simbologia-editor-tab-descripcion', 350);
};

export const asegurarCategoriaEditorSimbologia = async (categoria: 'TRATAMIENTO' | 'HALLAZGO'): Promise<void> => {
	const selector = '#config-catalogos-simbologia-editor-btn-categoria';
	await scrollAElemento(selector);

	let btn: Element | null = null;
	try {
		btn = await esperarElemento(selector, 4000);
	} catch {
		return;
	}

	const texto = (btn.textContent || '').toLowerCase();
	const esTratamiento = texto.includes('tratamiento');
	const esHallazgo = texto.includes('hallazgo') || texto.includes('condición') || texto.includes('condicion');

	const quieroTratamiento = categoria === 'TRATAMIENTO';
	const yaEsta = (quieroTratamiento && esTratamiento) || (!quieroTratamiento && esHallazgo);
	if (yaEsta) return;

	await clickElemento(selector, 350);
	await new Promise(resolve => setTimeout(resolve, 150));
};

export const cambiarCategoriaEditorSimbologia = async (categoria: 'TRATAMIENTO' | 'HALLAZGO'): Promise<void> => {
	const selector = '#config-catalogos-simbologia-editor-btn-categoria';
	await scrollAElemento(selector);

	for (let i = 0; i < 3; i++) {
		let btn: Element | null = null;
		try {
			btn = await esperarElemento(selector, 2000);
		} catch {
			return;
		}

		const texto = (btn.textContent || '').toLowerCase();
		const esTratamiento = texto.includes('tratamiento');
		const esHallazgo = texto.includes('hallazgo') || texto.includes('condición') || texto.includes('condicion');
		const quieroTratamiento = categoria === 'TRATAMIENTO';
		const yaEsta = (quieroTratamiento && esTratamiento) || (!quieroTratamiento && esHallazgo);
		if (yaEsta) return;
		await clickElemento(selector, 350);
		await new Promise(resolve => setTimeout(resolve, 120));
	}
};

