const { ipcMain } = require('electron');
const state = require('./state');

function registrarIpcUI() {
    ipcMain.handle('ui:titlebarOverlay', async (_event, payload) => {
        try {
            if (!state.ventanaPrincipal || state.ventanaPrincipal.isDestroyed()) return { ok: false, error: 'No hay ventana' };

            const color = String(payload?.color || '').trim();
            const symbolColor = String(payload?.symbolColor || '').trim();
            const height = Number(payload?.height);

            if (!color || !symbolColor) return { ok: false, error: 'Payload inválido' };

            if (typeof state.ventanaPrincipal.setTitleBarOverlay !== 'function') {
                return { ok: false, error: 'TitleBarOverlay no soportado' };
            }

            state.ventanaPrincipal.setTitleBarOverlay({
                color,
                symbolColor,
                height: Number.isFinite(height) && height > 0 ? height : 32,
            });

            return { ok: true };
        } catch (error) {
            return { ok: false, error: String(error?.message || error) };
        }
    });

    ipcMain.handle('ui:window:minimize', async () => {
        try {
            if (!state.ventanaPrincipal || state.ventanaPrincipal.isDestroyed()) return { ok: false };
            state.ventanaPrincipal.minimize();
            return { ok: true };
        } catch {
            return { ok: false };
        }
    });

    ipcMain.handle('ui:window:maximizeToggle', async () => {
        try {
            if (!state.ventanaPrincipal || state.ventanaPrincipal.isDestroyed()) return { ok: false, maximized: false };
            if (state.ventanaPrincipal.isMaximized()) state.ventanaPrincipal.unmaximize();
            else state.ventanaPrincipal.maximize();
            return { ok: true, maximized: state.ventanaPrincipal.isMaximized() };
        } catch {
            return { ok: false, maximized: false };
        }
    });

    ipcMain.handle('ui:window:isMaximized', async () => {
        try {
            if (!state.ventanaPrincipal || state.ventanaPrincipal.isDestroyed()) return { ok: false, maximized: false };
            return { ok: true, maximized: state.ventanaPrincipal.isMaximized() };
        } catch {
            return { ok: false, maximized: false };
        }
    });

    ipcMain.handle('ui:window:isFullScreen', async () => {
        try {
            if (!state.ventanaPrincipal || state.ventanaPrincipal.isDestroyed()) return { ok: false, fullscreen: false };
            return { ok: true, fullscreen: state.ventanaPrincipal.isFullScreen() };
        } catch {
            return { ok: false, fullscreen: false };
        }
    });

    ipcMain.handle('ui:window:close', async () => {
        try {
            if (!state.ventanaPrincipal || state.ventanaPrincipal.isDestroyed()) return { ok: false };
            state.ventanaPrincipal.close();
            return { ok: true };
        } catch {
            return { ok: false };
        }
    });
}

module.exports = {
    registrarIpcUI
};
