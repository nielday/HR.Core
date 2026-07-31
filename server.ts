import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { app as apiApp } from "./api.ts";
import { downloadDbFromGCS } from "./api/gcsSync.ts";
import { seedAdmin } from "./api/seedAdmin.ts";

async function startServer() {
  const app = express();
  // Railway (và mọi PaaS) CẤP cổng qua biến môi trường, không cho tự chọn. Ghi cứng 3000
  // là container chạy nhưng bên ngoài không vào được, mà log vẫn báo "Server running".
  const PORT = Number(process.env.PORT) || 3000;

  // Sync database from GCS on startup before routing requests
  try {
    await downloadDbFromGCS();
  } catch (err) {
    console.error("[GCS Sync] Failed to download DB from GCS on startup:", err);
  }

  // Sau khi đã đồng bộ db về: nếu chưa có tài khoản nào thì tạo từ ADMIN_USER/ADMIN_PASS.
  seedAdmin();

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
    // Nghe trên 0.0.0.0 = mọi địa chỉ, KHÔNG phải chỉ máy này. In "localhost" cứng làm
    // người deploy tưởng nó chạy nội bộ nên không ra được web. Ưu tiên tên miền thật.
    const domain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PUBLIC_DOMAIN;
    if (domain) console.log(`Server đang chạy: https://${domain}  (cổng ${PORT})`);
    else console.log(`Server đang chạy: http://localhost:${PORT}  (nghe trên 0.0.0.0, máy khác trong mạng vào được)`);
  });
}

startServer();
