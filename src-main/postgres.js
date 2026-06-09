const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { app } = require('electron');
const state = require('./state');
const { logBootstrap, setBootstrap } = require('./bootstrap-state');
const { ejecutarProcesoYEsperar, esperarPuertoConectable, esPuertoDisponible, esperar, escaparSqlLiteral } = require('./utils');

function obtenerRutaLicencia() {
    try {
        const base = app.getPath('userData');
        return path.join(base, 'licencia.odent');
    } catch {
        return path.join(process.cwd(), 'licencia.odent');
    }
}

function obtenerRutaBaseAppData() {
    try {
        return app.getPath('userData');
    } catch {
        return process.cwd();
    }
}

function obtenerRutaPsqlRoot() {
    const candidatas = [
        obtenerRutaPsqlRootUsuario(),
        path.join(process.resourcesPath || '', 'pgsql'),
        path.join(__dirname, '..', 'pgsql'),
        path.join(process.cwd(), 'build', 'pgsql'),
    ].filter(Boolean);

    for (const candidata of candidatas) {
        if (esPortablePostgresValido(candidata)) return candidata;
    }
    return '';
}

function obtenerRutaPsqlRootUsuario() {
    try {
        return path.join(app.getPath('userData'), 'pgsql');
    } catch {
        return path.join(process.cwd(), 'pgsql');
    }
}

function obtenerRutaPsqlBin() {
    const root = obtenerRutaPsqlRoot();
    return root ? path.join(root, 'bin') : '';
}

function obtenerRutaPsqlData() {
    const rootUsr = obtenerRutaPsqlRootUsuario();
    return path.join(rootUsr, 'data');
}

function asegurarDirectoriosDentroDe(rutaBase, directoriosRelativos) {
    let creados = 0;
    for (const dirRel of directoriosRelativos) {
        if (!dirRel) continue;
        const dirAbs = path.join(rutaBase, dirRel);
        try {
            if (!fs.existsSync(dirAbs)) {
                fs.mkdirSync(dirAbs, { recursive: true });
                creados++;
            }
        } catch {
        }
    }
    return creados;
}

function asegurarEstructuraDataPostgres(dataDir) {
    try {
        if (!dataDir) return { ok: false, creados: 0 };
        fs.mkdirSync(dataDir, { recursive: true });
        const requeridos = [
            'pg_commit_ts',
            'pg_dynshmem',
            'pg_logical/mappings',
            'pg_logical/snapshots',
            'pg_multixact/members',
            'pg_multixact/offsets',
            'pg_notify',
            'pg_replslot',
            'pg_serial',
            'pg_snapshots',
            'pg_stat',
            'pg_stat_tmp',
            'pg_tblspc',
            'pg_twophase',
            'pg_wal/archive_status',
            'pg_wal/summaries',
        ];

        const creados = asegurarDirectoriosDentroDe(dataDir, requeridos);
        return { ok: true, creados };
    } catch {
        return { ok: false, creados: 0 };
    }
}

async function copiarDirectorioAtomico(origen, destino) {
    if (!origen || !destino) return false;
    const tmp = `${destino}__tmp_${Date.now()}`;

    try {
        try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { }
        try { fs.rmSync(destino, { recursive: true, force: true }); } catch { }
        fs.mkdirSync(path.dirname(tmp), { recursive: true });

        if (fs.promises?.cp) {
            await fs.promises.cp(origen, tmp, { recursive: true, force: true });
        } else if (typeof fs.cp === 'function') {
            await new Promise((resolve, reject) => {
                fs.cp(origen, tmp, { recursive: true, force: true }, (err) => err ? reject(err) : resolve());
            });
        } else if (typeof fs.cpSync === 'function') {
            fs.cpSync(origen, tmp, { recursive: true, force: true });
        } else {
            return false;
        }

        fs.renameSync(tmp, destino);
        return true;
    } catch (e) {
        logBootstrap(`Error copiarDirectorioAtomico: ${String(e?.message || e)}`);
        try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { }
        return false;
    }
}

function obtenerRutaZipPostgresPortable() {
    const nombreZip = 'postgresql-18.3-1-windows-x64-binaries.zip';
    const candidatas = [
        path.join(process.resourcesPath || '', nombreZip),
        path.join(__dirname, '..', nombreZip),
        path.join(process.cwd(), nombreZip),
    ].filter(Boolean);

    for (const candidata of candidatas) {
        try {
            if (fs.existsSync(candidata)) return candidata;
        } catch {
        }
    }

    return '';
}

function esPortablePostgresValido(rutaRaiz) {
    try {
        if (!rutaRaiz) return false;
        const rutaBin = path.join(rutaRaiz, 'bin', 'postgres.exe');
        const rutaBki = path.join(rutaRaiz, 'share', 'postgres.bki');
        return fs.existsSync(rutaBin) && fs.existsSync(rutaBki);
    } catch {
        return false;
    }
}

function obtenerRutaPortableDesdeResources() {
    const candidatas = [
        path.join(process.resourcesPath || '', 'pgsql'),
        path.join(__dirname, '..', 'pgsql'),
        path.join(process.cwd(), 'build', 'pgsql'),
    ].filter(Boolean);

    for (const candidata of candidatas) {
        if (esPortablePostgresValido(candidata)) return candidata;
    }

    return '';
}

function copiarPortablePostgres(origen, destino) {
    try {
        if (!origen || !destino) return false;
        if (!esPortablePostgresValido(origen)) {
            logBootstrap(`Origen no válido para copia: ${origen}`);
            return false;
        }

        logBootstrap(`Iniciando copia de PostgreSQL portable a userData...`);
        logBootstrap(`Copia origen: ${origen}`);
        logBootstrap(`Copia destino: ${destino}`);

        try {
            fs.mkdirSync(path.dirname(destino), { recursive: true });
            fs.mkdirSync(destino, { recursive: true });
        } catch (e) {
            logBootstrap('Aviso al crear carpetas destino: ' + e.message);
        }

        if (typeof fs.cpSync === 'function') {
            try {
                fs.cpSync(origen, destino, { recursive: true, force: true });
            } catch (e) {
                logBootstrap(`cpSync falló: ${String(e?.message || e)}`);
                return false;
            }
        }

        const pidPath = path.join(destino, 'data', 'postmaster.pid');
        if (fs.existsSync(pidPath)) {
            try {
                fs.unlinkSync(pidPath);
                logBootstrap('Se limpió postmaster.pid restante exitosamente.');
            } catch (err) {
                logBootstrap('Error al limpiar postmaster.pid: ' + err.message);
            }
        }

        const valido = esPortablePostgresValido(destino);
        logBootstrap(`¿Es DB destino válido tras copia?: ${valido}`);
        return valido;
    } catch (e) {
        logBootstrap('Error critico en copiarPortablePostgres: ' + e.message);
        return false;
    }
}

async function asegurarPortablePostgresExtraido() {
    const dstRoot = obtenerRutaPsqlRootUsuario();
    const dstData = obtenerRutaPsqlData();

    const oldData = path.join(obtenerRutaBaseAppData(), 'pgsql_data');
    const oldTienePg = fs.existsSync(path.join(oldData, 'PG_VERSION'));

    if (esPortablePostgresValido(dstRoot)) {
        if (oldTienePg && !fs.existsSync(path.join(dstData, 'PG_VERSION'))) {
            try {
                fs.mkdirSync(path.dirname(dstData), { recursive: true });
                fs.renameSync(oldData, dstData);
                logBootstrap('Migración: se movió pgsql_data antiguo a userData/pgsql/data.');
            } catch (e) {
                logBootstrap(`Migración: no se pudo mover pgsql_data antiguo. ${String(e?.message || e)}`);
            }
        }

        const res = asegurarEstructuraDataPostgres(dstData);
        if (res.ok && res.creados) logBootstrap(`Reparación: se crearon ${res.creados} carpetas faltantes en userData/pgsql/data.`);
        return true;
    }

    const srcRoot = obtenerRutaPortableDesdeResources();
    if (!srcRoot) {
        logBootstrap('[Electron] PostgreSQL portable no encontrado en resources/build.');
        return false;
    }

    logBootstrap('Copiando PostgreSQL portable completo a AppData (userData/pgsql)...');
    const copiado = await copiarDirectorioAtomico(srcRoot, dstRoot);
    if (!copiado) {
        logBootstrap('Error: no se pudo copiar PostgreSQL portable a userData/pgsql.');
        return false;
    }

    if (!esPortablePostgresValido(dstRoot)) {
        logBootstrap('Error: copia de pgsql incompleta (faltan bin/postgres.exe o share/postgres.bki).');
        return false;
    }

    if (oldTienePg && !fs.existsSync(path.join(dstData, 'PG_VERSION'))) {
        try {
            fs.mkdirSync(path.dirname(dstData), { recursive: true });
            fs.renameSync(oldData, dstData);
            logBootstrap('Migración: se movió pgsql_data antiguo a userData/pgsql/data.');
        } catch (e) {
            logBootstrap(`Migración: no se pudo mover pgsql_data antiguo. ${String(e?.message || e)}`);
        }
    }

    const res = asegurarEstructuraDataPostgres(dstData);
    if (res.ok && res.creados) logBootstrap(`Reparación: se crearon ${res.creados} carpetas faltantes en userData/pgsql/data.`);
    return true;
}

async function inicializarPostgresSiNecesario(binDir, dataDir, passwordPostgres) {
    if (fs.existsSync(path.join(dataDir, 'PG_VERSION'))) return true;

    try {
        fs.mkdirSync(dataDir, { recursive: true });
    } catch {
    }

    const rutaPw = path.join(os.tmpdir(), `0d3nt-pg-pw-${Date.now()}.txt`);
    try {
        fs.writeFileSync(rutaPw, `${passwordPostgres || ''}\n`, { encoding: 'utf8' });
    } catch {
        console.warn('[Electron] No se pudo crear archivo temporal para initdb.');
        return false;
    }

    const initdbExe = path.join(binDir, 'initdb.exe');
    let init = await ejecutarProcesoYEsperar(
        initdbExe,
        ['-U', 'postgres', '-A', 'password', '-E', 'UTF8', '--pwfile', rutaPw, '-D', dataDir],
        { cwd: binDir, windowsHide: true }
    );

    try {
        fs.unlinkSync(rutaPw);
    } catch {
    }

    if (init.code !== 0 && !fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
        try {
            fs.rmSync(dataDir, { recursive: true, force: true });
            fs.mkdirSync(dataDir, { recursive: true });
        } catch {
        }

        init = await ejecutarProcesoYEsperar(
            initdbExe,
            ['-U', 'postgres', '-A', 'password', '-E', 'UTF8', '--pwfile', rutaPw, '-D', dataDir],
            { cwd: binDir, windowsHide: true }
        );
    }

    if (init.code !== 0) {
        console.warn('[Electron] initdb falló durante configuración automática.');
        if (init.stderr) {
            console.warn(`[Electron] initdb stderr: ${String(init.stderr).trim()}`);
        }
        return false;
    }

    return true;
}

async function asegurarUsuarioYBasePostgres(binDir, puerto, usuarioDb, passwordPostgres, dbNombre) {
    const envPg = { ...process.env, PGPASSWORD: String(passwordPostgres || '') };
    const psqlExe = path.join(binDir, 'psql.exe');
    const createdbExe = path.join(binDir, 'createdb.exe');

    const passEsc = escaparSqlLiteral(passwordPostgres || '');
    const userEsc = escaparSqlLiteral(usuarioDb || 'postgres');
    const dbEsc = escaparSqlLiteral(dbNombre || 'db0d3ntnr');

    if (String(usuarioDb || 'postgres') !== 'postgres') {
        const sqlRole = `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='${userEsc}') THEN CREATE ROLE "${usuarioDb}" LOGIN PASSWORD '${passEsc}'; ELSE ALTER ROLE "${usuarioDb}" WITH PASSWORD '${passEsc}'; END IF; END $$;`;
        const resRole = await ejecutarProcesoYEsperar(
            psqlExe,
            ['-h', '127.0.0.1', '-U', 'postgres', '-d', 'postgres', '-p', String(puerto), '-v', 'ON_ERROR_STOP=1', '-c', sqlRole],
            { cwd: binDir, windowsHide: true, env: envPg, timeoutMs: 20000 }
        );
        if (resRole.code !== 0) {
            logBootstrap(`Aviso: no se pudo asegurar el usuario DB "${usuarioDb}". stderr=${String(resRole.stderr || '').trim()}`);
        }
    } else if (String(passwordPostgres || '')) {
        const sqlAlter = `ALTER USER postgres WITH PASSWORD '${passEsc}';`;
        const resAlter = await ejecutarProcesoYEsperar(
            psqlExe,
            ['-h', '127.0.0.1', '-U', 'postgres', '-d', 'postgres', '-p', String(puerto), '-v', 'ON_ERROR_STOP=1', '-c', sqlAlter],
            { cwd: binDir, windowsHide: true, env: envPg, timeoutMs: 20000 }
        );
        if (resAlter.code !== 0) {
            logBootstrap(`Aviso: no se pudo actualizar password de postgres. stderr=${String(resAlter.stderr || '').trim()}`);
        }
    }

    const creaDb = await ejecutarProcesoYEsperar(
        createdbExe,
        ['-h', '127.0.0.1', '-U', 'postgres', '-p', String(puerto), '-O', String(usuarioDb || 'postgres'), String(dbNombre || 'db0d3ntnr')],
        { cwd: binDir, windowsHide: true, env: envPg, timeoutMs: 20000 }
    );

    if (creaDb.code !== 0) {
        const sqlExists = `SELECT 1 FROM pg_database WHERE datname='${dbEsc}';`;
        const existe = await ejecutarProcesoYEsperar(
            psqlExe,
            ['-h', '127.0.0.1', '-U', 'postgres', '-d', 'postgres', '-p', String(puerto), '-t', '-A', '-c', sqlExists],
            { cwd: binDir, windowsHide: true, env: envPg, timeoutMs: 20000 }
        );

        if (!String(existe.stdout || '').trim().includes('1')) {
            console.warn('[Electron] No se pudo crear la base de datos automáticamente.');
            logBootstrap(`No se pudo crear DB "${dbNombre}". createdb stderr=${String(creaDb.stderr || '').trim()} psql stderr=${String(existe.stderr || '').trim()}`);
        }
    }
}

function obtenerRutaDocs0d3nt() {
    const rutaLicencia = obtenerRutaLicencia();
    try {
        return path.join(path.dirname(rutaLicencia), 'docs-0d3nt');
    } catch {
        return path.join(process.cwd(), 'docs-0d3nt');
    }
}

async function postgresEstaActivo(binDir, dataDir) {
    if (!fs.existsSync(path.join(binDir, 'pg_ctl.exe'))) return false;
    const resultado = await ejecutarProcesoYEsperar(
        path.join(binDir, 'pg_ctl.exe'),
        ['-D', dataDir, 'status'],
        { cwd: binDir, timeoutMs: 15000 }
    );
    return resultado.code === 0;
}

function leerInfoPostmasterPid(dataDir) {
    try {
        const pidPath = path.join(dataDir, 'postmaster.pid');
        if (!fs.existsSync(pidPath)) return null;

        const contenido = fs.readFileSync(pidPath, 'utf8');
        const lineas = String(contenido || '').split(/\r?\n/);
        const pid = Number((lineas[0] || '').trim());
        const dataDirEnPid = String((lineas[1] || '')).trim();
        const port = Number((lineas[3] || '').trim());

        return {
            pid: Number.isFinite(pid) ? pid : null,
            dataDir: dataDirEnPid,
            port: Number.isFinite(port) ? port : null,
        };
    } catch {
        return null;
    }
}

async function iniciarPostgresLocal() {
    if (process.platform !== 'win32') return true;

    const portableOk = await asegurarPortablePostgresExtraido();
    if (!portableOk) {
        console.warn('[Electron] PostgreSQL portable no disponible tras verificación automática.');
        logBootstrap('PostgreSQL portable no disponible tras verificación automática.');
        return false;
    }

    const binDir = obtenerRutaPsqlBin();
    const dataDir = obtenerRutaPsqlData();

    if (!fs.existsSync(path.join(binDir, 'pg_ctl.exe'))) {
        console.warn('[Electron] PostgreSQL no encontrado en:', binDir);
        logBootstrap(`PostgreSQL no encontrado en: ${binDir}`);
        return false;
    }

    const puerto = String(process.env.DB_PORT || '5432');
    const usuarioDb = String(process.env.DB_USERNAME || 'postgres');
    const passwordDb = String(process.env.DB_PASSWORD || '');
    const nombreDb = String(process.env.DB_DATABASE || 'db0d3ntnr');

    const puertoNum = Number(puerto);
    if (!Number.isFinite(puertoNum) || puertoNum <= 0) {
        logBootstrap(`DB_PORT inválido: ${puerto}`);
        return false;
    }

    const puertoResponde = await esperarPuertoConectable({ host: '127.0.0.1', port: puertoNum, timeoutMs: 500, intervaloMs: 100 });
    if (puertoResponde) {
        const infoPid = leerInfoPostmasterPid(dataDir);
        const dataDirPid = infoPid?.dataDir ? path.normalize(infoPid.dataDir) : '';
        const dataDirNorm = path.normalize(dataDir);

        if (infoPid?.port === puertoNum && dataDirPid === dataDirNorm) {
            console.log('[Electron] PostgreSQL ya está respondiendo en el puerto configurado.');
            logBootstrap('PostgreSQL ya estaba respondiendo en el puerto configurado.');
            await asegurarUsuarioYBasePostgres(binDir, puerto, usuarioDb, passwordDb, nombreDb);
            return true;
        }

        logBootstrap(`Puerto ${puertoNum} ya está en uso por otro servicio (postmaster.pid no coincide con dataDir).`);
        return false;
    }

    const activo = await postgresEstaActivo(binDir, dataDir);

    if (activo) {
        console.log('[Electron] PostgreSQL ya está activo.');
        logBootstrap('PostgreSQL ya estaba activo.');
        await asegurarUsuarioYBasePostgres(binDir, puerto, usuarioDb, passwordDb, nombreDb);
        return true;
    }

    const inicializado = await inicializarPostgresSiNecesario(binDir, dataDir, passwordDb);
    if (!inicializado) {
        logBootstrap('initdb falló durante configuración automática.');
        return false;
    }

    const resStruct = asegurarEstructuraDataPostgres(dataDir);
    if (!resStruct.ok) {
        logBootstrap('Aviso: no se pudo asegurar la estructura de carpetas requerida por PostgreSQL.');
    }

    try {
        const pidPath = path.join(dataDir, 'postmaster.pid');
        if (fs.existsSync(pidPath)) {
            const puertoLibreAhora = await esPuertoDisponible(puertoNum);
            if (puertoLibreAhora) {
                try { fs.unlinkSync(pidPath); } catch (e) {
                    logBootstrap(`Aviso: no se pudo eliminar postmaster.pid: ${String(e?.message || e)}`);
                }
            }
        }
    } catch {
    }

    const puertoLibre = await esPuertoDisponible(puertoNum);
    if (!puertoLibre) {
        logBootstrap(`PostgreSQL no iniciado: el puerto ${puertoNum} ya está en uso. Cambia DB_PORT o libera el puerto.`);
        return false;
    }

    const args = ['-D', dataDir, '-o', `-p ${puertoNum}`, '-w', '-t', '120', 'start'];
    const inicio = await ejecutarProcesoYEsperar(
        path.join(binDir, 'pg_ctl.exe'),
        args,
        { cwd: binDir, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], timeoutMs: 180000 }
    );

    if (inicio.code !== 0) {
        console.warn('[Electron] No se pudo iniciar PostgreSQL con pg_ctl start.');
        const extra = String(inicio.stdout || '').trim();
        logBootstrap(`pg_ctl start falló. stderr=${String(inicio.stderr || '')}\nstdout=${extra}`);
        return false;
    }

    logBootstrap('PostgreSQL iniciado correctamente.');

    const listo = await esperarPuertoConectable({ host: '127.0.0.1', port: puertoNum, timeoutMs: 90000, intervaloMs: 250 });
    if (!listo) {
        logBootstrap(`PostgreSQL no respondió en puerto ${puertoNum} dentro del timeout.`);
        return false;
    }

    await asegurarUsuarioYBasePostgres(binDir, puerto, usuarioDb, passwordDb, nombreDb);

    return true;
}

async function detenerPostgresLocal() {
    if (process.platform !== 'win32') return;

    const binDir = obtenerRutaPsqlBin();
    const dataDir = obtenerRutaPsqlData();

    if (!fs.existsSync(path.join(binDir, 'pg_ctl.exe'))) return;

    const activo = await postgresEstaActivo(binDir, dataDir);
    if (!activo) return;

    await ejecutarProcesoYEsperar(
        path.join(binDir, 'pg_ctl.exe'),
        ['-D', dataDir, '-m', 'fast', 'stop'],
        { cwd: binDir, windowsHide: true, stdio: 'ignore' }
    );
}

module.exports = {
    obtenerRutaLicencia,
    obtenerRutaBaseAppData,
    obtenerRutaPsqlRoot,
    obtenerRutaPsqlRootUsuario,
    obtenerRutaPsqlBin,
    obtenerRutaPsqlData,
    asegurarDirectoriosDentroDe,
    asegurarEstructuraDataPostgres,
    copiarDirectorioAtomico,
    obtenerRutaZipPostgresPortable,
    esPortablePostgresValido,
    obtenerRutaPortableDesdeResources,
    copiarPortablePostgres,
    asegurarPortablePostgresExtraido,
    inicializarPostgresSiNecesario,
    asegurarUsuarioYBasePostgres,
    obtenerRutaDocs0d3nt,
    postgresEstaActivo,
    leerInfoPostmasterPid,
    iniciarPostgresLocal,
    detenerPostgresLocal
};
