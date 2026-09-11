import { Schema, model } from "mongoose";

export interface IGuildGame {
  name: string;
  roleId: string;
  emoji?: string;
}

export interface IGuildConfig {
  guildId: string;
  generatorId: string;
  voiceChannelId?: string;
  categoryId?: string;
  logsChannelId?: string;
  rejectChannelId?: string;
  defaultLimit: number;
  panelImageUrl?: string;
  nameTemplate?: string;
  channelNameTemplate?: string;
  defaultStatus?: string;
  defaultChannelStatus?: string;
  defaultVoiceStatus?: string | null;
  games?: IGuildGame[];
}

const GuildConfigSchema = new Schema<IGuildConfig>({
  guildId: { type: String, required: true, unique: true, index: true },
  generatorId: { type: String, required: true },
  voiceChannelId: { type: String },
  categoryId: { type: String },
  logsChannelId: { type: String },
  rejectChannelId: { type: String },
  defaultLimit: { type: Number, default: 0 },
  panelImageUrl: { type: String },
  nameTemplate: { type: String },
  channelNameTemplate: { type: String },
  defaultStatus: { type: String },
  defaultChannelStatus: { type: String },
  defaultVoiceStatus: { type: String },
  games: [{
    name: { type: String, required: true },
    roleId: { type: String, required: true },
    emoji: { type: String }
  }]
});

GuildConfigSchema.index({ generatorId: 1 });

export const GuildConfigModel = model<IGuildConfig>("GuildConfig", GuildConfigSchema);
