import { Schema, model } from "mongoose";

export interface IUserProfile {
  userId: string;
  guildId: string;
  channelsCreated: number;
  hasBannerAccess?: boolean;
  equippedBannerUrl?: string;
}

const UserProfileSchema = new Schema<IUserProfile>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  channelsCreated: { type: Number, default: 0 },
  hasBannerAccess: { type: Boolean, default: false },
  equippedBannerUrl: { type: String }
});

UserProfileSchema.index({ userId: 1, guildId: 1 }, { unique: true });

export const UserProfileModel = model<IUserProfile>("UserProfile", UserProfileSchema);
