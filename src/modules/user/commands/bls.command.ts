import { Message } from "discord.js";
import { ICommand } from "../../../shared/types/command.types";
import { GlobalBlacklistStore } from "../cache/global-blacklist.store";
import { BotDeveloperStore } from "../cache/bot-developer.store";
import { Usages } from "../../../shared/embeds/usages";

export const blsCommand: ICommand = {
  name: "bls",
  prefixAliases: ["bls"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!BotDeveloperStore.isDeveloper(message.author.id)) return;

    const action = args[0]?.toLowerCase();
    const guildId = message.guildId;

    if (action === "list") {
      const list = GlobalBlacklistStore.getServerBlacklist();
      if (list.length === 0) {
        const embed = await Usages.executedAction(guildId, "Global Blacklist Servers", "No servers are globally blacklisted.");
        await message.reply({ ...embed });
        return;
      }
      const formatted = list.map((id) => `• Server ID: \`${id}\``).join("\n");
      const embed = await Usages.executedAction(guildId, `Global Blacklist Servers (${list.length})`, formatted);
      await message.reply({ ...embed });
      return;
    }

    if (action === "add") {
      const targetServerId = args[1]?.trim();
      if (!targetServerId || !/^\d{17,20}$/.test(targetServerId)) {
        const embed = await Usages.invalidCommand(guildId, "`.v bls add`", "`<serverId>`");
        await message.reply({ ...embed });
        return;
      }

      await GlobalBlacklistStore.addServer(targetServerId);

      const targetGuild = message.client.guilds.cache.get(targetServerId);
      if (targetGuild) {
        await targetGuild.leave().catch(() => {});
      }

      const embed = await Usages.executedAction(
        guildId,
        "Global Server Blacklist",
        `**__Server has been blacklisted and left :__** \`${targetServerId}\`${targetGuild ? ` (${targetGuild.name})` : ""}`
      );
      await message.reply({ ...embed });
      return;
    }

    if (action === "remove") {
      const targetServerId = args[1]?.trim();
      if (!targetServerId || !/^\d{17,20}$/.test(targetServerId)) {
        const embed = await Usages.invalidCommand(guildId, "`.v bls remove`", "`<serverId>`");
        await message.reply({ ...embed });
        return;
      }

      await GlobalBlacklistStore.removeServer(targetServerId);
      const embed = await Usages.executedAction(
        guildId,
        "Global Server Blacklist",
        `**__Server has been removed from blacklist :__** \`${targetServerId}\``
      );
      await message.reply({ ...embed });
      return;
    }

    const embed = await Usages.invalidCommand(guildId, "`.v bls <add | remove | list>`");
    await message.reply({ ...embed });
  }
};
