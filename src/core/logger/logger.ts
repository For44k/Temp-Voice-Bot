import { WebhookLogger } from "./webhook.logger";

export class FastLogger {
  public static info(msg: string): void {
    console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`);
  }

  public static success(msg: string): void {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`);
  }

  public static warn(msg: string): void {
    console.warn(`\x1b[33m[WARN]\x1b[0m ${msg}`);
  }

  public static error(msg: string, err?: unknown): void {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`, err ?? "");
    WebhookLogger.logError(msg, err).catch(() => {});
  }
}
