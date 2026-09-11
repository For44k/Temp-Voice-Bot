import { Schema, model } from "mongoose";

export interface IBotDeveloper {
  userId: string;
  addedBy: string;
  addedAt: Date;
}

const BotDeveloperSchema = new Schema<IBotDeveloper>({
  userId: { type: String, required: true, unique: true, index: true },
  addedBy: { type: String, required: true },
  addedAt: { type: Date, default: Date.now }
});

export const BotDeveloperModel = model<IBotDeveloper>("BotDeveloper", BotDeveloperSchema);
