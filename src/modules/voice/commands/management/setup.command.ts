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

export class SetupSessionStore {
  private static sessions: Map<string, { generatorId?: string; categoryId?: string; logsChannelId?: string; rejectChannelId?: string }> = new Map();

  public static get(guildId: string) {
    return this.sessions.get(guildId) || {};
  }

  public static update(guildId: string, partial: { generatorId?: string; categoryId?: string; logsChannelId?: string; rejectChannelId?: string }) {
    const existing = this.get(guildId);
    const updated = { ...existing, ...partial };
    this.sessions.set(guildId, updated);
    return updated;
  }

  public static clear(guildId: string) {
    this.sessions.delete(guildId);
  }
}

export function buildSetupPayload(guildId: string) {
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

  container
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# <a:kawaiiangrykuromi:1546859799034077305> __One Tap Creation..!!__`
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
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

  return {
    flags: MessageFlags.IsComponentsV2 as any,
    components: [container] as any
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
        ...(await Usages.impossible(guildId, "**__You need Administrator permissions to use this :__**")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const payload = buildSetupPayload(guildId);
    await message.reply(payload);
  }
};
