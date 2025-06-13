import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { type Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    configFile: path.resolve(process.cwd(), "vite.config.ts"),
    server: {
      middlewareMode: true,
      hmr: { 
        server,
        host: '0.0.0.0', // ✅ Allow external HMR connections
        port: 5173
      },
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Skip API routes
      if (url.startsWith('/api') || url.startsWith('/health')) {
        return next();
      }

      // Get the client index.html path
      const clientIndexPath = path.resolve(process.cwd(), "client", "index.html");

      // Check if the file exists
      if (!fs.existsSync(clientIndexPath)) {
        console.error(`Client index.html not found at: ${clientIndexPath}`);
        throw new Error(`Client index.html not found at: ${clientIndexPath}`);
      }

      let template = await fs.promises.readFile(clientIndexPath, "utf-8");
      template = await vite.transformIndexHtml(url, template);

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      console.error('Vite error:', e);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist/public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Make sure to run 'npm run build' first.`,
    );
  }

  app.use(express.static(distPath));

  // Serve index.html for all non-API routes (SPA routing)
  app.use("*", (req, res, next) => {
    // Skip API routes
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) {
      return next();
    }

    res.sendFile(path.resolve(distPath, "index.html"));
  });
}