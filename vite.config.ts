import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.svg", "favicon.ico"],
      manifest: {
        name: "Spot - Agendamento de Salas",
        short_name: "Spot",
        description: "Sistema de agendamento de salas de reunião da Ponto Forte",
        theme_color: "#2563EB",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "logo.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
