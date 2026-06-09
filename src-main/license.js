const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { app, ipcMain, safeStorage } = require('electron');
const state = require('./state');
const { ejecutarPowerShellSalida, obtenerRutaDisponible } = require('./utils');
const { obtenerRutaLicencia } = require('./postgres');

function normalizarIdHardware(valor) {
    const s = String(valor || '').trim();
    if (!s) return '';
    const upper = s.toUpperCase();
    const invalidos = [
        'TO BE FILLED BY O.E.M.',
        'DEFAULT STRING',
        'DEFAULT',
        'NONE',
        'UNKNOWN',
        'N/A',
    ];
    if (invalidos.some((x) => upper === x || upper.includes(x))) return '';
    return s.replace(/[\r\n\t ]+/g, '');
}

let _hwidCachePromise = null;
let _hwidCache = null;

async function obtenerHwidHardwareV2Win32() {
    if (process.platform !== 'win32') return '';
    const prefijo = "$ErrorActionPreference='SilentlyContinue';";

    const [uuidRaw, cpuRaw, boardRaw, biosRaw] = await Promise.all([
        ejecutarPowerShellSalida(`${prefijo} (Get-CimInstance Win32_ComputerSystemProduct | Select-Object -First 1 -ExpandProperty UUID)`),
        ejecutarPowerShellSalida(`${prefijo} (Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty ProcessorId)`),
        ejecutarPowerShellSalida(`${prefijo} (Get-CimInstance Win32_BaseBoard | Select-Object -First 1 -ExpandProperty SerialNumber)`),
        ejecutarPowerShellSalida(`${prefijo} (Get-CimInstance Win32_BIOS | Select-Object -First 1 -ExpandProperty SerialNumber)`),
    ]);

    const uuid = normalizarIdHardware(uuidRaw);
    const cpu = normalizarIdHardware(cpuRaw);
    const board = normalizarIdHardware(boardRaw);
    const bios = normalizarIdHardware(biosRaw);

    if (!uuid && !cpu && !board && !bios) return '';

    const partes = [
        'HWIDv2',
        process.platform,
        process.arch,
        uuid,
        cpu,
        board,
        bios,
    ].join('|');

    return crypto.createHash('sha256').update(partes, 'utf8').digest('hex');
}

async function obtenerHwidLocal() {
    if (_hwidCache) return _hwidCache;
    if (_hwidCachePromise) return _hwidCachePromise;

    _hwidCachePromise = (async () => {
        let v2 = '';
        try {
            v2 = await obtenerHwidHardwareV2Win32();
        } catch {
            v2 = '';
        }
        if (!v2) {
            const partes = [process.platform, process.arch, os.hostname()].join('|');
            v2 = crypto.createHash('sha256').update(`HWIDv2f|${partes}`, 'utf8').digest('hex');
        }

        _hwidCache = v2;
        return _hwidCache;
    })();

    return _hwidCachePromise;
}

function obtenerLlavePublicaEd25519PemCliente() {
    const raw = (process.env.VL_ED25519_PUBLIC_KEY_PEM || process.env.VL_ED25519_PUBLIC_KEY || '').trim();
    if (!raw) return '';
    const pem = raw.replace(/\\n/g, '\n');
    if (!pem.includes('BEGIN PUBLIC KEY')) return '';
    return pem;
}

function normalizarLlavePublicaPem(valor) {
    const raw = String(valor || '').trim();
    if (!raw) return '';
    const pem = raw.replace(/\\n/g, '\n');
    if (!pem.includes('BEGIN PUBLIC KEY')) return '';
    return pem;
}

function esHexValido(txt) {
    const s = String(txt || '').trim();
    return !!s && s.length % 2 === 0 && /^[0-9a-f]+$/i.test(s);
}

function verificarFirmaEd25519(publicKeyPem, c, t_auth, s_hex) {
    try {
        if (!publicKeyPem) return false;
        if (!esHexValido(c) || !esHexValido(t_auth) || !esHexValido(s_hex)) return false;
        if (String(s_hex || '').trim().length !== 128) return false;
        const data = Buffer.from(String(c) + String(t_auth), 'utf8');
        const signature = Buffer.from(String(s_hex || ''), 'hex');
        const keyObj = crypto.createPublicKey(publicKeyPem);
        return crypto.verify(null, data, keyObj, signature) === true;
    } catch {
        return false;
    }
}

function decodificarArchivoLicencia(txt) {
    const raw = String(txt || '').trim();
    if (raw.startsWith('VL0D1:')) {
        const b64 = raw.slice('VL0D1:'.length).trim();
        const json = Buffer.from(b64, 'base64').toString('utf8');
        return JSON.parse(json);
    }
    return JSON.parse(raw);
}

function desencriptarPayloadLicencia(aesKeyHex, paquete) {
    const key = Buffer.from(String(aesKeyHex || ''), 'hex');
    const iv = Buffer.from(String(paquete?.iv || ''), 'hex');
    const tag = Buffer.from(String(paquete?.t_auth || ''), 'hex');
    const ciphertext = Buffer.from(String(paquete?.c || ''), 'hex');

    if (key.length !== 32) {
        throw new Error('llave_aes inválida');
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    return JSON.parse(plaintext);
}

function obtenerRutaLicenciaInvalidaBase() {
    try {
        const base = app.getPath('userData');
        return path.join(base, 'licencia_invalida.odent.inv');
    } catch {
        return path.join(process.cwd(), 'licencia_invalida.odent.inv');
    }
}

function intentarMoverLicenciaInvalida(rutaLicencia, motivo) {
    try {
        if (!rutaLicencia || typeof rutaLicencia !== 'string') return null;
        if (!fs.existsSync(rutaLicencia)) return null;

        const destinoBase = obtenerRutaLicenciaInvalidaBase();
        const destino = obtenerRutaDisponible(destinoBase);
        fs.renameSync(rutaLicencia, destino);

        try {
            fs.writeFileSync(`${destino}.txt`, `Motivo: ${motivo || 'invalida'}\nFecha: ${new Date().toISOString()}\n`, { encoding: 'utf8' });
        } catch {
        }

        return destino;
    } catch {
        return null;
    }
}

function registrarIpcLicencia() {
    ipcMain.handle('licencia:hwid', async () => {
        return obtenerHwidLocal();
    });

    ipcMain.handle('licencia:estado', async () => {
        if (process.env.LICENCIABLE === 'false') {
            return { existe: true, valida: true, ruta: 'bypassed' };
        }
        const ruta = obtenerRutaLicencia();
        try {
            if (!fs.existsSync(ruta)) {
                return { existe: false, valida: false, ruta, motivo: 'Archivo no existe' };
            }

            const raw = fs.readFileSync(ruta);
            const txt = raw.toString('utf8');
            let data;
            try {
                data = decodificarArchivoLicencia(txt);
            } catch {
                const motivo = 'Formato inválido';
                const ruta_invalida = intentarMoverLicenciaInvalida(ruta, motivo);
                return { existe: true, valida: false, ruta, motivo, ruta_invalida };
            }

            if (!data || data.magic !== 'VL0D' || data.v !== 1) {
                const motivo = 'Formato inválido';
                const ruta_invalida = intentarMoverLicenciaInvalida(ruta, motivo);
                return { existe: true, valida: false, ruta, motivo, ruta_invalida };
            }

            if (!safeStorage || !safeStorage.isEncryptionAvailable()) {
                return { existe: true, valida: false, ruta, motivo: 'Cifrado del sistema no disponible' };
            }

            const encB64 = String(data.llave_aes_os_encrypted_b64 || '');
            if (!encB64) {
                const motivo = 'Falta llave cifrada';
                const ruta_invalida = intentarMoverLicenciaInvalida(ruta, motivo);
                return { existe: true, valida: false, ruta, motivo, ruta_invalida };
            }

            const c = String(data.c || '').trim();
            const t_auth = String(data.t_auth || '').trim();
            const iv = String(data.iv || '').trim();
            const s = String(data.s || '').trim();

            if (!c || !t_auth || !iv || !s) {
                const motivo = 'Paquete incompleto';
                const ruta_invalida = intentarMoverLicenciaInvalida(ruta, motivo);
                return { existe: true, valida: false, ruta, motivo, ruta_invalida };
            }

            try {
                const buf = Buffer.from(encB64, 'base64');
                const llave = safeStorage.decryptString(buf);
                if (!llave || typeof llave !== 'string') {
                    return { existe: true, valida: false, ruta, motivo: 'No se pudo descifrar llave' };
                }
                const publicKeyPem = obtenerLlavePublicaEd25519PemCliente() || normalizarLlavePublicaPem(data?.llave_publica_pem);
                if (!publicKeyPem) {
                    return { existe: true, valida: false, ruta, motivo: 'Falta llave pública Ed25519' };
                }

                const firmaOk = verificarFirmaEd25519(publicKeyPem, c, t_auth, s);
                if (firmaOk === false) {
                    const motivo = 'Firma Ed25519 inválida';
                    const ruta_invalida = intentarMoverLicenciaInvalida(ruta, motivo);
                    return { existe: true, valida: false, ruta, motivo, ruta_invalida };
                }

                const payload = desencriptarPayloadLicencia(llave, { c, t_auth, iv, s });
                const hwid = await obtenerHwidLocal();
                const hwidAut = String(payload?.hwid_autorizado || '');
                if (!hwidAut || hwidAut !== hwid) {
                    const motivo = 'HWID no coincide';
                    const ruta_invalida = intentarMoverLicenciaInvalida(ruta, motivo);
                    return { existe: true, valida: false, ruta, motivo, ruta_invalida };
                }

                const exp = payload?.fecha_expiracion;
                if (typeof exp === 'string' && exp.trim()) {
                    const expDate = new Date(exp);
                    if (!Number.isFinite(expDate.getTime())) {
                        const motivo = 'Expiración inválida';
                        const ruta_invalida = intentarMoverLicenciaInvalida(ruta, motivo);
                        return { existe: true, valida: false, ruta, motivo, ruta_invalida };
                    }
                    if (Date.now() > expDate.getTime()) {
                        const motivo = 'Licencia expirada';
                        const ruta_invalida = intentarMoverLicenciaInvalida(ruta, motivo);
                        return { existe: true, valida: false, ruta, motivo, ruta_invalida };
                    }
                }
            } catch {
                const motivo = 'No se pudo descifrar (archivo copiado?)';
                const ruta_invalida = intentarMoverLicenciaInvalida(ruta, motivo);
                return { existe: true, valida: false, ruta, motivo, ruta_invalida };
            }

            return { existe: true, valida: true, ruta };
        } catch {
            return { existe: false, valida: false, ruta, motivo: 'Error al leer licencia' };
        }
    });

    ipcMain.handle('licencia:guardar', async (_event, paquete, opts) => {
        const ruta = obtenerRutaLicencia();
        try {
            if (!safeStorage || !safeStorage.isEncryptionAvailable()) {
                return { ok: false, error: 'Cifrado del sistema no disponible', ruta };
            }

            const llave_aes = String(paquete?.llave_aes || '').trim();
            const c = String(paquete?.c || '').trim();
            const t_auth = String(paquete?.t_auth || '').trim();
            const iv = String(paquete?.iv || '').trim();
            const s = String(paquete?.s || '').trim();

            if (!llave_aes || !c || !t_auth || !iv || !s) {
                return { ok: false, error: 'Paquete incompleto', ruta };
            }

            const enc = safeStorage.encryptString(llave_aes);
            const publicKeyPem = normalizarLlavePublicaPem(opts?.llave_publica_pem);
            const data = {
                v: 1,
                magic: 'VL0D',
                creado_en: new Date().toISOString(),
                llave_aes_os_encrypted_b64: enc.toString('base64'),
                c,
                t_auth,
                iv,
                s,
                llave_publica_pem: publicKeyPem || undefined,
            };

            const dir = path.dirname(ruta);
            try {
                fs.mkdirSync(dir, { recursive: true });
            } catch {
            }

            const payloadB64 = Buffer.from(JSON.stringify(data), 'utf8').toString('base64');
            const contenido = `VL0D1:${payloadB64}`;
            fs.writeFileSync(ruta, contenido, { encoding: 'utf8' });
            return { ok: true, ruta };
        } catch {
            return { ok: false, error: 'No se pudo guardar la licencia', ruta };
        }
    });
}

module.exports = {
    normalizarIdHardware,
    obtenerHwidHardwareV2Win32,
    obtenerHwidLocal,
    obtenerLlavePublicaEd25519PemCliente,
    normalizarLlavePublicaPem,
    esHexValido,
    verificarFirmaEd25519,
    decodificarArchivoLicencia,
    desencriptarPayloadLicencia,
    obtenerRutaLicenciaInvalidaBase,
    intentarMoverLicenciaInvalida,
    registrarIpcLicencia
};
