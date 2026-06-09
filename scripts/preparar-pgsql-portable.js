const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const pgsqlDir = path.join(raiz, 'build', 'pgsql');

console.log('[prepare:pgsql] Aviso: Estamos usando una instancia de base de datos Postgres preconfigurada.');

if (!fs.existsSync(path.join(pgsqlDir, 'bin', 'postgres.exe'))) {
  console.error('[prepare:pgsql] ERROR: No se encontró la carpeta Postgres preconfigurada en build/pgsql.');
  process.exit(1);
}

console.log('[prepare:pgsql] Carpeta build/pgsql detectada correctamente, continuando con la construcción...');
process.exit(0);

const dataDir = path.join(pgsqlDir, 'data');
const binDir = path.join(pgsqlDir, 'bin');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 1. initdb
const pwFile = path.join(buildDir, 'pg_pass.txt');
fs.writeFileSync(pwFile, 'B4phy_B4lph0m3t', 'utf8');

const initRes = spawnSync(path.join(binDir, 'initdb.exe'), ['-U', 'postgres', '-A', 'password', '-E', 'UTF8', '--pwfile', pwFile, '-D', dataDir], {
  cwd: binDir,
  stdio: 'inherit',
  windowsHide: true,
});

fs.unlinkSync(pwFile);

if (initRes.status !== 0) {
  salirConError('Falló initdb durante la preparación.');
}

// 2. start pg_ctl
console.log('[prepare:pgsql] Iniciando PostgreSQL temporalmente para configuración...');
const logFile = path.join(dataDir, 'logfile');
const startRes = spawnSync(path.join(binDir, 'pg_ctl.exe'), ['-D', dataDir, '-o', '-p 5433', '-l', logFile, '-w', 'start'], {
  cwd: binDir,
  stdio: 'inherit',
  windowsHide: true,
});

if (startRes.status !== 0) {
  salirConError('Falló al iniciar PostgreSQL para configuración.');
}

// 3. create database
console.log('[prepare:pgsql] Creando base de datos db0d3ntnr...');
const createdbRes = spawnSync(path.join(binDir, 'createdb.exe'), ['-U', 'postgres', '-p', '5433', 'db0d3ntnr'], {
  cwd: binDir,
  stdio: 'inherit',
  windowsHide: true,
  env: { ...process.env, PGPASSWORD: 'B4phy_B4lph0m3t' }
});

if (createdbRes.status !== 0) {
  console.warn('[prepare:pgsql] Advertencia: falló createdb o la base ya existe.');
}

// 4. stop pg_ctl
console.log('[prepare:pgsql] Deteniendo PostgreSQL...');
const stopRes = spawnSync(path.join(binDir, 'pg_ctl.exe'), ['-D', dataDir, '-m', 'fast', 'stop'], {
  cwd: binDir,
  stdio: 'inherit',
  windowsHide: true,
});

if (stopRes.status !== 0) {
  salirConError('Falló al detener PostgreSQL.');
}

console.log('[prepare:pgsql] Portable listo y pre-configurado en build/pgsql');

