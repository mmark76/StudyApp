import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

declare const process: {
  env: Record<string, string | undefined>;
};

function getBuildIdentifier(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Nicosia",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const date = `${values.year}${values.month}${values.day}`;
  const time = `${values.hour}${values.minute}`;
  const version = process.env.npm_package_version ?? "0.0.0";
  const commit = (process.env.GITHUB_SHA ?? process.env.VITE_COMMIT_REF ?? "local").slice(0, 7);

  return `v${version}_${date}_${time}_${commit}`;
}

export default defineConfig({
  base: "/",
  define: {
    __APP_BUILD_ID__: JSON.stringify(getBuildIdentifier()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["study-icon.svg"],
      manifest: {
        name: "Markellos Study App",
        short_name: "Study App",
        description: "A private study space for any subject",
        theme_color: "#172554",
        background_color: "#f8fafc",
        display: "standalone",
        start_url: ".",
        icons: [
          {
            src: "study-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ]
});
