const fs = require('fs');
const path = require('path');
const { app, ipcMain } = require('electron');
const state = require('./state');
const postgres = require('./postgres');
const { obtenerRutaLogBootstrap } = require('./bootstrap-state');
const { leerTailArchivo } = require('./utils');

function obtenerEstadoBootstrapActual() {
    try {
        const rutaPsqlUser = postgres.obtenerRutaPsqlRootUsuario();
        const rutaPsqlResources = postgres.obtenerRutaPortableDesdeResources();
        const root = postgres.obtenerRutaPsqlRoot();
        const binDir = root ? path.join(root, 'bin') : '';
        const dataDir = postgres.obtenerRutaPsqlData();
        const pgCtl = binDir ? path.join(binDir, 'pg_ctl.exe') : '';

        return {
            ...state.estadoBootstrap,
            dbPort: Number(process.env.DB_PORT || '5432'),
            backendPort: Number(process.env.PORT || '3000'),
            rutas: {
                userData: (() => { try { return app.getPath('userData'); } catch { return ''; } })(),
                pgsqlUser: rutaPsqlUser,
                pgsqlResources: rutaPsqlResources,
                pgsqlRootActual: root,
                pgsqlData: dataDir,
                pgCtl,
                bootstrapLog: state.rutaLogBootstrap || obtenerRutaLogBootstrap(),
            },
            checks: {
                pgsqlUserExiste: !!(rutaPsqlUser && fs.existsSync(rutaPsqlUser)),
                pgsqlUserValido: postgres.esPortablePostgresValido(rutaPsqlUser),
                pgsqlResourcesValido: postgres.esPortablePostgresValido(rutaPsqlResources),
                pgCtlExiste: !!(pgCtl && fs.existsSync(pgCtl)),
                dataDirExiste: !!(dataDir && fs.existsSync(dataDir)),
                pgVersionExiste: !!(dataDir && fs.existsSync(path.join(dataDir, 'PG_VERSION'))),
            }
        };
    } catch {
        return { ...state.estadoBootstrap };
    }
}

function registrarIpcBootstrap() {
    ipcMain.handle('bootstrap:estado', async () => {
        return obtenerEstadoBootstrapActual();
    });

    ipcMain.handle('bootstrap:logs', async () => {
        try {
            const logPath = state.rutaLogBootstrap || obtenerRutaLogBootstrap();
            return {
                bootstrap: leerTailArchivo(logPath, 64 * 1024),
                postgres: leerTailArchivo(path.join(postgres.obtenerRutaPsqlData(), 'logfile'), 64 * 1024),
            };
        } catch {
            return { bootstrap: '', postgres: '' };
        }
    });
}

module.exports = {
    obtenerEstadoBootstrapActual,
    registrarIpcBootstrap
};
