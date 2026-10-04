import {
  Message,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  resolveColor
} from "discord.js";
import mongoose from "mongoose";
import { performance } from "perf_hooks";
import { ICommand } from "../../../shared/types/command.types";
import { ThemeManager } from "../../../core/config/theme";

export const pingCommand: ICommand = {
  name: "ping",
  prefixAliases: ["ping", "latency", "p"],
  async executePrefix(message: Message): Promise<void> {
    const guildId = message.guildId;

    const respondSpeed = Math.max(1, Date.now() - message.createdTimestamp);
    const apiLatency = Math.max(0, Math.round(message.client.ws.ping));

    let dbSpeed = 0;
    try {
      const dbStart = performance.now();
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        dbSpeed = Math.round(performance.now() - dbStart);
      }
    } catch {
      dbSpeed = 0;
    }

    const color = await ThemeManager.getColor(guildId);
    const resolvedColor = color ? resolveColor(color) : null;

    const container = new ContainerBuilder();
    if (resolvedColor) container.setAccentColor(resolvedColor);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("help:home")
        .setLabel("Help")
        .setStyle(ButtonStyle.Secondary)
    );

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("# <:hi:1537821258333552773> __Bot Latency__")
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `- __Respond Speed:__ \`${respondSpeed}ms\`\n` +
          `- __Api Latency:__ \`${apiLatency}ms\`\n` +
          `- __Database Speed:__ \`${dbSpeed}ms\``
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("-# __Click the button below to see more information about me.__")
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(row);

    await message.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
      allowedMentions: { parse: [] }
    });
  }
};
