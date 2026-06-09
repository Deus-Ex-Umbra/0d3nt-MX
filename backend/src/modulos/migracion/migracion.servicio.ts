import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { resolveDocsDir } from '../../common/utils/docs-dir';
import { DataSource } from 'typeorm';
import { spawn } from 'child_process';
import archiver from 'archiver';
import { FormatoMigracion } from './dto/iniciar-migracion.dto';
import { MigracionEstadoServicio } from './migracion-estado.servicio';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatearFechaNombreArchivo(d = new Date()): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

function quoteIdent(ident: string): string {
  return `"${String(ident).replace(/"/g, '""')}"`;
}

function escapeStringLiteral(value: string): string {
  return String(value).replace(/'/g, "''");
}

function toPgArrayLiteral(arr: any[]): string {
  const items = arr.map((item) => {
    if (item === null || item === undefined) return 'NULL';
    if (typeof item === 'number') return String(item);
    if (typeof item === 'boolean') return item ? 'true' : 'false';
    const s = String(item).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${s}"`;
  });
  return `{${items.join(',')}}`;
}

function serializePgValue(value: any, dataType?: string, udtName?: string): string {
  if (value === null || value === undefined) return 'NULL';

  if (Buffer.isBuffer(value)) {
    return `'\\x${value.toString('hex')}'::bytea`;
  }

  if (Array.isArray(value)) {
    const lit = toPgArrayLiteral(value);
    return `'${escapeStringLiteral(lit)}'`;
  }

  if (value instanceof Date) {
    return `'${escapeStringLiteral(value.toISOString())}'`;
  }

  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^-?\d+(\.\d+)?$/.test(trimmed) && (dataType === 'bigint' || dataType === 'integer' || dataType === 'numeric' || dataType === 'double precision' || dataType === 'real')) {
      return trimmed;
    }
    return `'${escapeStringLiteral(trimmed)}'`;
  }

  if (typeof value === 'object') {
    const json = JSON.stringify(value);
    if (dataType === 'json' || dataType === 'jsonb') {
      return `'${escapeStringLiteral(json)}'::${dataType}`;
    }
    return `'${escapeStringLiteral(json)}'`;
  }

  return `'${escapeStringLiteral(String(value))}'`;
}

@Injectable()
export class MigracionServicio {
  private readonly logger = new Logger(MigracionServicio.name);

  constructor(
    private readonly config: ConfigService,
    private readonly estado: MigracionEstadoServicio,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async iniciar(formatoPreferido: FormatoMigracion): Promise<void> {
    if (this.estado.estaEnProgreso()) return;

    const formato = (formatoPreferido || 'zip') as FormatoMigracion;
    this.estado.iniciar(formato);

    setImmediate(() => {
      this.ejecutar(formato).catch((e) => {
        this.logger.error('Migración falló', e as any);
        this.estado.finalizarError(e);
      });
    });
  }

  private obtenerDocsDirLocal(): string {
    return resolveDocsDir(
      this.config.get<string>('DOCS_0D3NT_DIR'),
      this.config.get<string>('IS_SERVERLESS'),
    );
  }

  private obtenerDirectorioSalida(): string {
    const outputDir = String(this.config.get<string>('MIGRACION_OUTPUT_DIR') || '').trim();
    if (outputDir) return path.resolve(outputDir);
    const docsDir = this.obtenerDocsDirLocal();
    return path.dirname(docsDir);
  }

  private async contarEntradas(docsDir: string): Promise<number> {
    let count = 0;
    const walk = async (dir: string) => {
      const entries = await fsp.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) await walk(full);
        else if (e.isFile()) count++;
      }
    };
    try {
      await walk(docsDir);
    } catch {
    }
    return Math.max(1, count);
  }

  private async exportarDatosPostgres(sqlPath: string): Promise<void> {
    this.estado.actualizar({ etapa: 'exportando_sql', progreso: 5, mensaje: 'Exportando base de datos…' });

    const tables: Array<{ tablename: string }> = await this.dataSource.query(
      `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`,
    );

    const nombres = tables
      .map((t) => t.tablename)
      .filter((t) => !!t && !t.startsWith('pg_') && t !== 'spatial_ref_sys');

    const out = fs.createWriteStream(sqlPath, { encoding: 'utf8' });
    const write = (s: string) => out.write(s);

    write(`-- 0d3nt export (data-only)\n`);
    write(`-- Generated at: ${new Date().toISOString()}\n`);
    write(`-- NOTE: Schema is expected to exist (TypeORM synchronize on target).\n\n`);
    write('BEGIN;\n');

    if (nombres.length > 0) {
      const trunc = nombres.map((t) => quoteIdent(t)).join(', ');
      write(`TRUNCATE TABLE ${trunc} RESTART IDENTITY CASCADE;\n\n`);
    }

    let tableIndex = 0;
    for (const tableName of nombres) {
      tableIndex++;
      const tableProgress = 5 + Math.floor((tableIndex / Math.max(1, nombres.length)) * 45);
      this.estado.actualizar({
        etapa: 'exportando_sql',
        progreso: tableProgress,
        mensaje: `Exportando tabla ${tableName} (${tableIndex}/${nombres.length})…`,
      });

      const columns: Array<{ column_name: string; data_type: string; udt_name: string }> =
        await this.dataSource.query(
          `SELECT column_name, data_type, udt_name
           FROM information_schema.columns
           WHERE table_schema='public' AND table_name=$1
           ORDER BY ordinal_position`,
          [tableName],
        );

      const colNames = columns.map((c) => c.column_name);
      if (colNames.length === 0) continue;

      const tableQ = quoteIdent(tableName);
      const colsQ = colNames.map(quoteIdent).join(', ');

      const batchSize = 1000;
      let offset = 0;
      while (true) {
        const rows: any[] = await this.dataSource.query(
          `SELECT * FROM ${tableQ} OFFSET $1 LIMIT $2`,
          [offset, batchSize],
        );
        if (!rows || rows.length === 0) break;

        for (const row of rows) {
          const values = colNames.map((cn) => {
            const meta = columns.find((c) => c.column_name === cn);
            return serializePgValue(row[cn], meta?.data_type, meta?.udt_name);
          });
          write(`INSERT INTO ${tableQ} (${colsQ}) VALUES (${values.join(', ')});\n`);
        }

        offset += rows.length;
        if (rows.length < batchSize) break;
      }

      write('\n');
    }

    write('COMMIT;\n');

    await new Promise<void>((resolve, reject) => {
      out.end(() => resolve());
      out.on('error', reject);
    });
  }

  private async crearArchivoConArchiver(
    formato: 'zip' | 'tar.gz',
    outputPath: string,
    docsDir: string,
    sqlPath: string,
  ): Promise<void> {
    await fsp.mkdir(path.dirname(outputPath), { recursive: true });

    const totalEntradas = await this.contarEntradas(docsDir);

    const output = fs.createWriteStream(outputPath);
    const archive =
      formato === 'zip'
        ? archiver('zip', { zlib: { level: 9 } })
        : archiver('tar', { gzip: true, gzipOptions: { level: 9 } });

    archive.on('warning', (err) => {
      this.logger.warn(err);
      this.estado.advertir(String(err?.message || err));
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.on('progress', (p) => {
      const processed = p?.entries?.processed || 0;
      const frac = Math.min(1, processed / totalEntradas);
      const progreso = 50 + Math.floor(frac * 45);
      this.estado.actualizar({
        etapa: 'comprimiendo',
        progreso,
        mensaje: `Comprimiendo archivos… (${processed}/${totalEntradas})`,
      });
    });

    archive.pipe(output);
    archive.directory(docsDir, 'docs-0d3nt');
    archive.file(sqlPath, { name: 'db-0d3nt.sql' });

    await archive.finalize();

    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      output.on('error', reject);
    });
  }

  private async intentarCrearRar(
    outputPath: string,
    docsDir: string,
    sqlPath: string,
  ): Promise<boolean> {
    const rarExe = await this.encontrarRarExeWin32();
    if (!rarExe) return false;
    await fsp.mkdir(path.dirname(outputPath), { recursive: true });
    return new Promise<boolean>((resolve) => {
      const args = ['a', '-r', outputPath, docsDir, sqlPath];
      const child = spawn(rarExe, args, { windowsHide: true });
      child.on('exit', (code) => resolve(code === 0));
      child.on('error', () => resolve(false));
    });
  }

  private async encontrarRarExeWin32(): Promise<string | null> {
    if (process.platform !== 'win32') return null;

    const fromEnv = String(this.config.get<string>('RAR_EXE_PATH') || '').trim();
    if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

    const candidatos = [
      path.join(process.env.ProgramFiles || '', 'WinRAR', 'Rar.exe'),
      path.join(process.env['ProgramFiles(x86)'] || '', 'WinRAR', 'Rar.exe'),
      path.join(process.env.ProgramFiles || '', 'WinRAR', 'rar.exe'),
      path.join(process.env['ProgramFiles(x86)'] || '', 'WinRAR', 'rar.exe'),
    ].filter(Boolean);

    for (const c of candidatos) {
      if (c && fs.existsSync(c)) return c;
    }

    return null;
  }

  private async ejecutar(formatoPreferido: FormatoMigracion): Promise<void> {
    const cloud = this.config.get<string>('CLOUD') === 'true';
    if (cloud) {
      throw new Error('Migración no disponible en modo CLOUD.');
    }

    const docsDir = this.obtenerDocsDirLocal();
    const outDir = this.obtenerDirectorioSalida();

    if (!fs.existsSync(docsDir)) {
      await fsp.mkdir(docsDir, { recursive: true });
    }

    const baseName = `migracion-0d3nt-${formatearFechaNombreArchivo()}`;

    const sqlTempPath = path.join(outDir, `${baseName}.sql`);
    let outputPath = '';
    let formatoUsado: FormatoMigracion = formatoPreferido;

    try {
      await this.exportarDatosPostgres(sqlTempPath);

      this.estado.actualizar({ etapa: 'preparando', progreso: 50, mensaje: 'Preparando compresión…' });

      const intentarZip = async () => {
        formatoUsado = 'zip';
        outputPath = path.join(outDir, `${baseName}.zip`);
        await this.crearArchivoConArchiver('zip', outputPath, docsDir, sqlTempPath);
      };

      if (formatoPreferido === 'rar') {
        outputPath = path.join(outDir, `${baseName}.rar`);
        const ok = await this.intentarCrearRar(outputPath, docsDir, sqlTempPath);
        if (!ok) {
          this.estado.advertir('No se pudo crear .rar (WinRAR/rar.exe no disponible). Se generará .zip.');
          await intentarZip();
        }
      } else if (formatoPreferido === 'tar.gz') {
        try {
          formatoUsado = 'tar.gz';
          outputPath = path.join(outDir, `${baseName}.tar.gz`);
          await this.crearArchivoConArchiver('tar.gz', outputPath, docsDir, sqlTempPath);
        } catch (e) {
          this.estado.advertir('No se pudo crear .tar.gz. Se generará .zip.');
          await intentarZip();
        }
      } else {
        await intentarZip();
      }

      this.estado.actualizar({ etapa: 'finalizando', progreso: 99, mensaje: 'Finalizando…' });
      this.estado.finalizarOk(outputPath, formatoUsado);
    } finally {
      try {
        await fsp.rm(sqlTempPath, { force: true });
      } catch {
      }
    }
  }
}
