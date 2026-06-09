const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { app, BrowserWindow, screen, shell } = require('electron');
const state = require('./state');
const { logBootstrap, setBootstrap } = require('./bootstrap-state');
const { 
    obtenerRutaDocs0d3nt, 
    iniciarPostgresLocal 
} = require('./postgres');
const { 
    obtenerComandoNpm, 
    obtenerComandoSistemaWindows, 
    esUrlHttp, 
    htmlEscape, 
    esUrlInterna, 
    pareceDescarga, 
    esperar, 
    esPuertoDisponible, 
    esperarPuertoConectable 
} = require('./utils');

function detenerProcesoArbol(proceso) {
    if (!proceso || !proceso.pid) return;

    try {
        if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', String(proceso.pid), '/t', '/f'], {
                stdio: 'ignore',
                windowsHide: true
            });
        } else {
            process.kill(-proceso.pid);
        }
    } catch (error) {
        console.error('[Electron] Error al detener proceso:', error);
    }
}

function detenerProcesosHijos() {
    detenerProcesoArbol(state.procesoBackend);
    detenerProcesoArbol(state.procesoFrontend);
    if (state.procesoPostgres) {
        try {
            detenerProcesoArbol(state.procesoPostgres);
        } catch {
        }
    }
}

function registrarManejadoresDeSalida() {
    process.on('exit', () => {
        detenerProcesosHijos();
    });

    process.on('SIGINT', () => {
        app.quit();
    });

    process.on('SIGTERM', () => {
        app.quit();
    });

    process.on('uncaughtException', (error) => {
        logBootstrap('uncaughtException: ' + String(error?.stack || error)); 
        console.error('[Electron] uncaughtException:', error);
        app.quit();
    });

    process.on('unhandledRejection', (razon) => {
        logBootstrap('unhandledRejection: ' + String(razon?.stack || razon)); 
        console.error('[Electron] unhandledRejection:', razon);
        app.quit();
    });
}

async function iniciarBackend() {
    const puerto = Number(process.env.PORT) || 3000;
    const disponible = await esPuertoDisponible(puerto);
    if (!disponible) {
        console.warn(`[Electron] Backend no iniciado: puerto ${puerto} ya está en uso.`);
        logBootstrap(`Backend no iniciado: puerto ${puerto} ya está en uso.`);
        return;
    }

    const cwdBackend = app.isPackaged ? process.resourcesPath : state.RUTA_BACKEND_CWD;

    const opcionesBase = {
        cwd: cwdBackend,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        detached: process.platform !== 'win32',
        env: {
            ...process.env,
            DOCS_0D3NT_DIR: obtenerRutaDocs0d3nt(),
            MIGRACION_OUTPUT_DIR: (() => {
                try {
                    return app.getPath('downloads');
                } catch {
                    return '';
                }
            })(),
        }
    };

    if (state.ES_MODO_DESARROLLO) {
        if (process.platform === 'win32') {
            const cmd = obtenerComandoSistemaWindows();
            state.procesoBackend = spawn(cmd, ['/d', '/s', '/c', 'npm run start:dev'], opcionesBase);
        } else {
            const comandoNpm = obtenerComandoNpm();
            state.procesoBackend = spawn(comandoNpm, ['run', 'start:dev'], opcionesBase);
        }
        console.log('[Electron] Backend (dev) iniciado:', 'npm run start:dev');
    } else {
        const execNode = app.isPackaged ? process.execPath : 'node';
        const argsNode = app.isPackaged ? [state.RUTA_BACKEND_ENTRY_PROD] : [state.RUTA_BACKEND_ENTRY_PROD];
        const envNode = app.isPackaged
            ? { ...opcionesBase.env, ELECTRON_RUN_AS_NODE: '1' }
            : opcionesBase.env;

        state.procesoBackend = spawn(execNode, argsNode, {
            ...opcionesBase,
            env: envNode,
        });
        console.log('[Electron] Backend (prod) iniciado:', `${execNode} ${argsNode.join(' ')}`);
    }

    state.procesoBackend.on('error', (error) => {
        console.error('[Electron] Error al iniciar backend:', error);
        logBootstrap(`Error al iniciar backend: ${String(error?.message || error)}`);
    });

    state.procesoBackend.stdout?.on('data', (data) => {
        const msg = String(data).trimEnd();
        if (!msg) return;
        if (!app.isPackaged) console.log(`[Backend] ${msg}`);
        logBootstrap(`[Backend] ${msg}`);
    });

    state.procesoBackend.stderr?.on('data', (data) => {
        const msg = String(data).trimEnd();
        if (!msg) return;
        if (!app.isPackaged) console.error(`[Backend][Error] ${msg}`);
        logBootstrap(`[Backend][Error] ${msg}`);
    });

    state.procesoBackend.on('exit', (code, signal) => {
        console.log(`[Electron] Backend finalizó. code=${code} signal=${signal}`);
        logBootstrap(`Backend finalizó. code=${code} signal=${signal}`);
    });
}

function iniciarFrontendDev() {
    if (!state.ES_MODO_DESARROLLO) return;

    const opcionesBase = {
        cwd: state.RUTA_FRONTEND_CWD,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        detached: process.platform !== 'win32'
    };

    if (process.platform === 'win32') {
        const cmd = obtenerComandoSistemaWindows();
        state.procesoFrontend = spawn(cmd, ['/d', '/s', '/c', 'npm run dev -- --port 5173 --strictPort'], opcionesBase);
    } else {
        const comandoNpm = obtenerComandoNpm();
        state.procesoFrontend = spawn(comandoNpm, ['run', 'dev', '--', '--port', '5173', '--strictPort'], opcionesBase);
    }

    console.log('[Electron] Frontend (dev) iniciado:', 'npm run dev');

    state.procesoFrontend.on('error', (error) => {
        console.error('[Electron] Error al iniciar frontend (dev):', error);
    });

    state.procesoFrontend.stdout.on('data', (data) => {
        console.log(`[Frontend] ${String(data).trimEnd()}`);
    });

    state.procesoFrontend.stderr.on('data', (data) => {
        console.error(`[Frontend][Error] ${String(data).trimEnd()}`);
    });

    state.procesoFrontend.on('exit', (code, signal) => {
        console.log(`[Electron] Frontend finalizó. code=${code} signal=${signal}`);
    });
}

async function arrancarServiciosEnBackground() {
    setBootstrap('postgres:preparando', 'Preparando PostgreSQL local...', { progreso: 10, ok: false, error: null });

    let pgOk = false;
    for (let intento = 1; intento <= 2; intento++) {
        setBootstrap('postgres:iniciando', `Iniciando PostgreSQL (intento ${intento}/2)...`, { progreso: 20 + (intento - 1) * 5 });
        try {
            pgOk = await iniciarPostgresLocal();
        } catch (e) {
            pgOk = false;
            logBootstrap(`Error iniciarPostgresLocal intento ${intento}: ${String(e?.message || e)}`);
        }
        if (pgOk) break;
        await esperar(500);
    }

    if (!pgOk) {
        setBootstrap('error', 'No se pudo iniciar PostgreSQL automáticamente.', { progreso: 30, ok: false, error: 'postgres_failed' });
        return;
    }

    setBootstrap('postgres:listo', 'PostgreSQL listo.', { progreso: 40, ok: false });

    setBootstrap('backend:iniciando', 'Iniciando backend...', { progreso: 55, ok: false });
    try {
        await iniciarBackend();
    } catch (e) {
        setBootstrap('error', 'No se pudo iniciar el backend.', { progreso: 60, ok: false, error: String(e?.message || e) });
        return;
    }

    const backendPort = Number(process.env.PORT || '3000');
    const backendOk = await esperarPuertoConectable({ host: '127.0.0.1', port: backendPort, timeoutMs: 120000, intervaloMs: 250 });
    if (!backendOk) {
        setBootstrap('error', `El backend no respondió en el puerto ${backendPort}.`, { progreso: 70, ok: false, error: 'backend_timeout' });
        return;
    }

    setBootstrap('listo', 'Servicios iniciados correctamente.', { progreso: 100, ok: true, error: null });
}

function registrarAtajosVentana(win) {
    if (!win || win.isDestroyed?.()) return;

    win.webContents.on('before-input-event', (event, input) => {
        try {
            if (!input || input.type !== 'keyDown') return;

            if (input.key === 'F5') {
                event.preventDefault();
                win.webContents.reloadIgnoringCache();
                return;
            }

            if (input.key === 'F11') {
                event.preventDefault();
                win.setFullScreen(!win.isFullScreen());
                return;
            }

            if (input.key === 'F12') {
                event.preventDefault();
                if (win.webContents.isDevToolsOpened()) {
                    win.webContents.closeDevTools();
                } else {
                    win.webContents.openDevTools({ mode: 'detach' });
                }
            }
        } catch {
        }
    });
}

async function cargarURLConReintentos(win, url, { reintentos = 60, esperaMs = 500 } = {}) {
    for (let intento = 1; intento <= reintentos; intento++) {
        try {
            await win.loadURL(url);
            return;
        } catch (error) {
            if (intento === reintentos) throw error;
            await esperar(esperaMs);
        }
    }
}

async function cargarFrontendPrincipal() {
    if (!state.ventanaPrincipal || state.ventanaPrincipal.isDestroyed()) return;

    if (state.ES_MODO_DESARROLLO) {
        await cargarURLConReintentos(state.ventanaPrincipal, state.URL_FRONTEND_DEV);
        if (state.ABRIR_DEVTOOLS) state.ventanaPrincipal.webContents.openDevTools();
        return;
    }

    if (!fs.existsSync(state.RUTA_FRONTEND_PROD)) {
        const mensaje = `<!doctype html><html><head><meta charset="utf-8" />
<title>0d3ntApp</title></head><body style="font-family: sans-serif; padding: 24px;">
<h2>No se encontró el build del frontend</h2>
<p>No existe: <code>${htmlEscape(state.RUTA_FRONTEND_PROD)}</code></p>
<p>Solución: ejecuta <code>cd frontend</code> y luego <code>npm run build</code>.</p>
</body></html>`;
        await state.ventanaPrincipal.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(mensaje)}`);
        return;
    }

    await state.ventanaPrincipal.loadFile(state.RUTA_FRONTEND_PROD);
}

async function crearVentana({ skipLoad = false } = {}) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const opcionesVentana = {
        width,
        height,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    };
    if (process.platform === 'win32') {
        opcionesVentana.frame = false;
    }

    state.ventanaPrincipal = new BrowserWindow(opcionesVentana);

    registrarAtajosVentana(state.ventanaPrincipal);

    state.ventanaPrincipal.maximize();
    state.ventanaPrincipal.setMenu(null);
    try {
        state.tituloVentanaBase = state.ventanaPrincipal.getTitle();
    } catch {
        state.tituloVentanaBase = '0d3nt';
    }
    state.ventanaPrincipal.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('blob:') || esUrlInterna(url) || pareceDescarga(url)) {
            state.ventanaPrincipal.webContents.downloadURL(url);
            return { action: 'deny' };
        }

        if (esUrlHttp(url)) {
            shell.openExternal(url);
            return { action: 'deny' };
        }

        return { action: 'deny' };
    });

    state.ventanaPrincipal.webContents.on('will-navigate', (event, url) => {
        if (url.startsWith('blob:') || pareceDescarga(url)) {
            event.preventDefault();
            state.ventanaPrincipal.webContents.downloadURL(url);
            return;
        }
        if (esUrlHttp(url) && esUrlInterna(url)) {
            try {
                const { host } = new URL(url);
                if (host === 'localhost:3000' || host === '127.0.0.1:3000') {
                    event.preventDefault();
                    state.ventanaPrincipal.webContents.downloadURL(url);
                    return;
                }
            } catch {
            }
        }
        if (esUrlHttp(url) && !esUrlInterna(url)) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    if (!skipLoad) {
        await cargarFrontendPrincipal();
    }
    state.ventanaPrincipal.webContents.on('did-fail-load', async (_event, errorCode, errorDescription, validatedURL) => {
        try {
            const mensaje = `<!doctype html><html><head><meta charset="utf-8" />
<title>0d3ntApp</title></head><body style="font-family: sans-serif; padding: 24px;">
<h2>Error al cargar la interfaz</h2>
<p><b>${errorDescription}</b> (code ${errorCode})</p>
<p>URL: <code>${validatedURL || ''}</code></p>
<p>Tip: presiona <code>F12</code> para abrir DevTools.</p>
</body></html>`;
            await state.ventanaPrincipal.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(mensaje)}`);
        } catch {
        }
    });

    state.ventanaPrincipal.on('closed', () => {
        state.ventanaPrincipal = null;
    });
    state.ventanaPrincipal.on('maximize', () => {
        try {
            state.ventanaPrincipal?.webContents?.send('ui:window:maximized', true);
        } catch {
        }
    });

    state.ventanaPrincipal.on('unmaximize', () => {
        try {
            state.ventanaPrincipal?.webContents?.send('ui:window:maximized', false);
        } catch {
        }
    });

    state.ventanaPrincipal.on('enter-full-screen', () => {
        try {
            state.ventanaPrincipal?.webContents?.send('ui:window:fullscreen', true);
        } catch {
        }
    });

    state.ventanaPrincipal.on('leave-full-screen', () => {
        try {
            state.ventanaPrincipal?.webContents?.send('ui:window:fullscreen', false);
        } catch {
        }
    });
}

module.exports = {
    detenerProcesoArbol,
    detenerProcesosHijos,
    registrarManejadoresDeSalida,
    iniciarBackend,
    iniciarFrontendDev,
    arrancarServiciosEnBackground,
    registrarAtajosVentana,
    cargarURLConReintentos,
    cargarFrontendPrincipal,
    crearVentana
};
