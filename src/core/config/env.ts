import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  TOKEN: process.env.DISCORD_TOKEN || "",
  CLIENT_ID: process.env.CLIENT_ID || "",
  WORKER_TOKEN: process.env.WORKER_TOKEN || "",
  MONGO_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/onetap",
  WEBHOOK_LOG_URL: process.env.WEBHOOK_LOG_URL || "",
  DEVID: process.env.DEVID || ""
} as const;
