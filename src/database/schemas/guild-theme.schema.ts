import { Schema, model } from "mongoose";

export interface IGuildTheme {
  guildId: string;
  embedColor: string;
}

const GuildThemeSchema = new Schema<IGuildTheme>({
  guildId: { type: String, required: true, unique: true },
  embedColor: { type: String, default: "#5865F2" }
});

export const GuildThemeModel = model<IGuildTheme>("GuildTheme", GuildThemeSchema);
