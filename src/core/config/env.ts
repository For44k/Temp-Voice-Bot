import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  TOKEN: process.env.DISCORD_TOKEN || "",
  CLIENT_ID: process.env.CLIENT_ID || "",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/onetap",
  MONGO_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/onetap",
  DEFAULT_PREFIX: process.env.DEFAULT_PREFIX || ".v",
  WEBHOOK_LOG_URL: process.env.WEBHOOK_LOG_URL || "",
  DEVID: process.env.DEVID || "",
  AUTO_LOAD_EMOJIS: process.env.AUTO_LOAD_EMOJIS !== "false"
} as const;
