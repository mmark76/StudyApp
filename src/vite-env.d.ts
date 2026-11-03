/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUD_CORE_URL?: string;
  readonly VITE_SUMMARY_MAX_FILE_MB?: string;
  readonly VITE_SUMMARY_MAX_JOB_MB?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_BUILD_ID__: string;
