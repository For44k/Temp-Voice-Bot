import { Schema, model } from "mongoose";

export interface IActiveVoice {
  channelId: string;
  guildId: string;
  ownerId: string;
  originalOwnerId: string;
  coOwners: string[];
  whitelist: string[];
  isLocked: boolean;
  isTextLocked: boolean;
  isHidden: boolean;
  antiAbuseEnabled?: boolean;
}

const ActiveVoiceSchema = new Schema<IActiveVoice>({
  channelId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  originalOwnerId: { type: String, required: true },
  coOwners: { type: [String], default: [] },
  whitelist: { type: [String], default: [] },
  isLocked: { type: Boolean, default: false },
  isTextLocked: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
  antiAbuseEnabled: { type: Boolean, default: true }
});

ActiveVoiceSchema.index({ guildId: 1, ownerId: 1 });

export const ActiveVoiceModel = model<IActiveVoice>("ActiveVoice", ActiveVoiceSchema);
