const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const state = require('./state');

function obtenerComandoNpm() {
    return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function obtenerComandoSistemaWindows() {
    return process.env.ComSpec || 'cmd.exe';
}

function esUrlHttp(url) {
    return url.startsWith('http://') || url.startsWith('https://');
}

function htmlEscape(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function esUrlInterna(url) {
    if (!esUrlHttp(url)) return false;
    try {
        const { host } = new URL(url);
        return state.HOSTS_INTERNOS.has(host);
    } catch {
        return false;
    }
}

function pareceDescarga(url) {
    if (!url) return false;
    const urlMinuscula = url.toLowerCase();
    if (urlMinuscula.includes('/descargar') || urlMinuscula.includes('download')) return true;
    if (urlMinuscula.includes('content-disposition') || urlMinuscula.includes('response-content-disposition')) return true;
    const extensiones = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.csv', '.xlsx', '.docx', '.zip'];
    try {
        if (esUrlHttp(url)) {
            const { pathname, search } = new URL(url);
            if (extensiones.some((ext) => pathname.toLowerCase().endsWith(ext))) return true;
            if (search.toLowerCase().includes('x-amz-signature') && (search.toLowerCase().includes('response-content-type') || search.toLowerCase().includes('response-content-disposition'))) {
                return true;
            }
        }
    } catch {
    }

    return false;
}

function obtenerRutaDisponible(rutaDestino) {
    if (!fs.existsSync(rutaDestino)) return rutaDestino;

    const { dir, name, ext } = path.parse(rutaDestino);
    for (let i = 1; i <= 9999; i++) {
        const candidata = path.join(dir, `${name} (${i})${ext}`);
        if (!fs.existsSync(candidata)) return candidata;
    }

    return path.join(dir, `${name} (${Date.now()})${ext}`);
}

function obtenerExtensionPorMime(mime) {
    const mimeMinuscula = String(mime || '').toLowerCase();
    const mapa = {
        'application/pdf': '.pdf',
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/webp': '.webp',
        'image/gif': '.gif',
        'text/csv': '.csv',
        'application/zip': '.zip',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    };
    return mapa[mimeMinuscula] || '';
}

function normalizarNombreDeDescarga(nombre, mime) {
    let nombreFinal = (nombre || '').trim();
    if (!nombreFinal) nombreFinal = 'archivo';

    const nombreMinuscula = nombreFinal.toLowerCase();
    const pareceTemporal = nombreMinuscula.endsWith('.temp') || nombreMinuscula.endsWith('.tmp') || nombreMinuscula === 'download' || nombreMinuscula === 'archivo';
    if (pareceTemporal) {
        const extension = obtenerExtensionPorMime(mime);
        if (extension && !nombreFinal.toLowerCase().endsWith(extension)) {
            nombreFinal = `${path.parse(nombreFinal).name || 'archivo'}${extension}`;
        }
    }

    return nombreFinal;
}

function obtenerNombreDesdeUrl(url) {
    try {
        if (!esUrlHttp(url)) return null;
        const { pathname } = new URL(url);
        const base = path.posix.basename(pathname || '').trim();
        if (!base) return null;
        return base;
    } catch {
        return null;
    }
}

function esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function esPuertoDisponible(puerto) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.unref();

        server.on('error', () => {
            resolve(false);
        });

        server.listen({ port: Number(puerto), host: '0.0.0.0' }, () => {
            server.close(() => resolve(true));
        });
    });
}

async function esperarPuertoConectable({ host = '127.0.0.1', port, timeoutMs = 30000, intervaloMs = 250 } = {}) {
    const inicio = Date.now();
    const puertoNum = Number(port);
    if (!Number.isFinite(puertoNum) || puertoNum <= 0) return false;

    while (Date.now() - inicio < timeoutMs) {
        const ok = await new Promise((resolve) => {
            const sock = net.connect({ host, port: puertoNum });
            let resuelto = false;

            const fin = (v) => {
                if (resuelto) return;
                resuelto = true;
                try { sock.destroy(); } catch { }
                resolve(v);
            };

            sock.once('connect', () => fin(true));
            sock.once('error', () => fin(false));
            sock.setTimeout(750, () => fin(false));
        });

        if (ok) return true;
        await esperar(intervaloMs);
    }

    return false;
}

function ejecutarPowerShellSalida(comandoPs, timeoutMs = 2500) {
    return new Promise((resolve) => {
        if (process.platform !== 'win32') return resolve('');

        let stdout = '';
        let stderr = '';
        let finalizado = false;

        const child = spawn(
            'powershell.exe',
            ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', comandoPs],
            { windowsHide: true },
        );

        const timer = setTimeout(() => {
            try {
                finalizado = true;
                child.kill();
            } catch {
            }
            resolve('');
        }, timeoutMs);

        child.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
        child.stderr.on('data', (d) => { stderr += d.toString('utf8'); });

        child.on('error', () => {
            clearTimeout(timer);
            if (finalizado) return;
            resolve('');
        });

        child.on('close', () => {
            clearTimeout(timer);
            if (finalizado) return;
            const out = String(stdout || '').trim();
            if (!out) return resolve('');
            const err = String(stderr || '').trim();
            if (err && !out) return resolve('');

            resolve(out);
        });
    });
}

function ejecutarProcesoYEsperar(comando, args, options = {}) {
    return new Promise((resolve) => {
        let yaResuelto = false;
        try {
            const { timeoutMs, ...spawnOptions } = options || {};
            const child = spawn(comando, args, { windowsHide: true, ...spawnOptions });
            let stdout = '';
            let stderr = '';

            const resolverUnaVez = (resultado) => {
                if (yaResuelto) return;
                yaResuelto = true;
                resolve(resultado);
            };

            let timer = null;
            if (typeof timeoutMs === 'number' && timeoutMs > 0) {
                timer = setTimeout(() => {
                    try {
                        child.kill();
                    } catch {
                    }
                    resolverUnaVez({ code: 124, stdout: stdout.trim(), stderr: `${stderr}\nProceso excedió timeout (${timeoutMs}ms)`.trim() });
                }, timeoutMs);
            }

            child.stdout?.on('data', (d) => { stdout += d.toString('utf8'); });
            child.stderr?.on('data', (d) => { stderr += d.toString('utf8'); });

            child.on('error', (error) => {
                if (timer) clearTimeout(timer);
                resolverUnaVez({ code: 1, stdout: stdout.trim(), stderr: `${stderr}\n${error?.message || error}`.trim() });
            });

            child.on('exit', (code) => {
                if (timer) clearTimeout(timer);
                resolverUnaVez({ code: typeof code === 'number' ? code : 1, stdout: stdout.trim(), stderr: stderr.trim() });
            });

            child.on('close', (code) => {
                if (timer) clearTimeout(timer);
                resolverUnaVez({ code: typeof code === 'number' ? code : 1, stdout: stdout.trim(), stderr: stderr.trim() });
            });
        } catch (error) {
            resolve({ code: 1, stdout: '', stderr: String(error?.message || error) });
        }
    });
}

function escaparPowerShellLiteral(valor) {
    return String(valor || '').replace(/'/g, "''");
}

function escaparSqlLiteral(valor) {
    return String(valor || '').replace(/'/g, "''");
}

function leerTailArchivo(ruta, maxBytes = 16_384) {
    try {
        if (!ruta || !fs.existsSync(ruta)) return '';
        const stat = fs.statSync(ruta);
        const start = Math.max(0, Number(stat.size || 0) - maxBytes);
        const fd = fs.openSync(ruta, 'r');
        try {
            const buf = Buffer.alloc(Number(stat.size || 0) - start);
            fs.readSync(fd, buf, 0, buf.length, start);
            return buf.toString('utf8');
        } finally {
            try { fs.closeSync(fd); } catch { }
        }
    } catch {
        return '';
    }
}

module.exports = {
    obtenerComandoNpm,
    obtenerComandoSistemaWindows,
    esUrlHttp,
    htmlEscape,
    esUrlInterna,
    pareceDescarga,
    obtenerRutaDisponible,
    obtenerExtensionPorMime,
    normalizarNombreDeDescarga,
    obtenerNombreDesdeUrl,
    esperar,
    esPuertoDisponible,
    esperarPuertoConectable,
    ejecutarPowerShellSalida,
    ejecutarProcesoYEsperar,
    escaparPowerShellLiteral,
    escaparSqlLiteral,
    leerTailArchivo
};
