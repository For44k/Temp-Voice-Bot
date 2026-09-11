import { Message } from "discord.js";

export interface ICommand {
  name: string;
  prefixAliases?: string[];
  executePrefix(message: Message, args: string[]): Promise<void>;
}
