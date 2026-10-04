import mongoose from "mongoose";
import { ENV } from "../core/config/env";
import { FastLogger } from "../core/logger/logger";
import { ActiveVoiceModel } from "./schemas/active-voice.schema";
import { UserPreferencesModel } from "./schemas/user-preferences.schema";
import { GuildConfigModel } from "./schemas/guild-config.schema";
import { UserProfileModel } from "./schemas/user-profile.schema";
import { GlobalBlacklistModel } from "./schemas/global-blacklist.schema";
import { BotVoicePersistModel } from "./schemas/bot-voice-persist.schema";
import { BotDeveloperModel } from "./schemas/bot-developer.schema";
import { GlobalMusicBotModel } from "./schemas/global-music-bot.schema";
import { GuildThemeModel } from "./schemas/guild-theme.schema";
import { UserAliasModel } from "./schemas/user-alias.schema";

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
      GlobalBlacklistModel.syncIndexes(),
      BotVoicePersistModel.syncIndexes(),
      BotDeveloperModel.syncIndexes(),
      GlobalMusicBotModel.syncIndexes(),
      GuildThemeModel.syncIndexes(),
      UserAliasModel.syncIndexes()
    ]);
  } catch (err) {
    FastLogger.error("Database connection failed", err);
    process.exit(1);
  }
}
