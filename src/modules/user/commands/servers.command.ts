import {
  Message,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  MessageFlags,
  resolveColor
} from "discord.js";
import { ICommand } from "../../../shared/types/command.types";
import { BotDeveloperStore } from "../cache/bot-developer.store";
import { ThemeManager } from "../../../core/config/theme";

export const serversCommand: ICommand = {
  name: "servers",
  prefixAliases: ["servers"],
  async executePrefix(message: Message): Promise<void> {
    if (!BotDeveloperStore.isDeveloper(message.author.id)) return;

    const guilds = Array.from(message.client.guilds.cache.values());
    const totalGuilds = guilds.length;
    const totalMembers = guilds.reduce((acc, g) => acc + (g.memberCount || 0), 0);

    const color = await ThemeManager.getColor(message.guildId);
    const resolvedColor = color ? resolveColor(color) : 0x2b2d31;

    const container = new ContainerBuilder()
      .setAccentColor(resolvedColor)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# <a:eedgy_hkwave:1546983166089105449> !! __Bot Servers List__\n> ### - **__Total Servers:__** \`${totalGuilds}\` | **__Total Users:__** \`${totalMembers}\``
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    const serverChunks: string[] = [];
    let currentChunk = "";

    for (const g of guilds) {
      const line = `- **${g.name}**\n  - **ID:** \`${g.id}\`\n  - **Owner:** <@${g.ownerId}> (\`${g.ownerId}\`)\n  - **Members:** \`${g.memberCount}\`\n\n`;
      if ((currentChunk + line).length > 3000) {
        serverChunks.push(currentChunk);
        currentChunk = line;
      } else {
        currentChunk += line;
      }
    }
    if (currentChunk) serverChunks.push(currentChunk);

    if (serverChunks.length === 0) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent("No servers found.")
      );
    } else {
      for (const chunk of serverChunks.slice(0, 3)) {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(chunk)
        );
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      }
    }

    await message.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
      allowedMentions: { parse: [] }
    });
  }
};
