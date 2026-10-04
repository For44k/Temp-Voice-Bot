import { Schema, model } from "mongoose";

export interface IUserPreferences {
  userId: string;
  guildId: string;
  blacklist: string[];
  trusted: string[];
  whitelist: string[];
}

const UserPreferencesSchema = new Schema<IUserPreferences>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  blacklist: { type: [String], default: [] },
  trusted: { type: [String], default: [] },
  whitelist: { type: [String], default: [] }
});

UserPreferencesSchema.index({ userId: 1, guildId: 1 }, { unique: true });

export const UserPreferencesModel = model<IUserPreferences>("UserPreferences", UserPreferencesSchema);
