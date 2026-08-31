/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUD_CORE_URL?: string;
  readonly VITE_GA4_MEASUREMENT_ID?: string;
  readonly VITE_PLAUSIBLE_SCRIPT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_BUILD_ID__: string;
