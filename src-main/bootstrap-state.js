const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const state = require('./state');

function obtenerRutaLogBootstrap() {
    try {
        const base = app.getPath('userData');
        const dir = path.join(base, 'logs');
        fs.mkdirSync(dir, { recursive: true });
        return path.join(dir, 'bootstrap.log');
    } catch {
        return path.join(process.cwd(), 'bootstrap.log');
    }
}

function logBootstrap(mensaje) {
    try {
        if (!state.rutaLogBootstrap) state.rutaLogBootstrap = obtenerRutaLogBootstrap();
        const linea = `[${new Date().toISOString()}] ${String(mensaje || '')}\n`;
        fs.appendFileSync(state.rutaLogBootstrap, linea, { encoding: 'utf8' });
    } catch {
    }
}

function emitirBootstrapEstado() {
    try {
        if (!state.ventanaPrincipal || state.ventanaPrincipal.isDestroyed()) return;
        const { obtenerEstadoBootstrapActual } = require('./bootstrap');
        state.ventanaPrincipal.webContents.send('bootstrap:progreso', obtenerEstadoBootstrapActual());
    } catch {
    }
}

function setBootstrap(stage, detail, { progreso, ok, error } = {}) {
    try {
        state.estadoBootstrap = {
            ...state.estadoBootstrap,
            stage: String(stage || state.estadoBootstrap.stage || 'init'),
            detail: String(detail || ''),
            progreso: typeof progreso === 'number' ? progreso : state.estadoBootstrap.progreso,
            ok: typeof ok === 'boolean' ? ok : state.estadoBootstrap.ok,
            error: error ? String(error) : (error === null ? null : state.estadoBootstrap.error),
            updatedAt: Date.now(),
        };

        logBootstrap(`[Bootstrap] ${state.estadoBootstrap.stage} p=${state.estadoBootstrap.progreso} ${state.estadoBootstrap.detail}${state.estadoBootstrap.error ? ` err=${state.estadoBootstrap.error}` : ''}`);
        emitirBootstrapEstado();
    } catch {
    }
}

module.exports = {
    obtenerRutaLogBootstrap,
    logBootstrap,
    emitirBootstrapEstado,
    setBootstrap
};
