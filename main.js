console.log('main.js loaded'); 
const { app } = require('electron');
const path = require('path');

try {
    require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
} catch {
}

app.setName('0d3nt');

// Load state, modules, and initialize
const state = require('./src-main/state');
const { registrarManejadoresDeSalida } = require('./src-main/lifecycle');
const { registrarManejadorDeDescargas, registrarIpcDescargas } = require('./src-main/downloads');
const { registrarIpcLicencia } = require('./src-main/license');
const { registrarIpcUI } = require('./src-main/ipc');
const { registrarIpcBootstrap } = require('./src-main/bootstrap');
const { crearVentana, iniciarFrontendDev, arrancarServiciosEnBackground } = require('./src-main/lifecycle');
const { setBootstrap, obtenerRutaLogBootstrap } = require('./src-main/bootstrap-state');
const { detenerPostgresLocal } = require('./src-main/postgres');

app.whenReady().then(async () => {
    try {
        state.rutaLogBootstrap = obtenerRutaLogBootstrap();
        const { logBootstrap } = require('./src-main/bootstrap-state');
        logBootstrap('Inicio de app.whenReady');
        
        registrarManejadoresDeSalida();
        registrarManejadorDeDescargas();
        registrarIpcDescargas();
        registrarIpcLicencia();
        registrarIpcUI();
        registrarIpcBootstrap();

        // Cargar UI inmediatamente: el frontend renderiza el bootstrap.
        await crearVentana({ skipLoad: false });
        iniciarFrontendDev();

        setBootstrap('init', 'Iniciando...', { progreso: 0, ok: false, error: null });
        arrancarServiciosEnBackground().catch((e) => {
            setBootstrap('error', 'Fallo inesperado al arrancar servicios.', { progreso: 5, ok: false, error: String(e?.message || e) });
        });
    } catch (error) {
        console.error('[Electron] Error durante el arranque:', error);
        try {
            const { logBootstrap } = require('./src-main/bootstrap-state');
            logBootstrap(`Error durante el arranque: ${String(error?.message || error)}`);
        } catch {}
        app.quit();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', async (event) => {
    if (state.isQuitting) return;
    event.preventDefault();
    state.isQuitting = true;

    try {
        await detenerPostgresLocal();
    } catch (e) {
        console.error('[Electron] Error al detener PostgreSQL:', e);
    }
    const { detenerProcesosHijos } = require('./src-main/lifecycle');
    detenerProcesosHijos();
    app.quit();
});

app.on('activate', () => {
    if (require('electron').BrowserWindow.getAllWindows().length === 0) {
        crearVentana();
    }
});
