import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), tsconfigPaths(), tanstackStart(), nitro()],
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    exclude: [
      "@tanstack/start-server-core",
      "@tanstack/react-start",
      "@tanstack/react-router",
      "@tanstack/start-plugin-core",
    ],
  },
  server: {
    host: true,
    port: 5000,
    allowedHosts: ["localhost", ".replit.dev", ".repl.co"],
  },
});
