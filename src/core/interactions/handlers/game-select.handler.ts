import {
  StringSelectMenuInteraction,
  GuildMember,
  VoiceChannel,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  resolveColor
} from "discord.js";
import { VoiceLifecycleService } from "../../../modules/voice/services/voice-lifecycle.service";
import { VoiceMemoryStore } from "../../../modules/voice/cache/voice.store";
import { GuildMemoryStore } from "../../../modules/voice/cache/guild.store";
import { Usages } from "../../../shared/embeds/usages";
import { ThemeManager } from "../../config/theme";
import { ActionLogger } from "../../logger/action.logger";
import { FastLogger } from "../../logger/logger";

export class GameSelectHandler {

  private static cooldowns: Map<string, number> = new Map();
  private static readonly COOLDOWN_MS = 15 * 60 * 1000;

  public static async handle(interaction: StringSelectMenuInteraction): Promise<void> {
    const member = interaction.member as GuildMember;
    const guildId = interaction.guildId!;
    const roleId = interaction.values[0];

    let channel = member?.voice?.channel as VoiceChannel | null;
    if (!channel && interaction.channel && interaction.channel.isVoiceBased()) {
      channel = interaction.channel as VoiceChannel;
    }

    if (!channel) {
      const payload = await Usages.notInVoice(guildId);
      await interaction.reply({
        ...payload,
        flags: (payload.flags | MessageFlags.Ephemeral) as any
      });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (!session) {
      const payload = await Usages.impossible(guildId, "**__This is not a managed temporary voice channel :__**");
      await interaction.reply({
        ...payload,
        flags: (payload.flags | MessageFlags.Ephemeral) as any
      });
      return;
    }

    if (!VoiceLifecycleService.isOwner(channel.id, member.id)) {
      const payload = await Usages.impossible(guildId, "**__Only the channel owner can mention game roles :__**");
      await interaction.reply({
        ...payload,
        flags: (payload.flags | MessageFlags.Ephemeral) as any
      });
      return;
    }

    const now = Date.now();
    const cooldownExpires = this.cooldowns.get(channel.id);

    if (cooldownExpires && now < cooldownExpires) {
      const remainingTotalSeconds = Math.ceil((cooldownExpires - now) / 1000);
      const minutes = Math.floor(remainingTotalSeconds / 60);
      const seconds = remainingTotalSeconds % 60;
      const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

      const payload = await Usages.impossible(
        guildId,
        `Wait until game mention cooldown finishes \`(${timeStr})\``
      );
      await interaction.reply({
        ...payload,
        flags: (payload.flags | MessageFlags.Ephemeral) as any
      });
      return;
    }

    this.cooldowns.set(channel.id, now + this.COOLDOWN_MS);

    const config = await GuildMemoryStore.resolve(guildId);
    const gameConfig = config?.games?.find((g) => g.roleId === roleId);
    const emojiPrefix = gameConfig?.emoji ? `${gameConfig.emoji} ` : "🎮 ";
    let gameImageUrl: string | null = null;
    if (gameConfig?.emoji) {
      const customEmojiMatch = gameConfig.emoji.match(/<a?:[a-zA-Z0-9_]+:(\d+)>/);
      if (customEmojiMatch && customEmojiMatch[1]) {
        const emojiId = customEmojiMatch[1];
        const isAnimated = gameConfig.emoji.startsWith("<a:");
        gameImageUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? "gif" : "png"}?size=256&quality=lossless`;
      }
    }

    if (!gameImageUrl) {
      const roleObj = interaction.guild?.roles.cache.get(roleId);
      if (roleObj?.iconURL()) {
        gameImageUrl = roleObj.iconURL({ size: 256 }) || null;
      }
    }

    const color = await ThemeManager.getColor(guildId);
    
    const titleText = {
      type: 10, // TextDisplay
      content: `# ${emojiPrefix}⌇ __Looking For Teammates..!!__`
    };

    const separator = {
      type: 14, // Separator
      divider: true
    };

    const infoText = {
      type: 10, // TextDisplay
      content:
        `> ⟢ <a:pink_Heartjump:1546859773721444382>・ **__Player :__** <@${member.id}>\n` +
        `> ⟢ <a:pink_Heartjump:1546859773721444382>・ **__Game :__** <@&${roleId}> ${gameConfig?.name ? `(\`${gameConfig.name}\`)` : ""}\n` +
        `> ⟢ <a:pink_Heartjump:1546859773721444382>・ **__Room :__** <#${channel.id}>`
    };

    const callToActionText = {
      type: 10, // TextDisplay
      content: `> ✦ ・ **__Click to join the channel and play together!__**`
    };

    let sectionOrInfo: any = infoText;
    if (gameImageUrl) {
      sectionOrInfo = {
        type: 9, // Section
        components: [infoText],
        accessory: {
          type: 11, // Thumbnail
          media: {
            url: gameImageUrl
          }
        }
      };
    }

    const containerJson: any = {
      type: 17, // Container
      components: [
        titleText,
        separator,
        sectionOrInfo,
        separator,
        callToActionText
      ]
    };

    if (color) {
      containerJson.accent_color = resolveColor(color);
    }

    await interaction.deferUpdate().catch(() => { });

    try {
      await channel.permissionOverwrites.edit(roleId, {
        ViewChannel: true
      }).catch(() => { });

      await channel.send({
        allowedMentions: { roles: [roleId] },
        flags: MessageFlags.IsComponentsV2 as any,
        components: [containerJson] as any
      });
    } catch (err) {
      FastLogger.error("Failed to send game role mention message", err);
    }

    const roleName = interaction.guild?.roles.cache.get(roleId)?.name || roleId;

    ActionLogger.logAction({
      guildId,
      executorId: member.id,
      action: "Game Role Mentioned",
      channelName: channel.name,
      details: `Role: \`@${roleName}\` (${roleId})`
    }).catch(() => { });
  }
}
