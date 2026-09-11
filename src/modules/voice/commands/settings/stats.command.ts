import { GuildMember, VoiceChannel, ContainerBuilder, SeparatorBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags, resolveColor } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";
import { ThemeManager } from "../../../../core/config/theme";

export async function buildChannelInfoPayload(channel: VoiceChannel, guildId: string): Promise<any> {
  const session = VoiceMemoryStore.get(channel.id);
  const color = await ThemeManager.getColor(guildId);

  const ownerId = session ? session.ownerId : channel.guild.ownerId;
  const ownerMember = await channel.guild.members.fetch(ownerId).catch(() => null);
  let ownerUser = ownerMember?.user;
  if (!ownerUser) {
    ownerUser = await channel.client.users.fetch(ownerId).catch(() => null) ?? undefined;
  }

  let bannerUrl: string | null = null;
  if (ownerUser) {
    try {
      const fullUser = await channel.client.users.fetch(ownerId, { force: true });
      bannerUrl = fullUser.bannerURL({ size: 1024 }) || null;
    } catch { }
  }

  const managersList = session && session.coOwners.size > 0
    ? Array.from(session.coOwners).map((id) => `<@${id}>`).join(" ")
    : "`None`";

  const isLockedText = session?.isLocked ? "`Yes`" : "`No`";
  const isHiddenText = session?.isHidden ? "`Yes`" : "`No`";

  let permittedCount = 0;
  let rejectedCount = 0;

  for (const overwrite of channel.permissionOverwrites.cache.values()) {
    if (overwrite.id === channel.guild.roles.everyone.id) continue;

    if (overwrite.type === 1) {
      if (overwrite.allow.has("Connect")) {
        permittedCount++;
      } else if (overwrite.deny.has("Connect")) {
        rejectedCount++;
      }
    }
  }

  const accentColor = color ? resolveColor(color) : null;
  const container = new ContainerBuilder();
  if (accentColor) container.setAccentColor(accentColor);

  container
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# <a:cuteghost:1546983190978101398> __Channel Informations__`)
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

  if (bannerUrl) {
    container
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(bannerUrl)
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  }

  const contentText =
    `> - __Channel Name :__ \`${channel.name}\`\n` +
    `> - __Room Owner :__ <@${ownerId}>\n` +
    `> - __Managers :__ ${managersList}\n` +
    `> - __Members :__ \`${channel.members.size}/${channel.userLimit || "∞"}\`\n` +
    `> - __Locked :__ ${isLockedText}\n` +
    `> - __Hidden :__ ${isHiddenText}\n` +
    `> - __Rejected :__ \`${rejectedCount}\`\n` +
    `> - __Permited :__ \`${permittedCount}\`\n` +
    `> ### - **__Click Button to see All Membres In channel__**`;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_see_members:${channel.id}`)
      .setLabel("See Membres")
      .setStyle(ButtonStyle.Secondary)
  );

  container
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(contentText))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addActionRowComponents(row);

  return {
    flags: MessageFlags.IsComponentsV2 as any,
    components: [container] as any
  };
}

export const statsCommand: ICommand = {
  name: "info",
  prefixAliases: ["info", "channelinfo"],
  async executePrefix(message: any): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    if (!channel) {
      await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    const payload = await buildChannelInfoPayload(channel, guildId!);
    await message.reply({ ...payload, allowedMentions: { parse: [] } });
  }
};
