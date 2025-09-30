import { defineConfig, Plugin } from "vite";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  // Prevent Vite from trying to bundle server-only dependencies when pre-bundling the config
  ssr: {
    external: ["node-fetch"],
  },
  optimizeDeps: {
    exclude: ["node-fetch"],
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      // Import server dynamically to avoid database initialization during config
      import("./server/index.ts").then(({ createServer }) => {
        const app = createServer();
        server.middlewares.use(app);
      }).catch(error => {
        console.error('Failed to start server:', error);
      });
    },
  };
}
