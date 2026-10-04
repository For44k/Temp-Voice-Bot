import {
  TextChannel,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  MessageFlags,
  resolveColor,
  WebhookClient
} from "discord.js";
import { GuildMemoryStore } from "../../modules/voice/cache/guild.store";
import { ThemeManager } from "../config/theme";
import { BotGateway } from "../gateway/bot.gateway";
import { FastLogger } from "./logger";

export interface LogActionOptions {
  guildId: string;
  executorId: string;
  action: string;
  channelName?: string;
  targetId?: string;
  details?: string;
}

export class ActionLogger {
  private static readonly LOG_EMOJI = "<a:3644hellokittyrun:1546859794478932078>";
  private static readonly WEBHOOK_NAME = "3067 Logs";
  private static readonly webhookCache = new Map<string, { url: string; client: WebhookClient }>();
  private static readonly MAX_WEBHOOK_ENTRIES = 500;

  private static escapeLogText(text: string): string {
    return text.replace(/@everyone/gi, "@\u200beveryone").replace(/@here/gi, "@\u200bhere");
  }

  private static async getOrCreateWebhook(channel: TextChannel): Promise<WebhookClient | null> {
    const cached = this.webhookCache.get(channel.id);
    if (cached) return cached.client;

    try {
      const webhooks = await channel.fetchWebhooks().catch(() => null);
      let webhook = webhooks?.find((w) => w.name === this.WEBHOOK_NAME && Boolean(w.token));

      const botUser = BotGateway.client?.user;
      const avatarUrl = botUser?.displayAvatarURL({ extension: "png", size: 256 });

      if (!webhook) {
        webhook = await channel.createWebhook({
          name: this.WEBHOOK_NAME,
          avatar: avatarUrl,
          reason: "3067 Voice Action Logging Webhook"
        });
      }

      if (webhook && webhook.url) {
        const client = new WebhookClient({ url: webhook.url });
        if (this.webhookCache.size >= this.MAX_WEBHOOK_ENTRIES) {
          const firstKey = this.webhookCache.keys().next().value;
          if (firstKey) {
            const old = this.webhookCache.get(firstKey);
            old?.client.destroy();
            this.webhookCache.delete(firstKey);
          }
        }
        this.webhookCache.set(channel.id, { url: webhook.url, client });
        return client;
      }
    } catch (error: unknown) {
      FastLogger.warn(`Failed to resolve webhook for channel ${channel.id}: ${String(error)}`);
    }

    return null;
  }

  public static async logAction(options: LogActionOptions): Promise<void> {
    try {
      const { guildId, executorId, action, channelName, targetId, details } = options;
      const config = await GuildMemoryStore.resolve(guildId);
      if (!config?.logsChannelId) return;

      const color = await ThemeManager.getColor(guildId);
      const accentColor = color ? resolveColor(color) : null;

      const container = new ContainerBuilder();
      if (accentColor) container.setAccentColor(accentColor);

      let content = `- **__User :__** <@${executorId}>\n` +
        `- **__Action :__** \`${this.escapeLogText(action)}\`\n`;

      if (channelName) {
        content += `- **__Channel :__** \`${this.escapeLogText(channelName)}\`\n`;
      }
      if (targetId) {
        content += `- **__Target :__** <@${targetId}>\n`;
      }
      if (details) {
        content += `- **__Details :__** ${this.escapeLogText(details)}\n`;
      }
      content += `- **__Time :__** <t:${Math.floor(Date.now() / 1000)}:R>`;

      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`## ${this.LOG_EMOJI} __Action Log: ${this.escapeLogText(action)}__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(content)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      const guild = BotGateway.client?.guilds.cache.get(guildId);
      if (!guild) return;

      const logsChannel = guild.channels.cache.get(config.logsChannelId);
      if (!logsChannel || !(logsChannel instanceof TextChannel)) return;

      const botUser = BotGateway.client?.user;
      const avatarUrl = botUser?.displayAvatarURL({ extension: "png", size: 256 });

      const webhook = await this.getOrCreateWebhook(logsChannel);
      if (webhook) {
        try {
          await webhook.send({
            username: this.WEBHOOK_NAME,
            avatarURL: avatarUrl,
            flags: MessageFlags.IsComponentsV2,
            components: [container],
            allowedMentions: { parse: [] }
          });
          return;
        } catch {
          const old = this.webhookCache.get(logsChannel.id);
          old?.client.destroy();
          this.webhookCache.delete(logsChannel.id);
        }
      }

      await logsChannel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
        allowedMentions: { parse: [] }
      }).catch((sendError: unknown) => {
        FastLogger.warn(`Failed to send fallback action log in channel ${logsChannel.id}: ${String(sendError)}`);
      });
    } catch (error: unknown) {
      FastLogger.warn(`Failed to log action: ${String(error)}`);
    }
  }
}
