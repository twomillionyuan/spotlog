import { ensureActivityStore } from "./activity.js";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { migrateDatabase } from "./db.js";
import { ensureStorageBucket } from "./storage.js";
import { initializeStore } from "./store.js";

async function startServer() {
  console.log("Task app startup: running database migrations");
  await migrateDatabase();
  console.log("Task app startup: ensuring storage bucket");
  await ensureStorageBucket();
  console.log("Task app startup: ensuring activity store");
  await ensureActivityStore();
  console.log("Task app startup: initializing seed data");
  await initializeStore();
  console.log("Task app startup: creating express app");

  const app = createApp();

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`Task app API listening on port ${config.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start task app API", error);
  process.exit(1);
});
