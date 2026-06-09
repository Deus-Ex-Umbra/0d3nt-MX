const { app } = require('electron');
const path = require('path');

const PROJ_ROOT = path.join(__dirname, '..');

const state = {
    ventanaPrincipal: null,
    procesoBackend: null,
    procesoFrontend: null,
    procesoPostgres: null,
    tituloVentanaBase: null,
    rutaLogBootstrap: null,
    estadoBootstrap: {
        stage: 'init',
        detail: '',
        ok: false,
        error: null,
        progreso: 0,
        updatedAt: Date.now(),
    },
    descargasActivas: new Map(),
    isQuitting: false,

    // Constants
    MODO_EJECUCION: 'produccion',
    get ES_MODO_DESARROLLO() {
        return !app.isPackaged && this.MODO_EJECUCION === 'desarrollo';
    },
    get ABRIR_DEVTOOLS() {
        return this.ES_MODO_DESARROLLO;
    },
    URL_FRONTEND_DEV: 'http://localhost:5173',
    RUTA_FRONTEND_PROD: path.join(PROJ_ROOT, 'frontend', 'dist', 'index.html'),
    RUTA_BACKEND_ENTRY_PROD: path.join(PROJ_ROOT, 'backend', 'dist', 'main.js'),
    RUTA_BACKEND_CWD: path.join(PROJ_ROOT, 'backend'),
    RUTA_FRONTEND_CWD: path.join(PROJ_ROOT, 'frontend'),
    HOSTS_INTERNOS: new Set([
        'localhost:5173',
        '127.0.0.1:5173',
        'localhost:3000',
        '127.0.0.1:3000'
    ])
};

module.exports = state;
