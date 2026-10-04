import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { GuildMemoryStore } from "../../cache/guild.store";
import { Usages } from "../../../../shared/embeds/usages";
import { V2Payload } from "../../../../shared/types/v2.types";

const needHelpCooldowns = new Map<string, number>();

export class NeedHelpService {
  private static readonly COOLDOWN_SECONDS = 15;

  public static checkCooldown(userId: string): { onCooldown: boolean; remainingSeconds: number } {
    const lastUsed = needHelpCooldowns.get(userId);
    if (!lastUsed) return { onCooldown: false, remainingSeconds: 0 };
    const diff = Math.floor((Date.now() - lastUsed) / 1000);
    if (diff < this.COOLDOWN_SECONDS) {
      return { onCooldown: true, remainingSeconds: this.COOLDOWN_SECONDS - diff };
    }
    return { onCooldown: false, remainingSeconds: 0 };
  }

  public static setCooldown(userId: string): void {
    needHelpCooldowns.set(userId, Date.now());
  }

  public static async execute(member: GuildMember, guildId: string): Promise<{ success: boolean; payload: V2Payload }> {
    const cooldown = this.checkCooldown(member.id);
    if (cooldown.onCooldown) {
      const payload = await Usages.cooldownNotice(guildId, `${cooldown.remainingSeconds}s`);
      return { success: false, payload };
    }

    if (!member.voice.channel) {
      const payload = await Usages.notInVoice(guildId);
      return { success: false, payload };
    }

    const config = GuildMemoryStore.resolve(guildId) ?? await GuildMemoryStore.resolveAsync(guildId);
    if (!config?.supportVoiceChannelId) {
      const payload = await Usages.impossible(guildId, "Need Help voice channel has not been configured in setup");
      return { success: false, payload };
    }

    const supportChannel = member.guild.channels.cache.get(config.supportVoiceChannelId) as VoiceChannel | null;
    if (!supportChannel || !supportChannel.isVoiceBased()) {
      const payload = await Usages.impossible(guildId, "Configured Need Help voice channel was not found");
      return { success: false, payload };
    }

    if (member.voice.channelId === supportChannel.id) {
      const payload = await Usages.alreadyAction(guildId, "You are already in the Need Help voice channel");
      return { success: false, payload };
    }

    try {
      await member.voice.setChannel(supportChannel);
      this.setCooldown(member.id);
      const payload = await Usages.executedAction(
        guildId,
        "Need Help",
        `Moved to Need Help channel : <#${supportChannel.id}>`
      );
      return { success: true, payload };
    } catch {
      const payload = await Usages.impossible(guildId, "Could not move you to the Need Help channel");
      return { success: false, payload };
    }
  }
}

export const needhelpCommand: ICommand = {
  name: "needhelp",
  prefixAliases: ["needhelp", "helpme", "supportvc"],
  async executePrefix(message: Message): Promise<void> {
    const member = message.member;
    const guildId = message.guildId;
    if (!member || !guildId) return;

    const result = await NeedHelpService.execute(member, guildId);
    await message.reply({ ...result.payload, allowedMentions: { parse: [] } });
  }
};
