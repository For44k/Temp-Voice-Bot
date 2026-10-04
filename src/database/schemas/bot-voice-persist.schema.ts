import { Schema, model, Document } from "mongoose";

export interface IBotVoicePersist extends Document {
  botType: "main" | "worker";
  guildId: string;
  channelId: string;
  updatedAt: Date;
}

const BotVoicePersistSchema = new Schema<IBotVoicePersist>(
  {
    botType: { type: String, required: true, unique: true, enum: ["main", "worker"] },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true }
  },
  { timestamps: true }
);

export const BotVoicePersistModel = model<IBotVoicePersist>(
  "BotVoicePersist",
  BotVoicePersistSchema
);
