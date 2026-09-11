import {
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  resolveColor
} from "discord.js";
import { ThemeManager } from "../../config/theme";
import { Usages } from "../../../shared/embeds/usages";
import { buildThemeSelectPayload, THEME_PRESETS } from "../../../modules/voice/commands/settings/theme.command";

export class ThemeInteractionHandler {
  public static async handleButton(interaction: ButtonInteraction): Promise<void> {
    const member = interaction.member as any;
    const guildId = interaction.guildId!;

    if (!member?.permissions.has(PermissionFlagsBits.Administrator) && !member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        ...(await Usages.impossible(guildId, "**__You need Administrator or Manage Server permissions to change the theme :__**")),
        flags: MessageFlags.Ephemeral as any
      });
      return;
    }

    const customId = interaction.customId;

    if (customId.startsWith("theme:preset:")) {
      const hex = customId.replace("theme:preset:", "").trim();
      const preset = THEME_PRESETS.find((p) => p.hex.toLowerCase() === hex.toLowerCase());

      await ThemeManager.setColor(guildId, hex);

      const embed = await Usages.executedAction(
        guildId,
        "Theme Updated",
        `**__Server accent theme color has been set to \`${hex.toUpperCase()}\`${preset ? ` (${preset.name})` : ""} :__**`
      );

      const refreshedPayload = await buildThemeSelectPayload(guildId);
      await interaction.update({
        ...refreshedPayload
      }).catch(async () => {
        await interaction.reply({ ...embed, flags: MessageFlags.Ephemeral as any });
      });
      return;
    }

    if (customId === "theme:custom_hex") {
      const modal = new ModalBuilder()
        .setCustomId("theme:custom_hex_modal")
        .setTitle("Set Custom Theme Color")
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("hex_input")
              .setLabel("Hex Color Code (#000000 - #FFFFFF)")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("#00CCDF or #3949FF")
              .setMinLength(3)
              .setMaxLength(7)
              .setRequired(true)
          )
        );

      await interaction.showModal(modal);
      return;
    }
  }

  public static async handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
    const member = interaction.member as any;
    const guildId = interaction.guildId!;

    if (!member?.permissions.has(PermissionFlagsBits.Administrator) && !member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        ...(await Usages.impossible(guildId, "**__You need Administrator or Manage Server permissions to change the theme :__**")),
        flags: MessageFlags.Ephemeral as any
      });
      return;
    }

    if (interaction.customId === "theme:select_color") {
      const selectedHex = interaction.values[0];
      const oldColor = (await ThemeManager.getColor(guildId)) || "#a6c9cb";
      const oldPreset = THEME_PRESETS.find((p) => p.hex.toLowerCase() === oldColor.toString().toLowerCase());
      const preset = THEME_PRESETS.find((p) => p.hex.toLowerCase() === selectedHex.toLowerCase());
      const emojiOfColor = preset?.emoji || "<a:anim_sparkle_85:1546687452079722506>";
      const oldEmoji = oldPreset?.emoji || "<a:anim_sparkle_85:1546687452079722506>";

      await ThemeManager.setColor(guildId, selectedHex);

      const accentColor = resolveColor(selectedHex as any);
      const container = new ContainerBuilder()
        .setAccentColor(accentColor)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${emojiOfColor} ⌇ __System Color Updated..!!__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> ⟢ ${oldEmoji}・ **__Old Color :__** \`${oldColor.toString().toUpperCase()}\` *(${oldPreset?.name || "Previous"})\*\n> ⟢ ${emojiOfColor}・ **__New Color :__** \`${selectedHex.toUpperCase()}\` *(${preset?.name || "Active"})\*`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> ✦ ・ **__All voice panel interfaces and control button animations have synchronized to \`${preset?.name || selectedHex.toUpperCase()}\`!__**`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      await interaction.update({
        flags: MessageFlags.IsComponentsV2 as any,
        components: [container] as any
      }).catch(() => {});
      return;
    }
  }

  public static async handleModal(interaction: ModalSubmitInteraction): Promise<void> {
    const member = interaction.member as any;
    const guildId = interaction.guildId!;

    if (!member?.permissions.has(PermissionFlagsBits.Administrator) && !member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        ...(await Usages.impossible(guildId, "**__You need Administrator or Manage Server permissions to change the theme :__**")),
        flags: MessageFlags.Ephemeral as any
      });
      return;
    }

    if (interaction.customId === "theme:custom_hex_modal") {
      const rawHex = interaction.fields.getTextInputValue("hex_input").trim();

      if (!ThemeManager.isValidHex(rawHex)) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "**__Invalid hex color format. Please enter a valid hex code (e.g. #00CCDF) :__**")),
          flags: MessageFlags.Ephemeral as any
        });
        return;
      }

      const formatted = rawHex.startsWith("#") ? rawHex : `#${rawHex}`;
      const oldColor = (await ThemeManager.getColor(guildId)) || "#a6c9cb";
      const oldPreset = THEME_PRESETS.find((p) => p.hex.toLowerCase() === oldColor.toString().toLowerCase());
      const preset = THEME_PRESETS.find((p) => p.hex.toLowerCase() === formatted.toLowerCase());
      const emojiOfColor = preset?.emoji || "<a:anim_sparkle_85:1546687452079722506>";
      const oldEmoji = oldPreset?.emoji || "<a:anim_sparkle_85:1546687452079722506>";

      await ThemeManager.setColor(guildId, formatted);

      const accentColor = resolveColor(formatted as any);
      const container = new ContainerBuilder()
        .setAccentColor(accentColor)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${emojiOfColor} ⌇ __System Color Updated..!!__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> ⟢ ${oldEmoji}・ **__Old Color :__** \`${oldColor.toString().toUpperCase()}\` *(${oldPreset?.name || "Previous"})\*\n> ⟢ ${emojiOfColor}・ **__New Color :__** \`${formatted.toUpperCase()}\` *(${preset?.name || "Active"})\*`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> ✦ ・ **__All voice panel interfaces and control button animations have synchronized to \`${preset?.name || formatted.toUpperCase()}\`!__**`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 as any,
        components: [container] as any
      }).catch(() => {});
      return;
    }
  }
}
