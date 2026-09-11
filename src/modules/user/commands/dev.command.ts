import { Message } from "discord.js";
import { ICommand } from "../../../shared/types/command.types";
import { BotDeveloperStore } from "../cache/bot-developer.store";
import { Usages } from "../../../shared/embeds/usages";
import { extractTargetMembers } from "../../../shared/utils/member-parser";

export const devCommand: ICommand = {
  name: "3067",
  prefixAliases: ["3067"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    
    if (!BotDeveloperStore.isMainDev(message.author.id)) return;

    const action = args[0]?.toLowerCase();
    const guildId = message.guildId;

    if (!action || action === "list") {
      const list = BotDeveloperStore.getDeveloperList();
      if (list.length === 0) {
        const embed = await Usages.executedAction(guildId, "Bot Developers", "No additional bot developers registered.");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      const formatted = list.map((id) => `• <@${id}> (\`${id}\`)`).join("\n");
      const embed = await Usages.executedAction(guildId, `Bot Developers (${list.length})`, formatted);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    if (action === "add") {
      const targets = await extractTargetMembers(message, args.slice(1), 1);
      let targetId = targets[0]?.id;

      if (!targetId && args[1] && /^\d{17,20}$/.test(args[1])) {
        targetId = args[1];
      }

      if (!targetId) {
        const embed = await Usages.invalidCommand(guildId, "`.v 3067 add <@user | id>`");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }

      if (targetId === message.author.id) {
        const embed = await Usages.impossible(guildId, "**__You are already the main bot developer :__**");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }

      if (BotDeveloperStore.isDeveloper(targetId)) {
        const embed = await Usages.alreadyAction(guildId, "This user is already a bot developer");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }

      await BotDeveloperStore.addDeveloper(targetId, message.author.id);
      const embed = await Usages.executedAction(
        guildId,
        "Bot Developer Added",
        `**__User has been granted bot developer permissions :__** <@${targetId}> (\`${targetId}\`)`
      );
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    if (action === "remove" || action === "del") {
      const targets = await extractTargetMembers(message, args.slice(1), 1);
      let targetId = targets[0]?.id;

      if (!targetId && args[1] && /^\d{17,20}$/.test(args[1])) {
        targetId = args[1];
      }

      if (!targetId) {
        const embed = await Usages.invalidCommand(guildId, "`.v 3067 remove <@user | id>`");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }

      if (!BotDeveloperStore.isDeveloper(targetId)) {
        const embed = await Usages.impossible(guildId, "**__This user is not a bot developer :__**");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }

      await BotDeveloperStore.removeDeveloper(targetId);
      const embed = await Usages.executedAction(
        guildId,
        "Bot Developer Removed",
        `**__User has been removed from bot developers :__** <@${targetId}> (\`${targetId}\`)`
      );
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    const embed = await Usages.invalidCommand(guildId, "`.v 3067 <add | remove | list>`");
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
