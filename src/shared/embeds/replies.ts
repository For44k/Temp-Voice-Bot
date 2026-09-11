import {
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  MessageFlags,
  resolveColor
} from "discord.js";
import { ThemeManager } from "../../core/config/theme";
import { Usages, V2Payload, createMultiContainer } from "./usages";

export class Replies {
  private static async build(guildId: string | null | undefined, title: string, content?: string): Promise<V2Payload> {
    const col = ThemeManager.getColorSync(guildId);
    let accentHex: string | null = null;
    if (typeof col === "string" && col.startsWith("#")) accentHex = col;
    else if (typeof col === "number") accentHex = `#${col.toString(16).padStart(6, "0")}`;

    const parts = content ? [title, content] : [title];
    const container = createMultiContainer(parts, accentHex);
    return {
      flags: MessageFlags.IsComponentsV2 as unknown as number,
      components: [container],
      allowedMentions: { parse: [] }
    };
  }

  public static async create(guildId: string | null | undefined, title: string, description?: string): Promise<V2Payload> {
    const header = `# <a:pink_Heartjump:1546859773721444382> __${title}__`;
    const body = description ? `- <a:pink_Heartjump:1546859773721444382> __${description}__` : undefined;
    return this.build(guildId, header, body);
  }

  public static async error(guildId: string | null | undefined, title: string, description?: string): Promise<V2Payload> {
    const header = `# <a:gh1y1ne:1546859779333292103> __${title}__`;
    const body = description ? `- <a:pink_Heartjump:1546859773721444382> __${description}__` : undefined;
    return this.build(guildId, header, body);
  }

  public static async success(guildId: string | null | undefined, title: string, description?: string): Promise<V2Payload> {
    const header = `# ⌇ <a:pink_Heartjump:1546859773721444382> ⌇ __System Executed__`;
    const body = description ? `- <a:pink_Heartjump:1546859773721444382> __${description}__` : undefined;
    return this.build(guildId, header, body);
  }

  public static async notInVoice(guildId?: string | null): Promise<V2Payload> {
    return Usages.notInVoice(guildId);
  }

  public static async notAuthorized(guildId?: string | null): Promise<V2Payload> {
    return Usages.notManagerOrOwner(guildId);
  }

  public static async notOwner(guildId?: string | null): Promise<V2Payload> {
    return Usages.impossible(guildId, "Only the channel owner can perform this action");
  }
}

export * from "./usages";
