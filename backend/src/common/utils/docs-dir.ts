import * as path from 'path';

const DEFAULT_DOCS_DIR_NAME = 'docs-0d3nt';
const SERVERLESS_TMP_ROOT = '/tmp';

export function isServerlessEnv(value?: string | null): boolean {
  return String(value || '')
    .trim()
    .toLowerCase() === 'true';
}

function isManagedServerlessRuntime(): boolean {
  return [
    process.env.VERCEL,
    process.env.VERCEL_ENV,
    process.env.AWS_LAMBDA_FUNCTION_NAME,
    process.env.LAMBDA_TASK_ROOT,
  ].some((value) => String(value || '').trim() !== '');
}

export function resolveDocsDir(
  configuredDir?: string | null,
  isServerless?: string | null,
): string {
  const normalizedDir = String(configuredDir || '').trim();
  if (normalizedDir) {
    return path.resolve(normalizedDir);
  }

  if (isServerlessEnv(isServerless) || isManagedServerlessRuntime()) {
    return path.join(SERVERLESS_TMP_ROOT, DEFAULT_DOCS_DIR_NAME);
  }

  return path.resolve(`./${DEFAULT_DOCS_DIR_NAME}`);
}