import {
  ButtonStyle,
  ContainerBuilder,
  SeparatorBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  StringSelectMenuOptionBuilder,
  resolveColor
} from "discord.js";
import { ThemeManager } from "../../../core/config/theme";

const HELP_BANNER_URL = "https://i.postimg.cc/TPPBHR6c/image.jpg";
const COMMANDS_PER_PAGE = 6;
const PREV_EMOJI = "<a:prev:1546983170048532511>";
const NEXT_EMOJI = "<a:next:1546983173769142392>";
const MAIN_MENU_EMOJI = "<a:kuromisleeping:1546859789223723008>";

const parseEmoji = (emojiStr: string) => {
  if (!emojiStr) return undefined;
  const match = emojiStr.match(/<a?:(\w+):(\d+)>/);
  if (match) {
    return { name: match[1], id: match[2], animated: emojiStr.startsWith("<a:") };
  }
  return emojiStr;
};

export interface CategoryItem {
  name: string;
  usage?: string;
  description: string;
  aliases?: string[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  commands: CategoryItem[];
}

export const _CATEGORIES: Category[] = [
  {
    id: "voice",
    name: "Voice Control",
    description: "Manage and control your active voice room",
    commands: [
      { name: "lock", description: "Lock your voice channel from others" },
      { name: "unlock", description: "Unlock channel to allow everyone" },
      { name: "hide", description: "Make channel invisible to others" },
      { name: "unhide", description: "Make channel visible again" },
      { name: "permit", usage: "@user | ID", description: "Allow user to join locked channel" },
      { name: "reject", usage: "@user | ID", description: "Block & disconnect user from channel" },
      { name: "kick", usage: "@user | ID", description: "Disconnect user from voice channel" },
      { name: "mute", usage: "@user | ID", description: "Server mute user in channel" },
      { name: "unmute", usage: "@user | ID", description: "Server unmute user in channel" },
      { name: "deafen", usage: "@user | ID", description: "Server deafen user in channel" },
      { name: "tlock", description: "Lock text chat for everyone except managers & permitted" },
      { name: "tunlock", description: "Unlock text chat for everyone" },
      { name: "tmute", usage: "@user | ID", description: "Mute text chat for a specific user" },
      { name: "tunmute", usage: "@user | ID", description: "Unmute text chat for a specific user" },
      { name: "limit", usage: "<0-99>", description: "Set member limit for voice room" },
      { name: "name", usage: "<newname>", description: "Change your voice room name" },
      { name: "status", usage: "<status>", description: "Set custom status text for voice channel" },
      { name: "bitrate", usage: "<8-384>", description: "Adjust voice audio bitrate in kbps" },
      { name: "region", usage: "<location>", description: "Change voice server RTC region" },
      { name: "fixlag", description: "Reset voice server region optimization" },
      { name: "info", description: "View detailed room statistics" },
      { name: "panel", description: "Send interactive voice control panel" }
    ]
  },
  {
    id: "ownership",
    name: "Ownership & Managers",
    description: "Room ownership and manager controls",
    commands: [
      { name: "owner", usage: "[@user]", description: "View owner or transfer ownership" },
      { name: "claim", description: "Claim channel if owner has left" },
      { name: "unclaim", description: "Restore ownership to original owner" },
      { name: "man add", usage: "@user | ID", description: "Add a temporary manager (max 3)", aliases: ["cowner add"] },
      { name: "man remove", usage: "@user | ID", description: "Remove a temporary manager", aliases: ["cowner remove"] },
      { name: "man list", description: "List active channel managers", aliases: ["cowner list"] },
      { name: "trusted add", usage: "@user | ID", description: "Save permanent room trusted manager" },
      { name: "trusted remove", usage: "@user | ID", description: "Remove permanent room trusted manager" },
      { name: "trusted list", description: "List your permanent trusted managers" }
    ]
  },
  {
    id: "lists",
    name: "Whitelist & Blacklist",
    description: "Manage channel access and blacklist preferences",
    commands: [
      { name: "wl add", usage: "@user | ID", description: "Add user to auto-permitted whitelist" },
      { name: "wl remove", usage: "@user | ID", description: "Remove user from room whitelist" },
      { name: "wl list", description: "View all whitelisted users" },
      { name: "wl clear", description: "Clear all whitelisted users" },
      { name: "bl add", usage: "@user | ID", description: "Add user to permanent blacklist" },
      { name: "bl remove", usage: "@user | ID", description: "Remove user from permanent blacklist" },
      { name: "bl list", description: "List all users in your blacklist" }
    ]
  },
  {
    id: "shortcuts",
    name: "Custom Aliases",
    description: "Personal command shortcuts accessible by anyone",
    commands: [
      { name: "alias add", usage: "<shortcut> <command>", description: "Create personal shortcut (e.g. .v alias add l lock)" },
      { name: "alias remove", usage: "<shortcut>", description: "Delete personal shortcut" },
      { name: "alias list", description: "List all your personal shortcuts" }
    ]
  },
  {
    id: "management",
    name: "Server Setup & Admin",
    description: "Administrator configuration commands",
    commands: [
      { name: "setup", description: "Open One Tap creation setup interface" },
      { name: "", description: "Customize bot avatar, banner, bio & panel" },
      { name: "join", usage: "@bot <channel_id>", description: "Make bot join voice 24/7 persistently" },
      { name: "theme", usage: "<#hex>", description: "Set server custom accent theme color" },
      { name: "panelimage", usage: "<url|file>", description: "Set custom banner image for panels" },
      { name: "game add", usage: "@role <Name> [emoji]", description: "Add game mention role to select menu" },
      { name: "game remove", usage: "<name>", description: "Remove game from select menu" },
      { name: "game list", description: "List configured server game roles" },
      { name: "music add", usage: "@Bot <prefix>", description: "Register global music bot in server" },
      { name: "music remove", usage: "@Bot | ID", description: "Remove global music bot from registry" },
      { name: "music list", description: "List registered global music bots" },
      { name: "tap", description: "Quickly join creation channel" }
    ]
  }
];

export class HelpBuilder {
  public static async buildHelpPayload(
    guildId: string | null | undefined,
    categoryId: string = "home",
    pageIndex: number = 0,
    prefix: string = ".v "
  ): Promise<any> {
    const isHome = categoryId === "home";
    const category = _CATEGORIES.find((c) => c.id === categoryId);

    const color = await ThemeManager.getColor(guildId);
    const resolvedColor = color ? resolveColor(color) : null;

    const container = new ContainerBuilder();
    if (resolvedColor) container.setAccentColor(resolvedColor);

    const totalCommands = _CATEGORIES.reduce((acc, c) => acc + c.commands.length, 0);
    const totalCategories = _CATEGORIES.length;

    const categoryOptions = [
      new StringSelectMenuOptionBuilder()
        .setLabel("Overview / Home")
        .setValue("home")
        .setDescription("View main bot info and category overview")
        .setDefault(isHome),
      ..._CATEGORIES.map((cat) => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(`${cat.name} (${cat.commands.length})`)
          .setValue(cat.id)
          .setDescription(cat.description.slice(0, 50))
          .setDefault(cat.id === categoryId);
      })
    ];

    if (isHome || !category) {
      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# <a:sparkles:1546983177485029386>  __Welcome to Voice Helper....__`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> ### *__Your premier all-in-one Discord management and interaction solution__*`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(HELP_BANNER_URL)
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**__Select a category from the menu below to explore commands...!!__**`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addActionRowComponents(
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("help:category_select")
              .setPlaceholder("Choose a category to browse...")
              .addOptions(categoryOptions)
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `- **__Prefix:__** \`${prefix.trim()}\` • **__Categories:__** \`${totalCategories}\` • **__Commands:__** \`${totalCommands}\``
          )
        );
    } else {
      const totalPages = Math.ceil(category.commands.length / COMMANDS_PER_PAGE);
      const currentPage = Math.min(Math.max(0, pageIndex), totalPages - 1);
      const start = currentPage * COMMANDS_PER_PAGE;
      const currentCommands = category.commands.slice(start, start + COMMANDS_PER_PAGE);

      const commandsList = currentCommands.map(cmd =>
        `**__\`${prefix}${cmd.name}\`__** ${cmd.usage ? `\`${cmd.usage}\`` : ""}${cmd.aliases?.length ? ` \`(${cmd.aliases.map(a => `${prefix}${a}`).join(", ")})\`` : ""}\n` +
        `> *__${cmd.description || "No description provided."}__*`
      ).join("\n\n");

      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# __${category.name} Commands__\n` +
            `*Page ${currentPage + 1} of ${totalPages} • Total: ${category.commands.length} commands*`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(commandsList)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addActionRowComponents(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`help:page:${category.id}:${currentPage - 1}`)
              .setStyle(ButtonStyle.Secondary)
              .setEmoji(parseEmoji(PREV_EMOJI) as any)
              .setDisabled(currentPage === 0),
            new ButtonBuilder()
              .setCustomId(`help:page:${category.id}:${currentPage + 1}`)
              .setStyle(ButtonStyle.Secondary)
              .setEmoji(parseEmoji(NEXT_EMOJI) as any)
              .setDisabled(currentPage >= totalPages - 1),
            new ButtonBuilder()
              .setCustomId("help:home")
              .setLabel("Main Menu")
              .setStyle(ButtonStyle.Secondary)
              .setEmoji(parseEmoji(MAIN_MENU_EMOJI) as any)
          )
        )
        .addActionRowComponents(
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("help:category_select")
              .setPlaceholder("Switch to another category")
              .addOptions(categoryOptions)
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    }

    return {
      flags: MessageFlags.IsComponentsV2 as unknown as number,
      components: [container] as any
    };
  }

  public static async buildSearchPayload(
    guildId: string | null | undefined,
    query: string,
    prefix: string = ".v "
  ): Promise<any> {
    const searchQuery = query.toLowerCase().trim();
    const color = await ThemeManager.getColor(guildId);
    const resolvedColor = color ? resolveColor(color) : null;

    const allCommands: { catName: string; cmd: CategoryItem }[] = [];
    for (const cat of _CATEGORIES) {
      for (const cmd of cat.commands) {
        if (
          cmd.name.toLowerCase().includes(searchQuery) ||
          cmd.description.toLowerCase().includes(searchQuery)
        ) {
          allCommands.push({ catName: cat.name, cmd });
        }
      }
    }

    const container = new ContainerBuilder();
    if (resolvedColor) container.setAccentColor(resolvedColor);

    if (allCommands.length === 0) {
      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# <a:sadkuromi:1546983181125689374> __No Results Found__\n\n` +
            `> *No commands found matching \`${query}\`*`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`> *Use \`${prefix.trim()}\` for the main menu*`)
        );
    } else {
      const resultsList = allCommands.slice(0, 6).map(({ catName, cmd }) =>
        `**__\`${prefix}${cmd.name}\`__** \`(${catName})\`\n` +
        `> *__${cmd.description || "No description provided."}__*`
      ).join("\n\n");

      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# <a:cyan1:1546983184950894742> __Search Results for "${query}"__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(resultsList)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`> *Use \`${prefix.trim()}\` for the main menu*`)
        );
    }

    return {
      flags: MessageFlags.IsComponentsV2 as unknown as number,
      components: [container] as any
    };
  }
}
