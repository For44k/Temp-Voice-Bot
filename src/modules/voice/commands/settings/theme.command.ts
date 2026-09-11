import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  resolveColor,
  parseEmoji
} from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { ThemeManager } from "../../../../core/config/theme";
import { Usages } from "../../../../shared/embeds/usages";

export const THEME_PRESETS = [
  {
    hex: "#000000",
    name: "Obsidian Black",
    desc: "Dark & Sleek (#000000)",
    emoji: "<a:anim_col_black:1546842529888997376>",
    id: "black"
  },
  {
    hex: "#00ccdf",
    name: "Neon Cyan",
    desc: "Vibrant Glowing Cyan (#00CCDF)",
    emoji: "<a:anim_col_cyan:1546842531332100176>",
    id: "cyan"
  },
  {
    hex: "#a7a7a7",
    name: "Platinum Silver",
    desc: "Clean Metallic (#A7A7A7)",
    emoji: "<a:anim_col_silver:1546842532749778954>",
    id: "silver"
  },
  {
    hex: "#796bc2",
    name: "Lavender Purple",
    desc: "Deep Mystic Lavender (#796BC2)",
    emoji: "<a:anim_col_purple:1546846101645168641>",
    id: "purple"
  },
  {
    hex: "#fe90e6",
    name: "Pastel Pink",
    desc: "Vibrant Neon Blossom (#FE90E6)",
    emoji: "<a:anim_col_pink:1546846106061901835>",
    id: "pink"
  },
  {
    hex: "#f3ad5e",
    name: "Warm Amber",
    desc: "Sunset Golden Amber (#F3AD5E)",
    emoji: "<a:anim_col_orange:1546846111300452427>",
    id: "orange"
  },
  {
    hex: "#6fd383",
    name: "Emerald Mint",
    desc: "Fresh Neon Emerald (#6FD383)",
    emoji: "<a:anim_col_green:1546846115545219104>",
    id: "green"
  },
  {
    hex: "#ff4d6d",
    name: "Crimson Ruby",
    desc: "Vivid Electric Crimson (#FF4D6D)",
    emoji: "<a:anim_col_ruby:1546847239278690406>",
    id: "ruby"
  },
  {
    hex: "#5865f2",
    name: "Blurple Indigo",
    desc: "Discord Blurple Indigo (#5865F2)",
    emoji: "<a:anim_col_indigo:1546847300826046595>",
    id: "indigo"
  },
  {
    hex: "#ff7a59",
    name: "Coral Sunset",
    desc: "Warm Neon Coral (#FF7A59)",
    emoji: "<a:anim_col_coral:1546847363514245141>",
    id: "coral"
  },
  {
    hex: "#246409",
    name: "Forest Green",
    desc: "Deep Mystic Forest (#246409)",
    emoji: "<a:anim_col_forest:1546848051283497030>",
    id: "forest"
  },
  {
    hex: "#8c8f45",
    name: "Olive Sage",
    desc: "Muted Olive Moss (#8C8F45)",
    emoji: "<a:anim_col_olive:1546848097639075991>",
    id: "olive"
  },
  {
    hex: "#ffffff",
    name: "Pure White",
    desc: "Clean Brilliant Snow (#FFFFFF)",
    emoji: "<a:anim_col_white:1546848148431839255>",
    id: "white"
  },
  {
    hex: "#ff0004",
    name: "Blood Scarlet",
    desc: "Vivid Blood Scarlet (#FF0004)",
    emoji: "<a:anim_col_scarlet:1546916252524609537>",
    id: "scarlet"
  },
  {
    hex: "#a6af27",
    name: "Citrus Olive",
    desc: "Bright Citrus Olive (#A6AF27)",
    emoji: "<a:anim_col_chartreuse:1546916320702890075>",
    id: "chartreuse"
  },
  {
    hex: "#1f5351",
    name: "Deep Teal",
    desc: "Oceanic Deep Teal (#1F5351)",
    emoji: "<a:anim_col_teal:1546916383198154783>",
    id: "teal"
  },
  {
    hex: "#65c75e",
    name: "Neon Lime",
    desc: "Vibrant Neon Lime (#65C75E)",
    emoji: "<a:anim_col_lime:1546916458615800008>",
    id: "lime"
  }
];

export async function buildThemeSelectPayload(guildId: string) {
  const currentColor = (await ThemeManager.getColor(guildId)) || "#a6c9cb";
  const accentColor = resolveColor(currentColor as any);
  const currentPreset = THEME_PRESETS.find((p) => p.hex.toLowerCase() === currentColor.toString().toLowerCase());
  const currentEmoji = currentPreset?.emoji || "<a:anim_sparkle_85:1546687452079722506>";

  const selectOptions = THEME_PRESETS.map((preset) => {
    const opt: any = {
      label: `${preset.name} [ ${preset.hex.toUpperCase()} ]`,
      value: preset.hex,
      description: `✦ ${preset.desc}`,
      default: currentColor.toString().toLowerCase() === preset.hex.toLowerCase()
    };
    const parsed = parseEmoji(preset.emoji);
    if (parsed && parsed.id) {
      opt.emoji = { id: parsed.id, name: parsed.name, animated: parsed.animated || true };
    }
    return opt;
  });

  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("theme:select_color")
      .setPlaceholder("✦ Select an aesthetic theme palette...")
      .setMinValues(1)
      .setMaxValues(1)
      .setOptions(selectOptions)
  );

  const container = new ContainerBuilder();
  if (accentColor) container.setAccentColor(accentColor);

  container
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${currentEmoji} __Server Theme Accent Configuration__`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> ⟢ **__Active Accent Color :__** \`${currentColor.toString().toUpperCase()}\`\n` +
        `> ⟢ **__Selected Preset :__** **${currentPreset ? currentPreset.name : "Custom Hex Color"}**\n` +
        `> ⟢ **__Dynamic Synchronization :__** *All button icons, control panels & system responses instantly match this palette.*`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `✦ ・ **__Choose an aesthetic preset palette below to update your server theme:__**`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addActionRowComponents(selectRow);

  return {
    flags: MessageFlags.IsComponentsV2 as any,
    components: [container] as any
  };
}

export const themeCommand: ICommand = {
  name: "theme",
  prefixAliases: ["theme", "color", "setcolor", "accent"],
  async executePrefix(message, args) {
    const guildId = message.guildId;
    if (!guildId) return;

    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({
        ...(await Usages.impossible(guildId, "**__You must have Administrator permissions to configure server themes :__**")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const hexInput = args[0]?.trim();

    if (hexInput) {
      if (!ThemeManager.isValidHex(hexInput)) {
        await message.reply({
          ...(await Usages.invalidCommand(
            guildId,
            "`.v theme <#hex>`",
            "Example: `.v theme #FF4D6D` or choose from `.v theme` menu"
          )),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const formatted = hexInput.startsWith("#") ? hexInput.toLowerCase() : `#${hexInput.toLowerCase()}`;
      await ThemeManager.setColor(guildId, formatted);

      const successPayload = await Usages.executedAction(
        guildId,
        "Theme Updated",
        `**__Server accent theme has been updated to :__** \`${formatted.toUpperCase()}\``
      );

      await message.reply({
        ...successPayload,
        allowedMentions: { parse: [] }
      });
      return;
    }

    const payload = await buildThemeSelectPayload(guildId);
    await message.reply({
      ...payload,
      allowedMentions: { parse: [] }
    });
  }
};
