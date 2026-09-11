import { Message, PermissionFlagsBits, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { Usages } from "../../../../shared/embeds/usages";
import { VoicePersistManager } from "../../../../core/voice/voice-persist.manager";
import { BotGateway } from "../../../../core/gateway/bot.gateway";
import { TaskWorkerQueue } from "../../../../core/workers/task-worker.queue";

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

    if (args.length < 2) {
      await message.reply({
        ...(await Usages.invalidCommand(
          guildId,
          "`.v join @bot <channel_id>`",
          "`.v join <@bot> <channel_id>`"
        )),
        allowedMentions: { parse: [] }
      });
      return;
    }

    let targetBotUser = message.mentions.users.first();
    const firstArg = args[0]?.trim().toLowerCase();

    if (!targetBotUser) {
      if (firstArg === "main" || firstArg === "3067") {
        targetBotUser = BotGateway.client.user ?? undefined;
      } else if (firstArg === "worker" || firstArg === "3045" || firstArg === "helper") {
        targetBotUser = TaskWorkerQueue.client?.user ?? undefined;
      } else {
        const rawId = firstArg?.replace(/[<@!>]/g, "");
        if (rawId) {
          if (rawId === BotGateway.client.user?.id) {
            targetBotUser = BotGateway.client.user;
          } else if (rawId === TaskWorkerQueue.client?.user?.id) {
            targetBotUser = TaskWorkerQueue.client?.user ?? undefined;
          } else {
            targetBotUser = (await message.client.users.fetch(rawId).catch(() => null)) ?? undefined;
          }
        }
      }
    }

    if (!targetBotUser || !targetBotUser.bot) {
      await message.reply({
        ...(await Usages.impossible(guildId, "**__You must mention the bot (or specify `main`/`worker`) you want to join the voice channel :__**")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const channelId = args[1].trim().replace(/[<#>]/g, "");
    const channel = message.guild?.channels.cache.get(channelId) as VoiceChannel | undefined;

    if (!channel || !channel.isVoiceBased()) {
      await message.reply({
        ...(await Usages.impossible(guildId, `**__Voice channel \`${channelId}\` not found in this server :__**`)),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const isMainBot = targetBotUser.id === BotGateway.client.user?.id;
    const isWorkerBot = TaskWorkerQueue.hasWorker && TaskWorkerQueue.client?.user?.id === targetBotUser.id;

    if (!isMainBot && !isWorkerBot) {
      await message.reply({
        ...(await Usages.impossible(guildId, "**__Target bot is not managed by this system :__**")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    let success = false;
    let botName = targetBotUser.username;

    if (isMainBot) {
      VoicePersistManager.setMainBotChannel(guildId, channel.id);
      success = await VoicePersistManager.joinVoice(BotGateway.client, guildId, channel.id);
    } else if (isWorkerBot && TaskWorkerQueue.client) {
      VoicePersistManager.setWorkerBotChannel(guildId, channel.id);
      success = await VoicePersistManager.joinVoice(TaskWorkerQueue.client, guildId, channel.id);
    }

    if (!success) {
      await message.reply({
        ...(await Usages.impossible(guildId, `**__Failed to connect <@${targetBotUser.id}> to \`${channel.name}\` :__**`)),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const embed = await Usages.executedAction(
      guildId,
      "Bot Voice Join",
      `**__<@${targetBotUser.id}> has joined the voice channel and saved permanently :__**\n> ### - **Channel:** \`${channel.name}\` (\`${channel.id}\`)\n> ### - **Bot:** <@${targetBotUser.id}>`
    );

    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
