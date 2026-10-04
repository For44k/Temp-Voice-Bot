import { Schema, model } from "mongoose";

export interface IUserAlias {
  userId: string;
  guildId: string;
  aliases: Map<string, string>;
}

const UserAliasSchema = new Schema<IUserAlias>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  aliases: { type: Map, of: String, default: () => new Map() }
});

UserAliasSchema.index({ userId: 1, guildId: 1 }, { unique: true });

export const UserAliasModel = model<IUserAlias>("UserAlias", UserAliasSchema);
