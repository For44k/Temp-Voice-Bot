import mongoose from "mongoose";
import { ENV } from "../core/config/env";
import { FastLogger } from "../core/logger/logger";
import { ActiveVoiceModel } from "./schemas/active-voice.schema";
import { UserPreferencesModel } from "./schemas/user-preferences.schema";
import { GuildConfigModel } from "./schemas/guild-config.schema";
import { UserProfileModel } from "./schemas/user-profile.schema";
import { GlobalBlacklistModel } from "./schemas/global-blacklist.schema";

export async function initDatabase(): Promise<void> {
  try {
    await mongoose.connect(ENV.MONGO_URI, {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      autoIndex: false
    });
    FastLogger.success("Database pool initialized");

    await Promise.allSettled([
      ActiveVoiceModel.syncIndexes(),
      UserPreferencesModel.syncIndexes(),
      GuildConfigModel.syncIndexes(),
      UserProfileModel.syncIndexes(),
      GlobalBlacklistModel.syncIndexes()
    ]);
  } catch (err) {
    FastLogger.error("Database connection failed", err);
    process.exit(1);
  }
}
