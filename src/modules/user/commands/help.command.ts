import { Message } from "discord.js";
import { ICommand } from "../../../shared/types/command.types";
import { HelpBuilder, _CATEGORIES } from "../interactions/help.builder";

export const helpCommand: ICommand = {
  name: "help",
  prefixAliases: ["help", "commands", "cmd", "cmds", "h"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const guildId = message.guildId;
    const query = args.join(" ").toLowerCase().trim();

    if (!query) {
      const payload = await HelpBuilder.buildHelpPayload(guildId, "home", 0);
      await message.reply({ ...payload, allowedMentions: { parse: [] } });
      return;
    }

    if (query.startsWith("search ")) {
      const searchQuery = query.replace("search ", "").trim();
      const payload = await HelpBuilder.buildSearchPayload(guildId, searchQuery);
      await message.reply({ ...payload, allowedMentions: { parse: [] } });
      return;
    }

    const foundCategory = _CATEGORIES.find(
      (c) =>
        c.id.toLowerCase() === query ||
        c.name.toLowerCase() === query ||
        c.name.toLowerCase().replace(/\s+/g, "") === query.replace(/\s+/g, "")
    );

    if (foundCategory) {
      const payload = await HelpBuilder.buildHelpPayload(guildId, foundCategory.id, 0);
      await message.reply({ ...payload, allowedMentions: { parse: [] } });
      return;
    }

    const payload = await HelpBuilder.buildSearchPayload(guildId, query);
    await message.reply({ ...payload, allowedMentions: { parse: [] } });
  }
};
