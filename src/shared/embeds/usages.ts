import {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageMentionOptions,
  MessageMentionTypes
} from "discord.js";
import { ThemeManager } from "../../core/config/theme";
import { THEME_PRESETS } from "../../modules/voice/commands/settings/theme.command";
import { EmojiManager, ACTION_EMOJIS } from "../../core/config/emojies";

import { V2Payload } from "../types/v2.types";
export { V2Payload };

const getLocalRGB = (color: string | number | [number, number, number] | null | undefined): [number, number, number] => {
  if (typeof color === "number") {
    return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
  }
  if (Array.isArray(color) && color.length === 3) {
    return color;
  }
  if (!color || typeof color !== "string") return [0, 0, 0];
  const cleanHex = color.replace("#", "");
  return [
    parseInt(cleanHex.substring(0, 2), 16) || 0,
    parseInt(cleanHex.substring(2, 4), 16) || 0,
    parseInt(cleanHex.substring(4, 6), 16) || 0
  ];
};

const getAccentColorInt = (color: string | number | [number, number, number] | null | undefined): number => {
  const [r, g, b] = getLocalRGB(color);
  return (r << 16) + (g << 8) + b;
};

const stripMarkdownDecorators = (str: string) => {
  if (typeof str !== "string") return str;
  return str
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .trim();
};

const isMentionToken = (token: string) =>
  /^<@!?\d+>$|^<@&\d+>$|^<#\d+>$/.test(token);

const mentionSafeToken = (token: string) => {
  const clean = stripMarkdownDecorators(token);
  if (isMentionToken(clean)) return clean;
  return `\`${clean}\``;
};

const formatUsageLine = (str: string) => {
  if (typeof str !== "string") return str;
  const tokens = str.split(/\s+/).filter(Boolean).filter((t) => t !== "|");
  return tokens.map((t) => mentionSafeToken(t)).join(" ");
};

export const createMultiContainer = (parts: string[], accentColorHex?: string | null) => {
  const builder = new ContainerBuilder();
  if (accentColorHex) {
    builder.setAccentColor(getAccentColorInt(accentColorHex));
  }

  parts.forEach((part, index) => {
    builder.addTextDisplayComponents(new TextDisplayBuilder().setContent(part));
    if (index < parts.length - 1) {
      builder.addSeparatorComponents(new SeparatorBuilder());
    }
  });

  return builder.toJSON();
};



const COMMAND_DESCRIPTIONS: Record<string, string> = {
  reject: "Deny permission to join channel",
  block: "Deny permission to join channel",
  permit: "Allow permission to join channel",
  perm: "Allow permission to join channel",
  lock: "Lock the voice channel",
  unlock: "Unlock the voice channel",
  hide: "Hide the voice channel",
  unhide: "Unhide the voice channel",
  mute: "Server mute members in voice channel",
  vmute: "Server mute members in voice channel",
  unmute: "Server unmute members in voice channel",
  vunmute: "Server unmute members in voice channel",
  deafen: "Server deafen members in voice channel",
  deaf: "Server deafen members in voice channel",
  undeafen: "Server undeafen members in voice channel",
  undeaf: "Server undeafen members in voice channel",
  kick: "Disconnect members from voice channel",
  kkick: "Disconnect members from voice channel",
  dc: "Disconnect members from voice channel",
  name: "Rename the voice channel",
  rename: "Rename the voice channel",
  limit: "Set member limit for voice channel",
  status: "Set custom status for voice channel",
  vstatus: "Set custom status for voice channel",
  setstatus: "Set custom status for voice channel",
  tmute: "Mute members from sending text messages",
  tunmute: "Unmute members in text chat",
  tlock: "Lock text chat in voice channel",
  tunlock: "Unlock text chat in voice channel",
  cowner: "Manage co-owners/managers for voice channel",
  coowner: "Manage co-owners/managers for voice channel",
  manager: "Manage co-owners/managers for voice channel",
  man: "Manage co-owners/managers for voice channel",
  whitelist: "Manage channel whitelist",
  wl: "Manage channel whitelist",
  owner: "Transfer channel ownership",
  transfer: "Transfer channel ownership",
  claim: "Claim ownership of voice channel",
  unclaim: "Relinquish channel ownership",
  ab: "Toggle anti abuse system",
  antiabuse: "Toggle anti abuse system",
  fixlag: "Reset voice channel region to resolve lag",
  bitrate: "Adjust voice channel bitrate",
  region: "Change voice channel RTC region"
};

const NO_PARSE_MENTIONS: MessageMentionOptions = { parse: [] as MessageMentionTypes[] };

export class Usages {
  public static sanitize(text: string): string {
    return text.replace(/@everyone/gi, "@\u200beveryone").replace(/@here/gi, "@\u200bhere");
  }

  public static isValidChannelName(name: string): boolean {
    if (!name || typeof name !== "string") return false;
    const stripped = name.trim();
    if (stripped.length === 0 || stripped.length > 100) return false;
    const withoutMarks = stripped.replace(/[\p{M}\p{C}\p{Z}\u2800\u3164\uFFA0\u180E]/gu, "");
    if (withoutMarks.length === 0) return false;
    const marksCount = (stripped.match(/\p{M}/gu) || []).length;
    if (marksCount > 10) return false;
    return true;
  }

  private static resolveAccent(guildId?: string | null): string | null {
    const col = ThemeManager.getColorSync(guildId);
    if (!col) return null;
    if (typeof col === "string" && col.startsWith("#")) return col;
    if (typeof col === "number") return `#${col.toString(16).padStart(6, "0")}`;
    return null;
  }

  public static getThemeHeart(guildId?: string | null): string {
    return "<a:pink_Heartjump:1546859773721444382>";
  }

  public static getActionEmoji(actionName: string, guildId?: string | null): string {
    const key = actionName.toLowerCase().trim();

    if (guildId) {
      const themeEmoji = ThemeManager.getThemeEmoji(guildId, key);
      if (themeEmoji) return themeEmoji;
    }

    return EmojiManager.get(key);
  }

  public static async build(
    guildId: string | null | undefined,
    title: string,
    content: string
  ): Promise<V2Payload> {
    const accent = this.resolveAccent(guildId);
    const container = createMultiContainer([title, content], accent);
    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container],
      allowedMentions: NO_PARSE_MENTIONS
    };
  }

  public static async invalidCommand(
    guildId: string | null | undefined,
    commandUsage: string,
    customExample?: string
  ): Promise<V2Payload> {
    const cleanCmd = commandUsage
      .replace(/^`|`$/g, "")
      .replace(/^\.v\s+/i, "")
      .replace(/^\./, "")
      .split(/\s+/)[0]
      .toLowerCase();

    const emoji = this.getActionEmoji(cleanCmd, guildId);
    const capitalizedCmd = cleanCmd.length > 0 ? (cleanCmd.charAt(0).toUpperCase() + cleanCmd.slice(1)) : "Command";
    const title = `# ${emoji} ${capitalizedCmd} Command`;

    const cleanUsageText = commandUsage.replace(/^`|`$/g, "");
    let baseCmd = cleanUsageText;
    if (!baseCmd.startsWith(".")) baseCmd = `.v ${cleanCmd}`;

    let usageLine = "";
    if (cleanCmd === "reject") {
      usageLine = `- __\`.v reject <@member|username|ID>|@role|rolename|roleID>\`__`;
    } else if (cleanCmd === "permit" || cleanCmd === "perm") {
      usageLine = `- __\`.v permit <@member|username|ID>|@role|rolename|roleID>\`__`;
    } else if (cleanCmd === "name" || cleanCmd === "rename") {
      usageLine = `- __\`${baseCmd} <newname>\`__`;
    } else if (cleanCmd === "limit") {
      usageLine = `- __\`${baseCmd} <0-99>\`__`;
    } else if (cleanCmd === "status" || cleanCmd === "vstatus" || cleanCmd === "setstatus") {
      usageLine = `- __\`${baseCmd} <newstatus>\`__`;
    } else if (cleanCmd === "kick" || cleanCmd === "mute" || cleanCmd === "unmute" || cleanCmd === "deafen" || cleanCmd === "undeafen" || cleanCmd === "tmute" || cleanCmd === "tunmute") {
      usageLine = `- __\`${baseCmd} <@member|username|ID>\`__`;
    } else if (cleanUsageText.includes("wl") || cleanUsageText.includes("whitelist")) {
      if (cleanUsageText.includes("add")) {
        usageLine = `- __\`.v wl add <@member|username|ID|@role>\` — Add user or role to whitelist__`;
      } else if (cleanUsageText.includes("remove") || cleanUsageText.includes("del")) {
        usageLine = `- __\`.v wl remove <@member|username|ID|@role>\` — Remove user or role from whitelist__`;
      } else {
        usageLine = `- __\`${cleanUsageText}\`__`;
      }
    } else if (cleanUsageText.includes("bl") || cleanUsageText.includes("blacklist")) {
      if (cleanUsageText.includes("add")) {
        usageLine = `- __\`.v bl add <@member|username|ID|@role>\` — Add user or role to blacklist__`;
      } else if (cleanUsageText.includes("remove") || cleanUsageText.includes("del")) {
        usageLine = `- __\`.v bl remove <@member|username|ID|@role>\` — Remove user or role from blacklist__`;
      } else {
        usageLine = `- __\`${cleanUsageText}\`__`;
      }
    } else if (cleanUsageText.includes("man") || cleanUsageText.includes("manager") || cleanUsageText.includes("cowner") || cleanUsageText.includes("coowner")) {
      if (cleanUsageText.includes("add")) {
        usageLine = `- __\`.v man add <@member|username|ID>\` — Add manager to channel__`;
      } else if (cleanUsageText.includes("remove") || cleanUsageText.includes("del")) {
        usageLine = `- __\`.v man remove <@member|username|ID>\` — Remove manager from channel__`;
      } else {
        usageLine = `- __\`${cleanUsageText}\`__`;
      }
    } else {
      usageLine = `- __\`${cleanUsageText}\`__`;
    }

    if (cleanUsageText.includes(" — ")) {
      return this.build(guildId, title, usageLine);
    }

    const desc = COMMAND_DESCRIPTIONS[cleanCmd] || "Command instructions and usage information";
    const descLine = `- __${desc}__`;

    const content = usageLine.includes(" — ") ? usageLine : `${usageLine}\n${descLine}`;
    return this.build(guildId, title, content);
  }

  public static async whatDidYouMean(
    guildId: string | null | undefined,
    commandUsage: string,
    optionsText: string = "add | remove | list"
  ): Promise<V2Payload> {
    const cleanCmd = commandUsage
      .replace(/^`|`$/g, "")
      .replace(/^\.v\s+/i, "")
      .replace(/^\./, "")
      .split(/\s+/)[0]
      .toLowerCase();

    const emoji = this.getActionEmoji(cleanCmd, guildId);

    if (cleanCmd === "wl" || cleanCmd === "whitelist") {
      const title = `# ${emoji} Whitelist Command`;
      const lines = [
        `- __\`.v wl add <@member|username|ID|@role>\` — Add to whitelist__`,
        `- __\`.v wl remove <@member|username|ID|@role>\` — Remove from whitelist__`,
        `- __\`.v wl list\` — View whitelisted members & roles__`,
        `- __\`.v wl clear\` — Clear the channel whitelist__`
      ];
      return this.build(guildId, title, lines.join("\n"));
    }

    if (cleanCmd === "bl" || cleanCmd === "blacklist") {
      const title = `# ${emoji} Blacklist Command`;
      const lines = [
        `- __\`.v bl add <@member|username|ID|@role>\` — Add to blacklist__`,
        `- __\`.v bl remove <@member|username|ID|@role>\` — Remove from blacklist__`,
        `- __\`.v bl list\` — View blacklisted members & roles__`,
        `- __\`.v bl clear\` — Clear your blacklist__`
      ];
      return this.build(guildId, title, lines.join("\n"));
    }

    if (cleanCmd === "man" || cleanCmd === "manager" || cleanCmd === "cowner" || cleanCmd === "coowner") {
      const title = `# ${emoji} Managers Command`;
      const lines = [
        `- __\`.v man add <@member|username|ID>\` — Add channel manager__`,
        `- __\`.v man remove <@member|username|ID>\` — Remove channel manager__`,
        `- __\`.v man list\` — View channel managers__`,
        `- __\`.v man clear\` — Clear all managers__`
      ];
      return this.build(guildId, title, lines.join("\n"));
    }

    const title = `# ${emoji} Notice`;
    const cleanUsage = commandUsage.replace(/^`|`$/g, "");
    const content = `- __\`${cleanUsage}\` ${optionsText}__`;
    return this.build(guildId, title, content);
  }

  private static formatCleanLine(text: string): string {
    let clean = text.replace(/^- (?:<a?:[\w~]+:\d+>\s*)?/, "").trim();
    clean = clean.replace(/\s*⁘\s*$/, "").trim();

    if (clean.includes(" :__") || clean.includes(" :") || clean.includes(":__") || clean.includes(":")) {
      const match = clean.match(/^(.*?)(?::__|:\s*|\s*:\s*)(.*)$/);
      if (match) {
        let prefix = match[1].replace(/^(\*\*__|__\*\*|__|\*\*)+/, "").replace(/(\*\*__|__\*\*|__|\*\*)+$/, "").trim();
        let suffix = match[2].replace(/^(\*\*__|__\*\*|__|\*\*)+/, "").replace(/(\*\*__|__\*\*|__|\*\*)+$/, "").trim();
        return `- __${prefix}:__ ${suffix}`;
      }
    }

    if (clean.includes(" has been changed to") || clean.includes(" updated to")) {
      const match = clean.match(/^(.*?)(has been changed to|updated to)\s*(.*)$/i);
      if (match) {
        const prefix = match[1].replace(/^(\*\*__|__\*\*|__|\*\*)+/, "").replace(/(\*\*__|__\*\*|__|\*\*)+$/, "").trim();
        const mid = match[2].trim();
        let suffix = match[3].trim();
        suffix = suffix.replace(/^(\*\*__|__\*\*|__|\*\*)+/, "").replace(/(\*\*__|__\*\*|__|\*\*)+$/, "").trim();
        const fullPrefix = prefix ? `${prefix} ${mid}:__` : `${mid}:__`;
        return `- __${fullPrefix} ${suffix}`;
      }
    }

    clean = clean.replace(/^(\*\*__|__\*\*)+/, "").replace(/(\*\*__|__\*\*)+$/, "").trim();
    clean = clean.replace(/^(__|\*\*)+/, "").replace(/(__|\*\*)+$/, "").trim();
    return `- __${clean}__`;
  }

  public static async executedAction(
    guildId: string | null | undefined,
    actionName: string,
    detailText: string
  ): Promise<V2Payload> {
    const emoji = this.getActionEmoji(actionName, guildId);
    const title = `# ${emoji} ${actionName}`;
    let content = detailText;
    if (detailText.includes("\n")) {
      const lines = detailText.split("\n").map((l) => l.trim()).filter(Boolean);
      content = lines.map((l) => this.formatCleanLine(l)).join("\n");
    } else {
      content = this.formatCleanLine(detailText);
    }
    return this.build(guildId, title, content);
  }

  public static async notManagerOrOwner(guildId: string | null | undefined): Promise<V2Payload> {
    const emoji = this.getActionEmoji("info", guildId);
    const title = `# ${emoji} Notice`;
    const content = `- __Only the owner or co-owners can use this__`;
    return this.build(guildId, title, content);
  }

  public static async impossible(guildId: string | null | undefined, reason: string): Promise<V2Payload> {
    const emoji = this.getActionEmoji("info", guildId);
    const title = `# ${emoji} Notice`;
    const cleanReason = reason.replace(/^\*\*__|\*\*__|__\*\*|:\s*$/g, "").replace(/\s*⁘\s*$/, "").trim();
    const content = `- __${cleanReason}__`;
    return this.build(guildId, title, content);
  }

  public static async permissionError(
    guildId: string | null | undefined,
    action: string,
    missingPermissions: string[]
  ): Promise<V2Payload> {
    const emoji = this.getActionEmoji("reject", guildId);
    const title = `# ${emoji} Missing Permissions`;
    const permsText = missingPermissions.map((p) => `\`${p}\``).join(", ");
    const content = `- __Cannot complete action: ${action}__\n- __Required Discord permissions missing: ${permsText}__`;
    return this.build(guildId, title, content);
  }

  public static async invalidInputWarning(guildId?: string | null): Promise<V2Payload> {
    const emoji = this.getActionEmoji("info", guildId);
    const title = `# ${emoji} Notice`;
    const content = `- __Please provide a valid and safe input__`;
    return this.build(guildId, title, content);
  }

  public static async notInVoice(guildId: string | null | undefined): Promise<V2Payload> {
    const emoji = this.getActionEmoji("info", guildId);
    const title = `# ${emoji} Notice`;
    const content = `- __You Need To Be in Voice Channel to use that__`;
    return this.build(guildId, title, content);
  }

  public static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) {
      return `${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m`;
    }
    return `${secs}s`;
  }

  public static async renameCooldown(guildId: string | null | undefined, remainingSeconds: number): Promise<V2Payload> {
    const emoji = this.getActionEmoji("rename", guildId);
    const title = `# ${emoji} Notice`;
    const formattedTime = this.formatDuration(remainingSeconds);
    const content = `- __Channel rename is on cooldown: ${formattedTime} remaining__`;
    return this.build(guildId, title, content);
  }

  public static async alreadyAction(
    guildId: string | null | undefined,
    message: string
  ): Promise<V2Payload> {
    const emoji = this.getActionEmoji("info", guildId);
    const title = `# ${emoji} Notice`;
    const clean = message.replace(/^\*\*__|\*\*__|__\*\*|:\s*$/g, "").replace(/\s*⁘\s*$/, "").trim();
    const content = `- __${clean}__`;
    return this.build(guildId, title, content);
  }

  public static async selfReject(guildId: string | null | undefined): Promise<V2Payload> {
    const emoji = this.getActionEmoji("reject", guildId);
    const title = `# ${emoji} Notice`;
    const content = `- __You cannot reject yourself__`;
    return this.build(guildId, title, content);
  }

  public static async stopDoingThat(guildId: string | null | undefined, reason: string): Promise<V2Payload> {
    const emoji = this.getActionEmoji("info", guildId);
    const title = `# ${emoji} Notice`;
    const cleanReason = reason.replace(/^\*\*__|\*\*__|__\*\*|:\s*$/g, "").replace(/\s*⁘\s*$/, "").trim();
    const content = `- __${cleanReason}__`;
    return this.build(guildId, title, content);
  }

  public static async claimPrompt(guildId: string | null | undefined, ownerId?: string | null): Promise<V2Payload> {
    const accent = this.resolveAccent(guildId);
    const container = new ContainerBuilder();
    if (accent) {
      container.setAccentColor(getAccentColorInt(accent));
    }
    const claimEmoji = this.getActionEmoji("claim", guildId);
    const ownerMention = ownerId ? `<@${ownerId}>` : "Owner";

    const lines = [
      `-# __${ownerMention} has left the channel__ ⁘`,
      `-# __You can now claim ownership__ ⁘`
    ].join("\n");

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${claimEmoji} Owner Left Channel`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(lines)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("btn:claim")
            .setLabel("Claim")
            .setEmoji(claimEmoji)
            .setStyle(ButtonStyle.Secondary)
        )
      );

    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container.toJSON()],
      allowedMentions: NO_PARSE_MENTIONS
    };
  }

  public static async ownerReturned(guildId: string | null | undefined, ownerId: string): Promise<V2Payload> {
    const emoji = this.getActionEmoji("owner", guildId);
    const title = `## ${emoji} Owner Returned`;
    const content = `-# <@${ownerId}> __has returned to the channel__ ⁘`;
    return this.build(guildId, title, content);
  }

  public static async claimedChannel(guildId: string | null | undefined, claimantId: string): Promise<V2Payload> {
    const emoji = this.getActionEmoji("claim", guildId);
    const title = `## ${emoji} Channel Claimed`;
    const content = `-# <@${claimantId}> __has claimed the channel__ ⁘`;
    return this.build(guildId, title, content);
  }

  public static async cooldownNotice(guildId: string | null | undefined, durationStr: string = "5s"): Promise<V2Payload> {
    const emoji = this.getActionEmoji("info", guildId);
    const title = `# ${emoji} Cooldown Notice`;
    const content = `- __You are on cooldown for \`${durationStr}\`__`;
    return this.build(guildId, title, content);
  }

  public static async antiAbuseNotice(guildId: string | null | undefined, ownerId: string, targetId: string, channelId: string): Promise<V2Payload> {
    const accent = this.resolveAccent(guildId);
    const container = new ContainerBuilder();
    if (accent) container.setAccentColor(getAccentColorInt(accent));

    const emoji = this.getActionEmoji("antiabuse", guildId);
    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${emoji} <@${ownerId}> Anti Abuse Detected`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`- __<@${targetId}> keeps repeatedly joining your voice channel. Take action below__`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`antiabuse_permit:${channelId}:${targetId}`)
            .setLabel("Permit")
            .setEmoji("<a:anim_permit_cb:1546636691845152838>")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`antiabuse_deny:${channelId}:${targetId}`)
            .setLabel("Deny")
            .setEmoji("<a:anim_reject_cb:1546634011315806218>")
            .setStyle(ButtonStyle.Secondary)
        )
      );

    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container.toJSON()],
      allowedMentions: { users: [ownerId] }
    };
  }

  public static async antiAbuseActionCompleted(
    guildId: string | null | undefined,
    action: "Permit" | "Deny",
    ownerId: string,
    targetId: string
  ): Promise<V2Payload> {
    const accent = this.resolveAccent(guildId);
    const container = new ContainerBuilder();
    if (accent) container.setAccentColor(getAccentColorInt(accent));

    const emoji = action === "Permit" ? "<a:anim_permit_cb:1546636691845152838>" : "<a:anim_reject_cb:1546634011315806218>";
    const statusText = action === "Permit" ? `Permitted <@${targetId}> to join` : `Denied access for <@${targetId}>`;

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${emoji} Anti Abuse Handled`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`- <@${ownerId}> __has ${statusText}__`)
      );

    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container.toJSON()],
      allowedMentions: { users: [ownerId] }
    };
  }

  public static formatUserTarget(verb: string, ids: string[]): string {
    const mentions = ids.map((id) => `<@${id}>`).join(" ");
    return `Target has been ${verb}: ${mentions}`;
  }
}

export function noPermissionReply(accentColorHex = "#ff0000") {
  const title = `# ${Usages.getActionEmoji("info")} Notice`;
  const text = `- __Only the owner or co-owners can use this__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function botNoPermissionReply(accentColorHex = "#ff0000") {
  const title = `# ${Usages.getActionEmoji("reject")} System Error`;
  const text = `- __I don't have enough permission to execute that action__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export interface UsageExampleOptions {
  commandName?: string;
  title?: string;
  description?: string;
  usage?: string;
  example?: string;
  examples?: string[];
  accentColorHex?: string;
}

export function usageExampleReply({
  commandName,
  title,
  description = "Command usage information",
  usage,
  example,
  examples,
  accentColorHex = "#3b82f6"
}: UsageExampleOptions = {}): V2Payload {
  const cmd = commandName || title || "Command";
  const capitalizedCmd = typeof cmd === "string" && cmd.length ? (cmd.charAt(0).toUpperCase() + cmd.slice(1)) : "Command";
  const emoji = Usages.getActionEmoji(cmd.toLowerCase());

  const header = `# ${emoji} ${capitalizedCmd} Command`;
  const usageLines: string[] = [];
  if (usage) {
    usageLines.push(formatUsageLine(usage));
  }

  let exampleContent = "";
  if (example) {
    exampleContent = formatUsageLine(example);
  } else if (Array.isArray(examples) && examples.length > 0) {
    exampleContent = examples.map((e) => formatUsageLine(e)).join("\n");
  }

  if (exampleContent) {
    exampleContent.split("\n").forEach((line) => {
      if (!usageLines.includes(line)) usageLines.push(line);
    });
  }

  if (usageLines.length === 0) {
    usageLines.push("`No usage provided.`");
  }

  const content = `- __${usageLines.join(" ")}__\n- __${description}__`;

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([header, content], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export interface ErrorReplyOptions {
  title?: string;
  errors?: string[];
  message?: string;
  accentColorHex?: string;
}

export function errorReply({
  title = "Notice",
  errors,
  message,
  accentColorHex = "#ff0000"
}: ErrorReplyOptions = {}): V2Payload {
  const emoji = Usages.getActionEmoji("info");
  const header = `# ${emoji} ${title}`;
  let body: string;
  if (message) {
    if (message.includes("\n")) {
      const lines = message.split("\n").map((l: string) => l.trim()).filter(Boolean);
      body = lines.map((l: string) => `- __${l}__`).join("\n");
    } else {
      body = `- __${message}__`;
    }
  } else if (Array.isArray(errors) && errors.length > 0) {
    body = errors.map((err) => `- __${err}__`).join("\n");
  } else {
    body = `- __An error occurred__`;
  }

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([header, body], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function alreadyJailedReply(accentColorHex = "#ff0000") {
  const title = `# ${Usages.getActionEmoji("info")} Notice`;
  const text = `- __User is already jailed__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function alreadyVerifiedReply(accentColorHex = "#ff0000") {
  const title = `# ${Usages.getActionEmoji("info")} Notice`;
  const text = `- __User is already verified__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function alreadyVerifiedGirlReply(accentColorHex = "#ff0000") {
  const title = `# ${Usages.getActionEmoji("info")} Notice`;
  const text = `- __User is already verified__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function notJailedReply(accentColorHex = "#ff0000") {
  const title = `# ${Usages.getActionEmoji("info")} Notice`;
  const text = `- __User is not jailed__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function notVerifiedReply(accentColorHex = "#ff0000") {
  const title = `# ${Usages.getActionEmoji("info")} Notice`;
  const text = `- __User is not verified__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function processingReply({ actionText, accentColorHex = "#3b82f6" }: { actionText: string; accentColorHex?: string }) {
  const title = `# ${Usages.getActionEmoji("info")} Processing`;
  const text = `- __${actionText}__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function executedReply({ resultText, action = "", accentColorHex = "#3b82f6" }: { resultText: string; action?: string; accentColorHex?: string }) {
  const emoji = Usages.getActionEmoji(action);
  const title = `# ${emoji} ${action || "System Executed"}`;
  const cleanLine = (l: string) => {
    let clean = l.replace(/^- (?:<a?:[\w~]+:\d+>\s*)?/, "").trim();
    clean = clean.replace(/^(\*\*__|__\*\*)+/, "").replace(/(\*\*__|__\*\*)+$/, "").trim();
    clean = clean.replace(/^(__|\*\*)+/, "").replace(/(__|\*\*)+$/, "").trim();
    clean = clean.replace(/\s*⁘\s*$/, "").trim();
    return `- __${clean}__`;
  };
  let text: string;
  if (resultText.includes("\n")) {
    const lines = resultText.split("\n").map((l) => l.trim()).filter(Boolean);
    text = lines.map((l) => cleanLine(l)).join("\n");
  } else {
    text = cleanLine(resultText);
  }
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function hierarchyErrorReply({ message = "Role hierarchy error: Member has higher or equal permissions.", accentColorHex = "#ff0000" } = {}) {
  const title = `# ${Usages.getActionEmoji("reject")} Hierarchy Error`;
  const text = `- __${message}__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function configErrorReply({ message = "The system is not configured in this server yet.", accentColorHex = "#ff0000" } = {}) {
  const title = `# ${Usages.getActionEmoji("info")} Configuration Notice`;
  const text = `- __${message}__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function boostTierRequiredReply({ requiredLevel = 2, accentColorHex = "#ff0000" } = {}) {
  const title = `# ${Usages.getActionEmoji("info")} Boost Level Required`;
  const text = `- __This server must be at least Boost Tier ${requiredLevel} to set role icons!__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function invalidEmojiReply({ message = "Please provide an emoji from this server or a default Discord emoji.", accentColorHex = "#ff0000" } = {}) {
  const title = `# ${Usages.getActionEmoji("info")} Invalid Emoji`;
  const text = `- __${message}__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function buildInfoContainer({
  sections,
  banner,
  accentColorHex = "#3b82f6",
  headerEmoji = "<a:anim_info_cb:1546639682924712037>"
}: {
  sections: { title: string; content: string; thumbnail?: string | null; emoji?: string }[];
  banner?: string | null;
  accentColorHex?: string;
  headerEmoji?: string;
}) {
  const container = new ContainerBuilder().setAccentColor(getAccentColorInt(accentColorHex));

  sections.forEach((section, idx) => {
    if (idx > 0) container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${section.emoji || headerEmoji} ${section.title}`)
    );
    container.addSeparatorComponents(new SeparatorBuilder());

    if (section.thumbnail) {
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(section.content))
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(section.thumbnail))
      );
    } else {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(section.content));
    }
  });

  if (banner) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems((item) => item.setURL(banner))
    );
  }

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container],
    allowedMentions: NO_PARSE_MENTIONS
  };
}
