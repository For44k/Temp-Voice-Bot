import { REST, Routes } from "discord.js";
import { ENV } from "../config/env";
import { EmojiItem, EmojiManager } from "../config/emojies";
import { FastLogger } from "../logger/logger";

interface DiscordEmojiItem {
  id: string;
  name: string;
  animated?: boolean;
}

export class EmojiSyncService {
  public static async loadApplicationEmojis(clientToken: string, clientId: string): Promise<void> {
    if (!ENV.AUTO_LOAD_EMOJIS || !clientToken || !clientId) return;
    const rest = new REST({ version: "10" }).setToken(clientToken);
    try {
      const emojiRes = (await rest.get(Routes.applicationEmojis(clientId))) as { items?: DiscordEmojiItem[] } | DiscordEmojiItem[];
      const items: DiscordEmojiItem[] = Array.isArray(emojiRes) ? emojiRes : (emojiRes?.items || []);
      const formatted: EmojiItem[] = items.map((e) => ({
        id: e.id,
        name: e.name,
        animated: Boolean(e.animated)
      }));
      EmojiManager.setDynamicEmojis(formatted);
      FastLogger.info(`Loaded ${formatted.length} application emojis from developer portal into EmojiManager`);
    } catch (err: unknown) {
      FastLogger.warn(`Failed to fetch application emojis: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
