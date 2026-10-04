import { Message, PermissionFlagsBits, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { Usages } from "../../../../shared/embeds/usages";
import { VoicePersistManager } from "../../../../core/voice/voice-persist.manager";
import { BotGateway } from "../../../../core/gateway/bot.gateway";

export const joinCommand: ICommand = {
  name: "join",
  prefixAliases: ["join"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const guildId = message.guildId;
    if (!guildId) return;

    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({
        ...(await Usages.impossible(guildId, "**__You need Administrator permissions to use this command :__**")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (args.length < 1) {
      await message.reply({
        ...(await Usages.invalidCommand(
          guildId,
          "`.v join <channel_id>`",
          "`.v join <channel_id>`"
        )),
        allowedMentions: { parse: [] }
      });
      return;
    }

    let channelId = args[0].trim().replace(/[<#>]/g, "");
    if (args.length >= 2 && args[0].includes("@")) {
      channelId = args[1].trim().replace(/[<#>]/g, "");
    }

    const channel = message.guild?.channels.cache.get(channelId) as VoiceChannel | undefined;
    if (!channel || !channel.isVoiceBased()) {
      await message.reply({
        ...(await Usages.impossible(guildId, `**__Voice channel \`${channelId}\` not found in this server :__**`)),
        allowedMentions: { parse: [] }
      });
      return;
    }

    VoicePersistManager.setMainBotChannel(guildId, channel.id);
    const success = await VoicePersistManager.joinVoice(BotGateway.client, guildId, channel.id);

    if (!success) {
      await message.reply({
        ...(await Usages.impossible(guildId, `**__Failed to connect <@${BotGateway.client.user?.id}> to \`${channel.name}\` :__**`)),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const embed = await Usages.executedAction(
      guildId,
      "Bot Voice Join",
      `**__<@${BotGateway.client.user?.id}> has joined the voice channel and saved permanently :__**\n> ### - **Channel:** \`${channel.name}\` (\`${channel.id}\`)\n> ### - **Bot:** <@${BotGateway.client.user?.id}>`
    );

    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
