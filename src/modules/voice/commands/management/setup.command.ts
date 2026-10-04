import {
  Message,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  MessageFlags,
  resolveColor
} from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { Usages } from "../../../../shared/embeds/usages";
import { ThemeManager } from "../../../../core/config/theme";
import { GuildMemoryStore } from "../../cache/guild.store";
import { V2Payload } from "../../../../shared/types/v2.types";

export class SetupSessionStore {
  private static readonly sessions = new Map<string, { generatorId?: string; categoryId?: string; logsChannelId?: string; rejectChannelId?: string; supportVoiceChannelId?: string; ticketTextChannelId?: string }>();

  public static get(guildId: string): { generatorId?: string; categoryId?: string; logsChannelId?: string; rejectChannelId?: string; supportVoiceChannelId?: string; ticketTextChannelId?: string } {
    return this.sessions.get(guildId) || {};
  }

  public static update(guildId: string, partial: { generatorId?: string; categoryId?: string; logsChannelId?: string; rejectChannelId?: string; supportVoiceChannelId?: string; ticketTextChannelId?: string }): { generatorId?: string; categoryId?: string; logsChannelId?: string; rejectChannelId?: string; supportVoiceChannelId?: string; ticketTextChannelId?: string } {
    const existing = this.get(guildId);
    const updated = { ...existing, ...partial };
    this.sessions.set(guildId, updated);
    return updated;
  }

  public static clear(guildId: string): void {
    this.sessions.delete(guildId);
  }
}

export function buildSetupPayload(guildId: string): V2Payload {
  const color = ThemeManager.getColorSync(guildId);
  const resolvedColor = color ? resolveColor(color) : null;

  const container = new ContainerBuilder();
  if (resolvedColor) container.setAccentColor(resolvedColor);

  const setupBtnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("setup_modal:channels")
      .setLabel("Setup")
      .setStyle(ButtonStyle.Secondary)
  );

  const supportBtnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("setup_modal:support_channels")
      .setLabel("Support")
      .setStyle(ButtonStyle.Secondary)
  );

  const nameBtnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("setup_modal:nameplate")
      .setLabel("Name")
      .setStyle(ButtonStyle.Secondary)
  );

  const statusBtnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("setup_modal:status")
      .setLabel("Status")
      .setStyle(ButtonStyle.Secondary)
  );

  const themeBtnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("setup_btn:theme")
      .setLabel("Theme")
      .setStyle(ButtonStyle.Secondary)
  );

  const config = GuildMemoryStore.resolve(guildId);
  const isTwoPanels = config?.twoPanelsEnabled ?? false;
  const panelsBtnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("setup_btn:toggle_panels")
      .setLabel(isTwoPanels ? "Two Panels: ON" : "Two Panels: OFF")
      .setStyle(isTwoPanels ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );

  container
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## <a:anim_info_cb:1546639682924712037> One Tap Creation`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> - **__To Setup One Tap Click The Button__**`
      )
    )
    .addActionRowComponents(setupBtnRow)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> - **__Set Ticket and Need Help Channels__**`
      )
    )
    .addActionRowComponents(supportBtnRow)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> - **__Setup Creation NamePlate__**`
      )
    )
    .addActionRowComponents(nameBtnRow)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> - **__Make a Custom Status In User Vc__**`
      )
    )
    .addActionRowComponents(statusBtnRow)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> - **__Select Bot Theme & Accent__**`
      )
    )
    .addActionRowComponents(themeBtnRow)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> - **__Toggle Secondary Music & Activities Panel__**`
      )
    )
    .addActionRowComponents(panelsBtnRow)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}

export const setupCommand: ICommand = {
  name: "setup",
  prefixAliases: ["setup"],
  async executePrefix(message: Message, _args: string[]): Promise<void> {
    const guildId = message.guildId;
    if (!guildId) return;

    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({
        ...(await Usages.impossible(guildId, "You need Administrator permissions to use this")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const payload = buildSetupPayload(guildId);
    await message.reply(payload);
  }
};
