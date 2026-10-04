import { Guild, PermissionFlagsBits } from "discord.js";
import { VoiceMemoryStore } from "../cache/voice.store";
import { BotDeveloperStore } from "../../user/cache/bot-developer.store";

export class VoiceAuthService {
  public static isManager(channelId: string, userId: string): boolean {
    if (BotDeveloperStore.isDeveloper(userId)) return true;
    const session = VoiceMemoryStore.get(channelId);
    if (!session) return false;
    return session.ownerId === userId || session.coOwners.has(userId);
  }

  public static isOwner(channelId: string, userId: string): boolean {
    if (BotDeveloperStore.isDeveloper(userId)) return true;
    const session = VoiceMemoryStore.get(channelId);
    return session?.ownerId === userId;
  }

  public static canManageTarget(channelId: string, actorId: string, targetId: string, guild?: Guild | null): boolean {
    if (BotDeveloperStore.isDeveloper(actorId)) return true;
    if (BotDeveloperStore.isDeveloper(targetId)) return false;

    if (guild) {
      const targetMember = guild.members?.cache?.get(targetId);
      if (targetMember?.permissions?.has(PermissionFlagsBits.Administrator)) {
        return false;
      }
    }

    const session = VoiceMemoryStore.get(channelId);
    if (!session) return false;
    if (targetId === session.ownerId) return false;
    if (actorId === session.ownerId) return true;
    if (session.coOwners.has(actorId)) {
      if (session.coOwners.has(targetId)) return false;
      return true;
    }
    return false;
  }
}
