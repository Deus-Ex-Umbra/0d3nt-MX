const path = require('path');
const { app, session, ipcMain, shell } = require('electron');
const state = require('./state');
const { 
    normalizarNombreDeDescarga, 
    obtenerNombreDesdeUrl, 
    obtenerRutaDisponible 
} = require('./utils');

function actualizarTituloDescarga(nombre, porcentaje) {
    if (!state.ventanaPrincipal || state.ventanaPrincipal.isDestroyed()) return;
    if (!state.tituloVentanaBase) {
        try {
            state.tituloVentanaBase = state.ventanaPrincipal.getTitle();
        } catch {
            state.tituloVentanaBase = '0d3nt';
        }
    }

    const etiqueta = typeof porcentaje === 'number'
        ? `Descargando: ${nombre} (${porcentaje}%)`
        : `Descargando: ${nombre}`;
    state.ventanaPrincipal.setTitle(`${state.tituloVentanaBase} — ${etiqueta}`);
}

function restaurarTituloVentana() {
    if (!state.ventanaPrincipal || state.ventanaPrincipal.isDestroyed()) return;
    if (state.tituloVentanaBase) {
        state.ventanaPrincipal.setTitle(state.tituloVentanaBase);
    }
}

function registrarManejadorDeDescargas() {
    const sesion = session.defaultSession;
    if (!sesion) return;

    sesion.on('will-download', (_evento, item) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const mime = typeof item.getMimeType === 'function' ? item.getMimeType() : '';
        const urlItem = typeof item.getURL === 'function' ? item.getURL() : '';

        let nombre = normalizarNombreDeDescarga(item.getFilename(), mime);
        const nombreUrl = obtenerNombreDesdeUrl(urlItem);
        const nombreMinuscula = String(nombre).toLowerCase();
        if ((nombreMinuscula.endsWith('.temp') || nombreMinuscula.endsWith('.tmp') || nombreMinuscula === 'download' || nombreMinuscula === 'archivo') && nombreUrl) {
            nombre = normalizarNombreDeDescarga(nombreUrl, mime);
        }

        const carpetaDescargas = app.getPath('downloads');
        const rutaDestino = obtenerRutaDisponible(path.join(carpetaDescargas, nombre));

        item.setSavePath(rutaDestino);
        state.descargasActivas.set(id, { item, rutaDestino, nombre });

        const enviar = (payload) => {
            if (!state.ventanaPrincipal || state.ventanaPrincipal.isDestroyed()) return;
            state.ventanaPrincipal.webContents.send('descarga:actualizacion', payload);
        };

        actualizarTituloDescarga(nombre);

        enviar({
            id,
            nombre,
            rutaDestino,
            estado: 'iniciada',
            recibidosBytes: 0,
            totalBytes: item.getTotalBytes?.() ?? 0,
            progreso: 0
        });

        const actualizarProgreso = () => {
            if (!state.ventanaPrincipal || state.ventanaPrincipal.isDestroyed()) return;
            const total = item.getTotalBytes();
            const recibidos = item.getReceivedBytes();
            if (typeof total === 'number' && total > 0) {
                const progreso = Math.max(0, Math.min(1, recibidos / total));
                const porcentaje = Math.round(progreso * 100);
                state.ventanaPrincipal.setProgressBar(progreso);
                actualizarTituloDescarga(nombre, porcentaje);

                enviar({
                    id,
                    nombre,
                    rutaDestino,
                    estado: 'en_progreso',
                    recibidosBytes: recibidos,
                    totalBytes: total,
                    progreso
                });
            } else {
                state.ventanaPrincipal.setProgressBar(2);
                actualizarTituloDescarga(nombre);

                enviar({
                    id,
                    nombre,
                    rutaDestino,
                    estado: 'en_progreso',
                    recibidosBytes: recibidos,
                    totalBytes: total,
                    progreso: null
                });
            }
        };

        item.on('updated', actualizarProgreso);
        actualizarProgreso();

        item.once('done', (_e, estado) => {
            if (state.ventanaPrincipal && !state.ventanaPrincipal.isDestroyed()) {
                state.ventanaPrincipal.setProgressBar(-1);
            }
            restaurarTituloVentana();

            state.descargasActivas.delete(id);

            if (estado === 'completed') {
                console.log('[Electron] Descarga completada:', rutaDestino);
                enviar({
                    id,
                    nombre,
                    rutaDestino,
                    estado: 'completada',
                    recibidosBytes: item.getReceivedBytes(),
                    totalBytes: item.getTotalBytes(),
                    progreso: 1
                });
            } else {
                console.warn('[Electron] Descarga finalizada con estado:', estado);
                enviar({
                    id,
                    nombre,
                    rutaDestino,
                    estado: estado === 'cancelled' ? 'cancelada' : 'fallida',
                    recibidosBytes: item.getReceivedBytes(),
                    totalBytes: item.getTotalBytes(),
                    progreso: null
                });
            }
        });
    });
}

function registrarIpcDescargas() {
    ipcMain.on('descarga:cancelar', (_event, { id }) => {
        const registro = state.descargasActivas.get(id);
        if (!registro) return;
        try {
            registro.item.cancel();
        } catch (error) {
            console.error('[Electron] Error al cancelar descarga:', error);
        }
    });

    ipcMain.on('descarga:mostrarEnCarpeta', (_event, { rutaDestino }) => {
        if (!rutaDestino || typeof rutaDestino !== 'string') return;
        try {
            shell.showItemInFolder(rutaDestino);
        } catch (error) {
            console.error('[Electron] Error al mostrar en carpeta:', error);
        }
    });
}

module.exports = {
    actualizarTituloDescarga,
    restaurarTituloVentana,
    registrarManejadorDeDescargas,
    registrarIpcDescargas
};
