import {
  StringSelectMenuInteraction,
  GuildMember,
  VoiceChannel,
  MessageFlags,
  resolveColor,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  ThumbnailBuilder
} from "discord.js";
import { VoiceAuthService } from "../../../modules/voice/services/voice-auth.service";
import { VoiceMemoryStore } from "../../../modules/voice/cache/voice.store";
import { GuildMemoryStore } from "../../../modules/voice/cache/guild.store";
import { Usages } from "../../../shared/embeds/usages";
import { ThemeManager } from "../../config/theme";
import { ActionLogger } from "../../logger/action.logger";
import { FastLogger } from "../../logger/logger";

export class GameSelectHandler {
  private static readonly cooldowns = new Map<string, number>();
  private static readonly COOLDOWN_MS = 15 * 60 * 1000;

  public static async handle(interaction: StringSelectMenuInteraction): Promise<void> {
    const member = interaction.member;
    if (!member || !(member instanceof GuildMember)) return;

    const guildId = interaction.guildId;
    if (!guildId) return;

    const roleId = interaction.values[0];
    if (!roleId) return;

    let channel = member.voice.channel as VoiceChannel | null;
    if (!channel && interaction.channel && interaction.channel.isVoiceBased()) {
      channel = interaction.channel as VoiceChannel;
    }

    if (!channel) {
      const payload = await Usages.notInVoice(guildId);
      await interaction.reply({
        ...payload,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (!session) {
      const payload = await Usages.impossible(guildId, "This is not a managed temporary voice channel");
      await interaction.reply({
        ...payload,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!VoiceAuthService.isOwner(channel.id, member.id)) {
      const payload = await Usages.impossible(guildId, "Only the channel owner can mention game roles");
      await interaction.reply({
        ...payload,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const now = Date.now();
    if (this.cooldowns.size > 200) {
      for (const [key, expires] of this.cooldowns) {
        if (now >= expires) {
          this.cooldowns.delete(key);
        }
      }
    }

    const cooldownExpires = this.cooldowns.get(channel.id);
    if (cooldownExpires && now < cooldownExpires) {
      const remainingTotalSeconds = Math.ceil((cooldownExpires - now) / 1000);
      const minutes = Math.floor(remainingTotalSeconds / 60);
      const seconds = remainingTotalSeconds % 60;
      const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

      const payload = await Usages.impossible(
        guildId,
        `Wait until the game mention cooldown finishes (${timeStr}).`
      );
      await interaction.reply({
        ...payload,
        flags: MessageFlags.Ephemeral
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
    const accentColor = color ? resolveColor(color) : null;

    const container = new ContainerBuilder();
    if (accentColor) container.setAccentColor(accentColor);

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${emojiPrefix}⌇ __Looking For Teammates..!!__`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    const infoContent =
      `> ⟢ <a:pink_Heartjump:1546859773721444382>・ **__Player :__** <@${member.id}>\n` +
      `> ⟢ <a:pink_Heartjump:1546859773721444382>・ **__Game :__** <@&${roleId}> ${gameConfig?.name ? `(\`${gameConfig.name}\`)` : ""}\n` +
      `> ⟢ <a:pink_Heartjump:1546859773721444382>・ **__Room :__** <#${channel.id}>`;

    if (gameImageUrl) {
      const section = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(infoContent))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(gameImageUrl));
      container.addSectionComponents(section);
    } else {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(infoContent));
    }

    container
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`> ✦ ・ **__Click to join the channel and play together!__**`)
      );

    await interaction.deferUpdate().catch(() => {});

    try {
      await channel.permissionOverwrites.edit(roleId, {
        ViewChannel: true
      }).catch((permError: unknown) => {
        FastLogger.warn(`Failed to set ViewChannel on game mention: ${String(permError)}`);
      });

      await channel.send({
        allowedMentions: { roles: [roleId] },
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err: unknown) {
      FastLogger.error("Failed to send game role mention message", err);
    }

    const roleName = interaction.guild?.roles.cache.get(roleId)?.name || roleId;

    ActionLogger.logAction({
      guildId,
      executorId: member.id,
      action: "Game Role Mentioned",
      channelName: channel.name,
      details: `Role: \`@${roleName}\` (${roleId})`
    }).catch((logError: unknown) => {
      FastLogger.warn(`Failed to log game role mention: ${String(logError)}`);
    });
  }
}
