import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildVersion = process.env.VITE_BUILD_VERSION || new Date().toISOString().split('T')[0];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@db": path.resolve(__dirname, "db"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist", "public"),
    emptyOutDir: true,
  },
  define: {
    '__BUILD_VERSION__': JSON.stringify(buildVersion),
  },
  optimizeDeps: {
    exclude: ['@react-oauth/google']
  }
});
