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
  private static webhookCache: Map<string, { url: string; client: WebhookClient }> = new Map();

  private static async getOrCreateWebhook(channel: TextChannel): Promise<WebhookClient | null> {
    const cached = this.webhookCache.get(channel.id);
    if (cached) return cached.client;

    try {
      const webhooks = await channel.fetchWebhooks().catch(() => null);
      let webhook = webhooks?.find((w) => w.name === this.WEBHOOK_NAME && Boolean(w.token));

      const botUser = BotGateway.client?.user;
      const avatarUrl = botUser?.displayAvatarURL({ extension: "png", size: 256 }) || undefined;

      if (!webhook) {
        webhook = await channel.createWebhook({
          name: this.WEBHOOK_NAME,
          avatar: avatarUrl,
          reason: "3067 Voice Action Logging Webhook"
        });
      }

      if (webhook && webhook.url) {
        const client = new WebhookClient({ url: webhook.url });
        this.webhookCache.set(channel.id, { url: webhook.url, client });
        return client;
      }
    } catch {}

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
        `- **__Action :__** \`${action}\`\n`;

      if (channelName) {
        content += `- **__Channel :__** \`${channelName}\`\n`;
      }
      if (targetId) {
        content += `- **__Target :__** <@${targetId}>\n`;
      }
      if (details) {
        content += `- **__Details :__** ${details}\n`;
      }
      content += `- **__Time :__** <t:${Math.floor(Date.now() / 1000)}:R>`;

      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`## ${this.LOG_EMOJI} __Action Log: ${action}__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(content)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      const guild = BotGateway.client?.guilds.cache.get(guildId);
      if (!guild) return;

      const logsChannel = guild.channels.cache.get(config.logsChannelId) as TextChannel | undefined;
      if (!logsChannel || !logsChannel.isTextBased()) return;

      const botUser = BotGateway.client?.user;
      const avatarUrl = botUser?.displayAvatarURL({ extension: "png", size: 256 }) || undefined;

      const webhook = await this.getOrCreateWebhook(logsChannel);
      if (webhook) {
        await webhook.send({
          username: this.WEBHOOK_NAME,
          avatarURL: avatarUrl,
          flags: MessageFlags.IsComponentsV2 as any,
          components: [container] as any,
          allowedMentions: { parse: [] }
        }).catch(() => {
          this.webhookCache.delete(logsChannel.id);
        });
        return;
      }

      await logsChannel.send({
        flags: MessageFlags.IsComponentsV2 as any,
        components: [container] as any,
        allowedMentions: { parse: [] }
      }).catch(() => {});
    } catch {}
  }
}
