import { WebhookClient, EmbedBuilder, AttachmentBuilder } from "discord.js";
import { ENV } from "../config/env";

export class WebhookLogger {
  private static client: WebhookClient | null = null;

  private static getClient(): WebhookClient | null {
    if (this.client) return this.client;
    if (ENV.WEBHOOK_LOG_URL && ENV.WEBHOOK_LOG_URL.startsWith("http")) {
      try {
        this.client = new WebhookClient({ url: ENV.WEBHOOK_LOG_URL });
      } catch {
        this.client = null;
      }
    }
    return this.client;
  }

  public static async log(title: string, description: string, color: number): Promise<void> {
    const webhook = this.getClient();
    if (!webhook) return;
    try {
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();
      await webhook.send({ embeds: [embed] });
    } catch (error: unknown) {
      console.error("Failed to deliver webhook log", error);
    }
  }

  public static async logError(errorTitle: string, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    await this.log(
      `Bot Error: ${errorTitle}`,
      `\`\`\`\n${message.slice(0, 4000)}\n\`\`\``,
      0xff0000
    );
  }

  public static async logGuildJoin(guildName: string, guildId: string, memberCount: number, ownerId: string): Promise<void> {
    await this.log(
      `📥 Joined Server: ${guildName}`,
      `- **Server ID:** \`${guildId}\`\n- **Owner:** <@${ownerId}> (\`${ownerId}\`)\n- **Members:** \`${memberCount}\``,
      0x00ff00
    );
  }

  public static async uploadImage(buffer: Buffer, filename: string): Promise<string | null> {
    const webhook = this.getClient();
    if (!webhook) return null;
    try {
      const attachment = new AttachmentBuilder(buffer, { name: filename });
      const messageResult = await webhook.send({ files: [attachment] });
      if (!messageResult || typeof messageResult !== "object") {
        return null;
      }
      if ("attachments" in messageResult) {
        const rawAttachments = (messageResult as { attachments: unknown }).attachments;
        if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
          const firstAttachment = rawAttachments[0];
          if (firstAttachment && typeof firstAttachment === "object" && "url" in firstAttachment && typeof (firstAttachment as { url: unknown }).url === "string") {
            return (firstAttachment as { url: string }).url;
          }
        }
        if (rawAttachments && typeof rawAttachments === "object" && "values" in rawAttachments && typeof (rawAttachments as { values: () => IterableIterator<unknown> }).values === "function") {
          const firstAttachment = (rawAttachments as { values: () => IterableIterator<unknown> }).values().next().value;
          if (firstAttachment && typeof firstAttachment === "object" && "url" in firstAttachment && typeof (firstAttachment as { url: unknown }).url === "string") {
            return (firstAttachment as { url: string }).url;
          }
        }
      }
      return null;
    } catch (error: unknown) {
      console.error("Failed to upload image via webhook", error);
      return null;
    }
  }

  public static async logGuildLeave(guildName: string, guildId: string, memberCount: number): Promise<void> {
    await this.log(
      `Left Server: ${guildName}`,
      `- **Server ID:** \`${guildId}\`\n- **Members at departure:** \`${memberCount}\``,
      0xffaa00
    );
  }
}
