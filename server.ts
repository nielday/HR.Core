import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { app as apiApp } from "./api.ts";
import { downloadDbFromGCS } from "./api/gcsSync.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Sync database from GCS on startup before routing requests
  try {
    await downloadDbFromGCS();
  } catch (err) {
    console.error("[GCS Sync] Failed to download DB from GCS on startup:", err);
  }

  app.use(apiApp);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
