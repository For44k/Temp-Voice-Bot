import { Message, PermissionFlagsBits, Role } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { GuildConfigModel } from "../../../../database/schemas/guild-config.schema";
import { GuildMemoryStore } from "../../cache/guild.store";
import { Usages } from "../../../../shared/embeds/usages";

export const gameCommand: ICommand = {
  name: "game",
  prefixAliases: ["game", "games"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const guildId = message.guildId!;

    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({
        ...(await Usages.impossible(guildId, "**__You need Administrator permissions to manage games :__**")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const sub = args[0]?.toLowerCase();
    const config = await GuildMemoryStore.resolve(guildId);
    const existingGames = [...(config?.games || [])];

    if (!sub || sub === "list") {
      if (existingGames.length === 0) {
        const embed = await Usages.executedAction(
          guildId,
          "Games List",
          "**__No games configured yet.__**\nAdd one using: `.v game add <game_name> @role`"
        );
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }

      const listStr = existingGames
        .map((g, i) => `> ### ${i + 1}. **${g.name}** -> <@&${g.roleId}>`)
        .join("\n");

      const embed = await Usages.executedAction(
        guildId,
        `Games List (${existingGames.length})`,
        listStr
      );
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    if (sub === "add") {
      let role: Role | null | undefined = message.mentions.roles.first();
      let roleArgIndex = -1;

      if (!role) {
        for (let i = 1; i < args.length; i++) {
          const clean = args[i].replace(/[<@&>]/g, "");
          const r = message.guild?.roles.cache.get(clean);
          if (r) {
            role = r;
            roleArgIndex = i;
            break;
          }
        }
      } else {
        roleArgIndex = args.findIndex((a) => a.includes(role!.id));
      }

      if (!role) {
        await message.reply({
          ...(await Usages.invalidCommand(guildId, "`.v game add @role <Game Name> [emoji]`", "`.v game add @Valorant Valorant 🎮`")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const remainingArgs = args.slice(1).filter((_, idx) => idx !== roleArgIndex - 1);

      let customEmoji: string | undefined = undefined;
      const customEmojiRegex = /^<a?:[a-zA-Z0-9_~]+:\d+>$|^\p{Extended_Pictographic}$/u;

      if (remainingArgs.length > 1 && customEmojiRegex.test(remainingArgs[remainingArgs.length - 1])) {
        customEmoji = remainingArgs.pop();
      }

      const gameName = remainingArgs.join(" ").trim();
      if (!gameName) {
        await message.reply({
          ...(await Usages.invalidCommand(guildId, "`.v game add @role <Game Name> [emoji]`", "`.v game add @LoL League of Legends ⚔️`")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      if (existingGames.length >= 25) {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Limit reached: maximum 25 games per server.__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const finalEmoji = customEmoji || role.unicodeEmoji || undefined;

      const already = existingGames.find((g) => g.name.toLowerCase() === gameName.toLowerCase());
      if (already) {
        already.roleId = role.id;
        already.emoji = finalEmoji;
      } else {
        existingGames.push({ name: gameName, roleId: role.id, emoji: finalEmoji });
      }

      await GuildConfigModel.updateOne(
        { guildId },
        { $set: { games: existingGames } },
        { upsert: true }
      ).exec();

      const updated = await GuildConfigModel.findOne({ guildId }).lean();
      if (updated) GuildMemoryStore.set(guildId, updated);

      const embed = await Usages.executedAction(
        guildId,
        "Game Added",
        `**__Game configured successfully :__**\n> ### - **Game:** \`${gameName}\`\n> ### - **Role:** <@&${role.id}>${finalEmoji ? `\n> ### - **Emoji:** ${finalEmoji}` : ""}`
      );
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    if (sub === "remove" || sub === "delete" || sub === "del") {
      const targetName = args.slice(1).join(" ").trim().toLowerCase();
      if (!targetName) {
        await message.reply({
          ...(await Usages.invalidCommand(guildId, "`.v game remove <game_name>`", "`.v game remove Valorant`")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const index = existingGames.findIndex((g) => g.name.toLowerCase() === targetName);
      if (index === -1) {
        await message.reply({
          ...(await Usages.impossible(guildId, `**__Game \`${targetName}\` was not found.__**`)),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const removed = existingGames.splice(index, 1)[0];
      await GuildConfigModel.updateOne(
        { guildId },
        { $set: { games: existingGames } },
        { upsert: true }
      ).exec();

      const updated = await GuildConfigModel.findOne({ guildId }).lean();
      if (updated) GuildMemoryStore.set(guildId, updated);

      const embed = await Usages.executedAction(
        guildId,
        "Game Removed",
        `**__Game removed :__** \`${removed.name}\``
      );
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    await message.reply({
      ...(await Usages.invalidCommand(guildId, "`.v game <add | remove | list>`", "`.v game add Valorant @role`")),
      allowedMentions: { parse: [] }
    });
  }
};
