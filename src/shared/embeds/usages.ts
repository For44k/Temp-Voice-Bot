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

export type V2Payload = {
  flags: number;
  components: any[];
  allowedMentions?: MessageMentionOptions;
};

const getLocalRGB = (color: any): [number, number, number] => {
  if (typeof color === "number") {
    return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
  }
  if (Array.isArray(color) && color.length === 3) {
    return color as [number, number, number];
  }
  if (!color || typeof color !== "string") return [0, 0, 0];
  const cleanHex = color.replace("#", "");
  return [
    parseInt(cleanHex.substring(0, 2), 16) || 0,
    parseInt(cleanHex.substring(2, 4), 16) || 0,
    parseInt(cleanHex.substring(4, 6), 16) || 0
  ];
};

const getAccentColorInt = (color: any): number => {
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
  builder.addSeparatorComponents(new SeparatorBuilder());

  parts.forEach((part) => {
    builder.addTextDisplayComponents(new TextDisplayBuilder().setContent(part));
    builder.addSeparatorComponents(new SeparatorBuilder());
  });

  return builder.toJSON();
};

export const ACTION_EMOJIS: Record<string, string> = {
  lock: "<a:anim_lock_cb:1546633975487930435>",
  unlock: "<a:anim_unlock_cb:1546633978600099910>",
  hide: "<a:anim_hide_cb:1546633980558835722>",
  unhide: "<a:anim_unhide_cb:1546639680995459203>",
  claim: "<a:anim_claim_cb:1546633981829718106>",
  unclaim: "<a:anim_claim_cb:1546633981829718106>",
  reject: "<a:anim_reject_cb:1546634011315806218>",
  "random reject": "<a:anim_reject_cb:1546634011315806218>",
  "temp reject": "<a:anim_tempreject_cb:1546634008832638986>",
  "temporary reject": "<a:anim_tempreject_cb:1546634008832638986>",
  kick: "<a:anim_reject_cb:1546634011315806218>",
  "random kick": "<a:anim_reject_cb:1546634011315806218>",
  mute: "<a:anim_mute_cb:1546634004919222355>",
  unmute: "<a:anim_mute_cb:1546634004919222355>",
  deafen: "<a:anim_deafen_85_sleek:1546594284516679680>",
  undeafen: "<a:anim_undeafen_85:1546593361618800641>",
  permit: "<a:anim_permit_cb:1546636691845152838>",
  limit: "<a:anim_limit_cb:1546633984975311029>",
  rename: "<a:anim_rename_cb:1546633989324804128>",
  name: "<a:anim_rename_cb:1546633989324804128>",
  "channel name": "<a:anim_rename_cb:1546633989324804128>",
  "voice name": "<a:anim_rename_cb:1546633989324804128>",
  status: "<a:anim_extra_cb:1546633992030265507>",
  "voice status": "<a:anim_extra_cb:1546633992030265507>",
  reset: "<a:anim_reset_cb:1546633997524799578>",
  fixlag: "<a:anim_reset_cb:1546633997524799578>",
  "lag resolved": "<a:anim_reset_cb:1546633997524799578>",
  tmute: "<a:anim_mute_cb:1546634004919222355>",
  tunmute: "<a:anim_mute_cb:1546634004919222355>",
  "text mute": "<a:anim_mute_cb:1546634004919222355>",
  "text unmute": "<a:anim_mute_cb:1546634004919222355>",
  tlock: "<a:anim_lock_cb:1546633975487930435>",
  tunlock: "<a:anim_unlock_cb:1546633978600099910>",
  "text lock": "<a:anim_lock_cb:1546633975487930435>",
  "text unlock": "<a:anim_unlock_cb:1546633978600099910>",
  antiabuse: "<a:anim_antiabuse_cb:1546633994903490570>",
  "anti abuse": "<a:anim_antiabuse_cb:1546633994903490570>",
  whitelist: "<a:anim_wl_cb:1546636688980451489>",
  whitelisted: "<a:anim_wl_cb:1546636688980451489>",
  "whitelist cleared": "<a:anim_wl_cb:1546636688980451489>",
  blacklist: "<a:anim_bl_cb:1546636690746245202>",
  blacklisted: "<a:anim_bl_cb:1546636690746245202>",
  "blacklist removed": "<a:anim_bl_cb:1546636690746245202>",
  "global user blacklist": "<a:anim_bl_cb:1546636690746245202>",
  "global server blacklist": "<a:anim_bl_cb:1546636690746245202>",
  owner: "<a:anim_sparkle_85:1546687452079722506>",
  transfer: "<a:anim_transfer_cb:1546683267892387882>",
  "ownership transferred": "<a:anim_transfer_cb:1546683267892387882>",
  "co-owners": "<a:anim_sparkle_85:1546687452079722506>",
  "co-owners list": "<a:anim_sparkle_85:1546687452079722506>",
  "trusted managers added": "<a:anim_sparkle_85:1546687452079722506>",
  "trusted managers removed": "<a:anim_sparkle_85:1546687452079722506>",
  info: "<a:anim_info_cb:1546639682924712037>",
  extra: "<a:anim_extra_cb:1546633992030265507>",
  theme: "<a:anim_sparkle_85:1546687452079722506>",
  "theme updated": "<a:anim_sparkle_85:1546687452079722506>",
  "server theme": "<a:anim_sparkle_85:1546687452079722506>",
  steam: "<:brand_steam:1546587516461645838>",
  spotify: "<:brand_spotify:1546587517694902313>",
  github: "<:brand_github:1546587519410372638>",
  reddit: "<:brand_reddit:1546587523839434824>"
};

const NO_PARSE_MENTIONS: MessageMentionOptions = { parse: [] as MessageMentionTypes[] };

export class Usages {
  private static readonly PINK_HEART = "<a:pink_Heartjump:1546859773721444382>";
  private static readonly WAIT_EMOJI = "<a:gh1y1ne:1546859779333292103>";
  private static readonly ANGEL_HEART = "<a:94071angelheart:1546859784374976603>";
  private static readonly KUROMI_SLEEP = "<a:kuromisleeping:1546859789223723008>";

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
    return this.PINK_HEART;
  }

  public static getActionEmoji(actionName: string, guildId?: string | null): string {
    const key = actionName.toLowerCase().trim();

    if (guildId) {
      const themeEmoji = ThemeManager.getThemeEmoji(guildId, key);
      if (themeEmoji) return themeEmoji;
    }

    if (ACTION_EMOJIS[key]) return ACTION_EMOJIS[key];

    for (const [k, v] of Object.entries(ACTION_EMOJIS)) {
      if (key.includes(k) || k.includes(key)) return v;
    }
    return this.getThemeHeart(guildId);
  }

  public static async build(
    guildId: string | null | undefined,
    title: string,
    content: string
  ): Promise<V2Payload> {
    const accent = this.resolveAccent(guildId);
    const container = createMultiContainer([title, content], accent);
    return {
      flags: MessageFlags.IsComponentsV2 as unknown as number,
      components: [container],
      allowedMentions: NO_PARSE_MENTIONS
    };
  }

  public static async invalidCommand(
    guildId: string | null | undefined,
    commandUsage: string,
    customExample?: string
  ): Promise<V2Payload> {
    const title = `# ${this.WAIT_EMOJI} __Wait a Second..!!__`;
    let content = "";
    if (customExample) {
      const lines = customExample.split("\n").map((l) => l.trim()).filter(Boolean);
      content = lines
        .map((l) => {
          if (l.startsWith("- ")) {
            return l;
          }
          if (l.startsWith("`.") || l.startsWith(".")) {
            const clean = l.replace(/^`|`$/g, "");
            const parts = clean.split(/\s+/);
            const cmd = parts.slice(0, 2).join(" ");
            const rest = parts.slice(2).join(" ");
            return `- ${this.PINK_HEART}  __\`${cmd}\`__ ${rest}`;
          }
          const cleanUsage = commandUsage.replace(/^`|`$/g, "");
          const baseCmd = cleanUsage.split(/\s+/).slice(0, 2).join(" ");
          return `- ${this.PINK_HEART}  __\`${baseCmd}\`__ ${l}`;
        })
        .join("\n");
    } else {
      const cleanUsage = commandUsage.replace(/^`|`$/g, "");
      if (/<[^>]+>|\[[^\]]+\]/.test(cleanUsage)) {
        const parts = cleanUsage.split(/\s+/);
        const cmd = parts.slice(0, 2).join(" ");
        const rest = parts.slice(2).join(" ");
        return this.build(guildId, title, `- ${this.PINK_HEART}  __\`${cmd}\`__ ${rest}`);
      }
      if (/\b(name|rename)\b/i.test(cleanUsage)) {
        content = `- ${this.PINK_HEART}  __\`${cleanUsage}\`__ <newname>`;
      } else if (/\b(status|vstatus|setstatus)\b/i.test(cleanUsage)) {
        content = `- ${this.PINK_HEART}  __\`${cleanUsage}\`__ <newstatus>`;
      } else if (/\b(limit)\b/i.test(cleanUsage)) {
        content = `- ${this.PINK_HEART}  __\`${cleanUsage}\`__ <0-99>`;
      } else {
        const isUserOnly = /\b(man|manager|cowner|coowner|owner|kick|mute|unmute|deafen|undeafen|claim)\b/i.test(cleanUsage);
        if (isUserOnly) {
          content = `- ${this.PINK_HEART}  __\`${cleanUsage}\`__ @user | username | \`ID\``;
        } else {
          content = `- ${this.PINK_HEART}  __\`${cleanUsage}\`__ @user | username | \`ID\`\n- ${this.PINK_HEART}  __\`${cleanUsage}\`__ @role | rolename | \`ID\``;
        }
      }
    }
    return this.build(guildId, title, content);
  }

  public static async whatDidYouMean(
    guildId: string | null | undefined,
    commandUsage: string,
    optionsText: string = "add | remove | list"
  ): Promise<V2Payload> {
    const title = `# ${this.WAIT_EMOJI} __Wait a Second..!!__`;
    const cleanUsage = commandUsage.replace(/^`|`$/g, "");
    const content = `- __What Did You Mean..!!__\n- ${this.PINK_HEART} __\`${cleanUsage}\`__ ${optionsText}`;
    return this.build(guildId, title, content);
  }

  public static async executedAction(
    guildId: string | null | undefined,
    actionName: string,
    detailText: string
  ): Promise<V2Payload> {
    const emoji = this.getActionEmoji(actionName, guildId);
    const title = `# ⌇ ${emoji} ⌇ __System Executed..!!__`;
    let content = detailText;
    if (detailText.includes("\n")) {
      const lines = detailText.split("\n").map((l) => l.trim()).filter(Boolean);
      content = lines
        .map((l) => {
          const cleanLine = l.replace(/^- (?:<a?:[\w~]+:\d+>\s*)?/, "").trim();
          return `- ${this.PINK_HEART} ${cleanLine}`;
        })
        .join("\n");
    } else {
      const cleanLine = content.replace(/^- (?:<a?:[\w~]+:\d+>\s*)?/, "").trim();
      content = `- ${this.PINK_HEART} ${cleanLine}`;
    }
    return this.build(guildId, title, content);
  }

  public static async notManagerOrOwner(guildId: string | null | undefined): Promise<V2Payload> {
    const title = `# ${this.WAIT_EMOJI} __Wait a Second..!!__`;
    const content = `- ${this.PINK_HEART} __You must be the channel owner or a manager to perform this action__`;
    return this.build(guildId, title, content);
  }

  public static async impossible(guildId: string | null | undefined, reason: string): Promise<V2Payload> {
    const title = `# ${this.WAIT_EMOJI} __Wait a Second..!!__`;
    const cleanReason = reason.replace(/^\*\*__|\*\*__|__\*\*|:\s*$/g, "").trim();
    const content = `- ${this.PINK_HEART} __${cleanReason}__`;
    return this.build(guildId, title, content);
  }

  public static async invalidInputWarning(guildId?: string | null): Promise<V2Payload> {
    const title = `# <a:pink_hellokittyswim:1547337485602783363>  __Nahhh...!!!__`;
    const content = `- __I thnk Next Time I'm gonna Blacklist You.!!!__\n- __Be Goof And Don't run this comamnd again!__`;
    return this.build(guildId, title, content);
  }

  public static async notInVoice(guildId: string | null | undefined): Promise<V2Payload> {
    const title = `# ${this.WAIT_EMOJI} __Wait a Second..!!__`;
    const content = `- ${this.PINK_HEART} __You must be in a voice channel to use this command__`;
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
    const title = `# ${this.WAIT_EMOJI} __Wait a Second..!!__`;
    const formattedTime = this.formatDuration(remainingSeconds);
    const content = `- ${this.PINK_HEART} __Channel rename is on cooldown: ${formattedTime} remaining__`;
    return this.build(guildId, title, content);
  }

  public static async alreadyAction(
    guildId: string | null | undefined,
    message: string
  ): Promise<V2Payload> {
    const title = `# ${this.WAIT_EMOJI} __Wait a Second..!!__`;
    const clean = message.replace(/^\*\*__|\*\*__|__\*\*|:\s*$/g, "").trim();
    const content = `- ${this.PINK_HEART} __${clean}__`;
    return this.build(guildId, title, content);
  }

  public static async selfReject(guildId: string | null | undefined): Promise<V2Payload> {
    const title = `# ${this.WAIT_EMOJI} __Wait a Second..!!__`;
    const content = `- ${this.PINK_HEART} __You can't reject Yourself...__`;
    return this.build(guildId, title, content);
  }

  public static async stopDoingThat(guildId: string | null | undefined, reason: string): Promise<V2Payload> {
    const title = `# ${this.WAIT_EMOJI} __Wait a Second..!!__`;
    const cleanReason = reason.replace(/^\*\*__|\*\*__|__\*\*|:\s*$/g, "").trim();
    const content = `- ${this.PINK_HEART} __${cleanReason}__`;
    return this.build(guildId, title, content);
  }

  public static async claimPrompt(guildId: string | null | undefined): Promise<V2Payload> {
    const accent = this.resolveAccent(guildId);
    const container = new ContainerBuilder();
    if (accent) {
      container.setAccentColor(getAccentColorInt(accent));
    }
    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${this.PINK_HEART} __Owner Has Left Channel__`)
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`__Claim the channel before owner returns__`)
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("btn:claim")
            .setLabel("Claim")
            .setEmoji("<a:anim_claim_cb:1546633981829718106>")
            .setStyle(ButtonStyle.Secondary)
        )
      )
      .addSeparatorComponents(new SeparatorBuilder());

    return {
      flags: MessageFlags.IsComponentsV2 as unknown as number,
      components: [container.toJSON()],
      allowedMentions: NO_PARSE_MENTIONS
    };
  }

  public static async ownerReturned(guildId: string | null | undefined, ownerId: string): Promise<V2Payload> {
    const title = `# ⌇ <a:anim_sparkle_85:1546687452079722506> ⌇ __Owner Returned__`;
    const content = `<@${ownerId}> __has returned to their channel__`;
    return this.build(guildId, title, content);
  }

  public static async claimedChannel(guildId: string | null | undefined, claimantId: string): Promise<V2Payload> {
    const title = `# ⌇ <a:anim_claim_cb:1546633981829718106> ⌇ __System Executed__`;
    const content = `<@${claimantId}> __has claimed the channel__`;
    return this.build(guildId, title, content);
  }

  public static async cooldownNotice(guildId: string | null | undefined, durationStr: string = "5s"): Promise<V2Payload> {
    const title = `# ${this.WAIT_EMOJI} __Cooldown Notice__`;
    const content = `__You have been cooldowned for \`${durationStr}\`__`;
    return this.build(guildId, title, content);
  }

  public static async antiAbuseNotice(guildId: string | null | undefined, ownerId: string, targetId: string, channelId: string): Promise<V2Payload> {
    const accent = this.resolveAccent(guildId);
    const container = new ContainerBuilder();
    if (accent) container.setAccentColor(getAccentColorInt(accent));

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# <a:3644hellokittyrun:1546859794478932078>  __ <@${ownerId}> Anti Abuse Deteced..!!__`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**__<@${targetId}> Keep joining Your Vc You Need to Deal With Him__**`)
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
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    return {
      flags: MessageFlags.IsComponentsV2 as unknown as number,
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
        new TextDisplayBuilder().setContent(`# ⌇ ${emoji} ⌇ __Anti Abuse Handled__`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`<@${ownerId}> **__has ${statusText}__**`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    return {
      flags: MessageFlags.IsComponentsV2 as unknown as number,
      components: [container.toJSON()],
      allowedMentions: { users: [ownerId] }
    };
  }

  public static formatUserTarget(verb: string, ids: string[]): string {
    const mentions = ids.map((id) => `<@${id}>`).join(" ");
    return `__User has been ${verb}:__ ${mentions}`;
  }
}

export function noPermissionReply(accentColorHex = "#ff0000") {
  const title = `# <a:gh1y1ne:1546859779333292103> __Wait a Second..!!__`;
  const text = `- <a:pink_Heartjump:1546859773721444382> __You don't have permission to do that!!__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function botNoPermissionReply(accentColorHex = "#ff0000") {
  const title = `# <a:kawaiiangrykuromi:1546859799034077305> __System Failed...!__`;
  const text = `- <a:pink_Heartjump:1546859773721444382> __I don't have enough permission to execute that action.__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function usageExampleReply({ commandName, title, description = "Command usage information", usage, example, examples, accentColorHex = "#3b82f6" }: any) {
  const cmd = commandName || title || "Command";
  const capitalizedCmd = typeof cmd === "string" && cmd.length ? (cmd.charAt(0).toUpperCase() + cmd.slice(1)) : "Command";

  const header = `# <a:kuromisleeping:1546859789223723008> __System Help__`;
  const commandBlock = `__**${capitalizedCmd} Command**__\n` +
    `> <a:pink_Heartjump:1546859773721444382> __${description}__`;

  const blocks: string[] = [header, commandBlock];

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

  blocks.push(`<a:pink_Heartjump:1546859773721444382> __Usage:__\n${usageLines.join("\n")}`);

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer(blocks, accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function errorReply({ title = "Wait a Second..!!", errors, message, accentColorHex = "#ff0000" }: { title?: string; errors?: any; message?: any; accentColorHex?: string } = {}) {
  const header = `# <a:gh1y1ne:1546859779333292103> __${title}__`;
  let body: string;
  if (message) {
    if (message.includes("\n")) {
      const lines = message.split("\n").map((l: string) => l.trim()).filter(Boolean);
      body = lines.map((l: string, idx: number) => {
        if (idx === 0) return `<a:pink_Heartjump:1546859773721444382> __${l}__`;
        return `<a:pink_Heartjump:1546859773721444382> __${l}__`;
      }).join("\n");
    } else {
      body = `- <a:pink_Heartjump:1546859773721444382> __${message}__`;
    }
  } else if (Array.isArray(errors) && errors.length > 0) {
    if (errors.length === 1) {
      body = `- <a:pink_Heartjump:1546859773721444382> __${errors[0]}__`;
    } else {
      const formatted = errors.map((err) => `- <a:pink_Heartjump:1546859773721444382> __${err}__`).join("\n");
      body = formatted;
    }
  } else {
    body = `- <a:pink_Heartjump:1546859773721444382> __An error occurred.__`;
  }

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([header, body], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function alreadyJailedReply(accentColorHex = "#ff0000") {
  const title = `# <a:gh1y1ne:1546859779333292103> __Wait a Second..!!__`;
  const text = `- <a:pink_Heartjump:1546859773721444382> __Check User roles he is already jailed__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function alreadyVerifiedReply(accentColorHex = "#ff0000") {
  const title = `# <a:gh1y1ne:1546859779333292103> __Wait a Second..!!__`;
  const text = `- <a:pink_Heartjump:1546859773721444382> __Check User roles he is already verified__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function alreadyVerifiedGirlReply(accentColorHex = "#ff0000") {
  const title = `# <a:gh1y1ne:1546859779333292103> __Wait a Second..!!__`;
  const text = `- <a:pink_Heartjump:1546859773721444382> __Check User roles she is already verified__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function notJailedReply(accentColorHex = "#ff0000") {
  const title = `# <a:gh1y1ne:1546859779333292103> __Wait a Second..!!__`;
  const text = `- <a:pink_Heartjump:1546859773721444382> __Check User roles he is not jailed__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function notVerifiedReply(accentColorHex = "#ff0000") {
  const title = `# <a:gh1y1ne:1546859779333292103> __Wait a Second..!!__`;
  const text = `- <a:pink_Heartjump:1546859773721444382> __Check User roles he is not verified__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function processingReply({ actionText, accentColorHex = "#3b82f6" }: { actionText: string; accentColorHex?: string }) {
  const title = `# <a:kuromisleeping:1546859789223723008> __System Processing.....!__`;
  const text = `- <a:pink_Heartjump:1546859773721444382> __${actionText}__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function executedReply({ resultText, action = "", accentColorHex = "#3b82f6" }: { resultText: string; action?: string; accentColorHex?: string }) {
  const emoji = Usages.getActionEmoji(action);
  const title = `# ⌇ ${emoji} ⌇ __System Executed__`;
  let text: string;
  if (resultText.includes("\n")) {
    const lines = resultText.split("\n").map((l) => l.trim()).filter(Boolean);
    text = lines.map((l) => `- <a:pink_Heartjump:1546859773721444382> __${l.replace(/^__\*\*|\*\*__$/g, "")}__`).join("\n");
  } else {
    text = `- <a:pink_Heartjump:1546859773721444382> __${resultText.replace(/^__\*\*|\*\*__$/g, "")}__`;
  }
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function hierarchyErrorReply({ message = "My role or yours isn't Higher Than user I can't do nothing with him...!", accentColorHex = "#ff0000" } = {}) {
  const title = `# <a:gh1y1ne:1546859779333292103> __System Hierarchy...!__`;
  const text = `- <a:pink_Heartjump:1546859773721444382> __${message}__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function configErrorReply({ message = "System Isn't yet Configured in server", accentColorHex = "#ff0000" } = {}) {
  const title = `# <a:gh1y1ne:1546859779333292103> __System Configuration...!__`;
  const text = `- <a:pink_Heartjump:1546859773721444382> __${message}__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function boostTierRequiredReply({ requiredLevel = 2, accentColorHex = "#ff0000" } = {}) {
  const title = `# <a:gh1y1ne:1546859779333292103> __Boost Level Required__`;
  const text = `- <a:pink_Heartjump:1546859773721444382> __This server must be at least Boost Tier ${requiredLevel} to set role icons!__`;
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [createMultiContainer([title, text], accentColorHex)],
    allowedMentions: NO_PARSE_MENTIONS
  };
}

export function invalidEmojiReply({ message = "Please provide an emoji from this server or a default Discord emoji.", accentColorHex = "#ff0000" } = {}) {
  const title = `# <a:gh1y1ne:1546859779333292103> __Invalid Emoji__`;
  const text = `- <a:pink_Heartjump:1546859773721444382> __${message}__`;
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
  headerEmoji = "<a:pink_Heartjump:1546859773721444382>"
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
      new TextDisplayBuilder().setContent(`# ${section.emoji || headerEmoji} __${section.title}__`)
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
