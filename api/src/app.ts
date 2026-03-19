import cors from "cors";
import express from "express";

import { healthRouter } from "./routes/health.js";
import { itemsRouter } from "./routes/items.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: "*"
    })
  );
  app.use(express.json({ limit: "10mb" }));

  app.use("/health", healthRouter);
  app.use("/api/items", itemsRouter);

  app.use((req, res) => {
    res.status(404).json({
      error: "Not found",
      path: req.path
    });
  });

  return app;
}
