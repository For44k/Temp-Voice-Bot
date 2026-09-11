import { Schema, model } from "mongoose";

export interface IGlobalBlacklist {
  targetId: string;
  type: "user" | "server";
  reason?: string;
  addedAt: Date;
}

const GlobalBlacklistSchema = new Schema<IGlobalBlacklist>({
  targetId: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, enum: ["user", "server"] },
  reason: { type: String },
  addedAt: { type: Date, default: Date.now }
});

export const GlobalBlacklistModel = model<IGlobalBlacklist>("GlobalBlacklist", GlobalBlacklistSchema);
