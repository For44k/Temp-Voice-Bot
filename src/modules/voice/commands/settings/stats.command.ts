import {
  GuildMember,
  VoiceChannel,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  resolveColor,
  Message
} from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";
import { ThemeManager } from "../../../../core/config/theme";
import { V2Payload } from "../../../../shared/types/v2.types";

export async function buildChannelInfoPayload(channel: VoiceChannel, guildId: string): Promise<V2Payload> {
  const session = VoiceMemoryStore.get(channel.id);
  const color = await ThemeManager.getColor(guildId);
  const infoEmoji = Usages.getActionEmoji("info", guildId);

  const ownerId = session ? session.ownerId : channel.guild.ownerId;
  const channelName = channel.name;
  const limitText = channel.userLimit === 0 ? "Unlimited" : channel.userLimit.toString();

  const createdTimestamp = channel.createdTimestamp || Date.now();
  const uptimeSeconds = Math.max(0, Math.floor((Date.now() - createdTimestamp) / 1000));
  const activeForText = Usages.formatDuration(uptimeSeconds);

  const coOwnersCount = session?.coOwners ? session.coOwners.size : 0;
  const isHiddenText = session?.isHidden ? "Yes" : "No";
  const isLockedText = session?.isLocked ? "Yes" : "No";

  const block1 = `- **Owner** : <@${ownerId}>\n- **Name** : ${channelName}\n- **Limit** : \`${limitText}\``;
  const block2 = `- **Active For** : \`${activeForText}\`\n- **Co-Owners** : \`${coOwnersCount}/10\`\n- **Hidden** : \`${isHiddenText}\`\n- **Locked** : \`${isLockedText}\``;
  const block3 = `-# Enjoy For You Channel`;

  const accentColor = color ? resolveColor(color) : null;
  const container = new ContainerBuilder();
  if (accentColor) container.setAccentColor(accentColor);

  container
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## ${infoEmoji} Channel Info`)
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(block1)
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(block2)
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(block3)
    );

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}

export const statsCommand: ICommand = {
  name: "info",
  prefixAliases: ["info", "channelinfo"],
  async executePrefix(message: Message): Promise<void> {
    const member = message.member;
    const channel = member instanceof GuildMember ? (member.voice.channel as VoiceChannel | null) : null;
    const guildId = message.guildId;
    if (!guildId) return;

    if (!channel) {
      await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    const payload = await buildChannelInfoPayload(channel, guildId);
    await message.reply({ ...payload, allowedMentions: { parse: [] } });
  }
};
