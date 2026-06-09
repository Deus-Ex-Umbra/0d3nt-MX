/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_GITHUB_URL: string
  readonly VITE_LICENCIABLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}