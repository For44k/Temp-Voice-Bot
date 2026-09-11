import { Message } from "discord.js";
import { ICommand } from "../../../shared/types/command.types";
import { PreferencesStore } from "../cache/preferences.store";
import { Replies } from "../../../shared/embeds/replies";
import { extractTargetMembers } from "../../../shared/utils/member-parser";

export const trustedCommand: ICommand = {
  name: "trusted",
  prefixAliases: ["trusted", "trust"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const guildId = message.guildId;
    if (!guildId) return;

    const userId = message.author.id;
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === "list") {
      const prefs = await PreferencesStore.get(guildId, userId);
      if (prefs.trusted.size === 0) {
        await message.reply({
          embeds: [await Replies.create(guildId, "Your Trusted Managers", "You have no trusted managers set.")]
        });
        return;
      }
      const list = Array.from(prefs.trusted).map((id) => `• <@${id}>`).join("\n");
      await message.reply({
        embeds: [await Replies.create(guildId, `Your Trusted Managers (${prefs.trusted.size})`, list)]
      });
      return;
    }

    const targets = await extractTargetMembers(message, args.slice(1));
    if (targets.length === 0) {
      await message.reply({
        embeds: [await Replies.error(guildId, "Syntax Error", "Usage:\n• `.v trusted add @user`\n• `.v trusted remove @user`\n• `.v trusted list`")]
      });
      return;
    }

    if (sub === "add") {
      const prefs = await PreferencesStore.get(guildId, userId);
      const filtered = targets.filter((t) => t.id !== userId);
      const added: string[] = [];
      for (const t of filtered) {
        if (prefs.trusted.size >= 3 && !prefs.trusted.has(t.id)) break;
        await PreferencesStore.addTrusted(guildId, userId, t.id);
        added.push(t.id);
      }
      if (added.length === 0) {
        await message.reply({
          embeds: [await Replies.error(guildId, "Limit Reached", "You can only have a maximum of 3 managers.")]
        });
        return;
      }
      const mentions = added.map((id) => `<@${id}>`).join(", ");
      await message.reply({
        embeds: [
          await Replies.success(
            guildId,
            "Trusted Managers Added",
            `Added as trusted managers for your rooms: ${mentions}\n(They can rename and reject members, but cannot touch you or each other).`
          )
        ]
      });
      return;
    }

    if (sub === "remove" || sub === "del") {
      for (const t of targets) {
        await PreferencesStore.removeTrusted(guildId, userId, t.id);
      }
      const mentions = targets.map((t) => `<@${t.id}>`).join(", ");
      await message.reply({
        embeds: [await Replies.success(guildId, "Trusted Managers Removed", `Removed from your trusted managers: ${mentions}`)]
      });
      return;
    }
  }
};
