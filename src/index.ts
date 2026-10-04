import { initDatabase } from "./database/connection";
import { BotGateway } from "./core/gateway/bot.gateway";
import { FastLogger } from "./core/logger/logger";
import { PersistenceWorkerQueue } from "./core/workers/persistence.worker";

async function main(): Promise<void> {
  await initDatabase();
  const bot = new BotGateway();
  await bot.start();
  FastLogger.info("One Tap Voice Manager is active");
}

process.on("SIGINT", async () => {
  await PersistenceWorkerQueue.flush();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await PersistenceWorkerQueue.flush();
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  FastLogger.error("Unhandled Promise Rejection", reason);
});

process.on("uncaughtException", (err) => {
  FastLogger.error("Uncaught Exception — initiating graceful process exit", err);
  process.exit(1);
});

main().catch((err) => {
  FastLogger.error("Fatal error during bootstrap", err);
  process.exit(1);
});
