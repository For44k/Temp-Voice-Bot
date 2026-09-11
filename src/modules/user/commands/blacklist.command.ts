import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../shared/types/command.types";
import { PreferencesStore } from "../cache/preferences.store";
import { Usages } from "../../../shared/embeds/usages";
import { extractTargets } from "../../../shared/utils/member-parser";
import { VoicePermissionsManager } from "../../voice/services/voice-permission.service";

export const blacklistCommand: ICommand = {
  name: "bl",
  prefixAliases: ["bl", "blacklist"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const guildId = message.guildId;
    if (!guildId) return;

    const userId = message.author.id;
    const sub = args[0]?.toLowerCase();

    if (!sub) {
      await message.reply({
        ...(await Usages.whatDidYouMean(guildId, ".v bl", "add | remove | list | clear")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (sub === "list") {
      const prefs = await PreferencesStore.get(guildId, userId);
      if (prefs.blacklist.size === 0) {
        const embed = await Usages.executedAction(guildId, "Blacklist", "**__No users or roles in your personal blacklist :__**");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      const list = Array.from(prefs.blacklist).map((id) => {
        if (message.guild?.roles.cache.has(id)) return `<@&${id}>`;
        return `<@${id}>`;
      }).join(" ");
      const embed = await Usages.executedAction(guildId, `Blacklist (${prefs.blacklist.size})`, `**__Blacklisted Users & Roles :__** ${list}`);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    if (sub === "clear") {
      const prefs = await PreferencesStore.get(guildId, userId);
      if (prefs.blacklist.size === 0) {
        const embed = await Usages.alreadyAction(guildId, "Your list is already clear");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      const member = message.member as GuildMember | null;
      const voiceChannel = member?.voice.channel as VoiceChannel | null;
      if (voiceChannel) {
        for (const blockedId of prefs.blacklist) {
          await voiceChannel.permissionOverwrites.delete(blockedId).catch(() => {});
        }
      }
      await PreferencesStore.clearBlacklist(guildId, userId);
      const embed = await Usages.executedAction(guildId, "Blacklist Cleared", "**__Blacklist has been cleared.__**");
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    if (sub === "add") {
      const { members: extractedMembers, roles: targetRoles } = await extractTargets(message, args.slice(1), 5);
      const validTargets = extractedMembers.filter((t) => !t.user.bot);

      if (validTargets.length === 0 && targetRoles.length === 0) {
        await message.reply({
          ...(await Usages.invalidCommand(guildId, ".v bl add")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      if (validTargets.some((t) => t.id === userId)) {
        await message.reply({
          ...(await Usages.stopDoingThat(guildId, "You Can't Blacklist yourself")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const prefs = await PreferencesStore.get(guildId, userId);
      const nonBlacklistedMembers = validTargets.filter((t) => !prefs.blacklist.has(t.id));
      const nonBlacklistedRoles = targetRoles.filter((r) => !prefs.blacklist.has(r.id));

      if (nonBlacklistedMembers.length === 0 && nonBlacklistedRoles.length === 0) {
        await message.reply({
          ...(await Usages.stopDoingThat(guildId, "You Can't Blacklist someone who is already Blacklisted")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const addedMentions: string[] = [];
      const member = message.member as GuildMember | null;
      const voiceChannel = member?.voice.channel as VoiceChannel | null;

      for (const r of nonBlacklistedRoles) {
        if (prefs.blacklist.size >= 10) break;
        await PreferencesStore.addBlacklist(guildId, userId, r.id);
        if (voiceChannel) {
          await voiceChannel.permissionOverwrites.edit(r, {
            Connect: false,
            ViewChannel: true,
            SendMessages: false
          }).catch(() => {});
        }
        addedMentions.push(`<@&${r.id}>`);
      }

      for (const t of nonBlacklistedMembers) {
        if (prefs.blacklist.size >= 10) break;
        await PreferencesStore.addBlacklist(guildId, userId, t.id);
        if (voiceChannel) {
          try {
            await VoicePermissionsManager.rejectMember(voiceChannel, t);
          } catch {}
        }
        addedMentions.push(`<@${t.id}>`);
      }

      if (addedMentions.length === 0) {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Limit Reached. You can only have a maximum of blacklisted entries :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const embed = await Usages.executedAction(guildId, "Blacklisted", `**__Added to permanent blacklist :__** ${addedMentions.join(" ")}`);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    if (sub === "remove" || sub === "del") {
      const { members: extractedMembers, roles: targetRoles } = await extractTargets(message, args.slice(1), 5);
      if (extractedMembers.length === 0 && targetRoles.length === 0) {
        await message.reply({
          ...(await Usages.invalidCommand(guildId, ".v bl remove")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const prefs = await PreferencesStore.get(guildId, userId);
      const inBlacklistMembers = extractedMembers.filter((t) => prefs.blacklist.has(t.id));
      const inBlacklistRoles = targetRoles.filter((r) => prefs.blacklist.has(r.id));

      if (inBlacklistMembers.length === 0 && inBlacklistRoles.length === 0) {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Selected users or roles are not in your blacklist :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const member = message.member as GuildMember | null;
      const voiceChannel = member?.voice.channel as VoiceChannel | null;
      const removedMentions: string[] = [];

      for (const r of inBlacklistRoles) {
        await PreferencesStore.removeBlacklist(guildId, userId, r.id);
        if (voiceChannel) {
          await voiceChannel.permissionOverwrites.delete(r).catch(() => {});
        }
        removedMentions.push(`<@&${r.id}>`);
      }

      for (const t of inBlacklistMembers) {
        await PreferencesStore.removeBlacklist(guildId, userId, t.id);
        if (voiceChannel) {
          try {
            await VoicePermissionsManager.resetMember(voiceChannel, t);
          } catch {}
        }
        removedMentions.push(`<@${t.id}>`);
      }

      const embed = await Usages.executedAction(guildId, "Blacklist Removed", `**__Removed from permanent blacklist :__** ${removedMentions.join(" ")}`);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    await message.reply({
      ...(await Usages.whatDidYouMean(guildId, ".v bl", "add | remove | list")),
      allowedMentions: { parse: [] }
    });
  }
};

