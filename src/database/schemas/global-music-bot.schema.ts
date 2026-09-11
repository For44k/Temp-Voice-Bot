import { Schema, model } from "mongoose";

export interface IGlobalMusicBot {
  botId: string;
  prefix: string;
  addedAt: Date;
}

const GlobalMusicBotSchema = new Schema<IGlobalMusicBot>({
  botId: { type: String, required: true, unique: true, index: true },
  prefix: { type: String, required: true },
  addedAt: { type: Date, default: Date.now }
});

export const GlobalMusicBotModel = model<IGlobalMusicBot>("GlobalMusicBot", GlobalMusicBotSchema);
