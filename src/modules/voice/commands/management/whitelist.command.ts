import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { PreferencesStore } from "../../../user/cache/preferences.store";
import { Usages } from "../../../../shared/embeds/usages";
import { extractTargets } from "../../../../shared/utils/member-parser";

export const whitelistCommand: ICommand = {
  name: "whitelist",
  prefixAliases: ["whitelist", "wl"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    if (!channel) {
      await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    if (!VoiceLifecycleService.isManager(channel.id, member.id)) {
      await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (!session) return;

    const sub = args[0]?.toLowerCase();

    if (!sub) {
      await message.reply({
        ...(await Usages.whatDidYouMean(guildId, ".v wl", "add | remove | list | clear")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (sub === "list") {
      if (session.whitelist.size === 0) {
        const embed = await Usages.executedAction(guildId, "Whitelist", "**__No users or roles in whitelist :__**");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      const list = Array.from(session.whitelist).map((id) => {
        if (message.guild?.roles.cache.has(id)) return `<@&${id}>`;
        return `<@${id}>`;
      }).join(" ");
      const embed = await Usages.executedAction(guildId, `Whitelist (${session.whitelist.size})`, `**__Whitelisted Users & Roles :__** ${list}`);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    if (sub === "clear") {
      if (session.whitelist.size === 0) {
        const embed = await Usages.alreadyAction(guildId, "Your list is already clear");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
      for (const targetId of session.whitelist) {
        await channel.permissionOverwrites.delete(targetId).catch(() => {});
      }
      session.whitelist.clear();
      VoiceMemoryStore.sync(channel.id);
      await PreferencesStore.clearWhitelist(guildId!, member.id);
      const embed = await Usages.executedAction(guildId, "Whitelist Cleared", "**__Whitelist has been cleared.__**");
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    if (sub === "add") {
      const { members: extractedMembers, roles: targetRoles } = await extractTargets(message, args.slice(1), 5);
      const validTargets = extractedMembers.filter((t) => !t.user.bot);

      if (validTargets.length === 0 && targetRoles.length === 0) {
        await message.reply({
          ...(await Usages.invalidCommand(guildId, ".v wl add")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      if (validTargets.some((t) => t.id === member.id)) {
        await message.reply({
          ...(await Usages.stopDoingThat(guildId, "You Can't Whitelist yourself")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const nonWhitelistedMembers = validTargets.filter((t) => !session.whitelist.has(t.id));
      const nonWhitelistedRoles = targetRoles.filter((r) => !session.whitelist.has(r.id));

      if (nonWhitelistedMembers.length === 0 && nonWhitelistedRoles.length === 0) {
        await message.reply({
          ...(await Usages.stopDoingThat(guildId, "You Can't Whitelist someone he is already Whitelisted")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const addedMentions: string[] = [];

      for (const role of nonWhitelistedRoles) {
        if (session.whitelist.size >= 10) break;
        session.whitelist.add(role.id);
        await PreferencesStore.addWhitelist(guildId!, member.id, role.id);
        await channel.permissionOverwrites.edit(role, {
          Connect: true,
          ViewChannel: true,
          SendMessages: true,
          Speak: true,
          Stream: true
        }).catch(() => {});
        addedMentions.push(`<@&${role.id}>`);
      }

      for (const t of nonWhitelistedMembers) {
        if (session.whitelist.size >= 10) break;
        session.whitelist.add(t.id);
        await PreferencesStore.addWhitelist(guildId!, member.id, t.id);
        await VoicePermissionsManager.permitMember(channel, t);
        addedMentions.push(`<@${t.id}>`);
      }

      VoiceMemoryStore.sync(channel.id);
      if (addedMentions.length === 0) {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Limit Reached. You can only have a maximum of whitelisted entries :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const embed = await Usages.executedAction(guildId, "Whitelisted", `**__Added to whitelist :__** ${addedMentions.join(" ")}`);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    if (sub === "remove" || sub === "del") {
      const { members: extractedMembers, roles: targetRoles } = await extractTargets(message, args.slice(1), 5);
      if (extractedMembers.length === 0 && targetRoles.length === 0) {
        await message.reply({
          ...(await Usages.invalidCommand(guildId, ".v wl remove")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const inWhitelistMembers = extractedMembers.filter((t) => session.whitelist.has(t.id));
      const inWhitelistRoles = targetRoles.filter((r) => session.whitelist.has(r.id));

      if (inWhitelistMembers.length === 0 && inWhitelistRoles.length === 0) {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Selected users or roles are not in the whitelist :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const removedMentions: string[] = [];

      for (const r of inWhitelistRoles) {
        session.whitelist.delete(r.id);
        await PreferencesStore.removeWhitelist(guildId!, member.id, r.id);
        await channel.permissionOverwrites.delete(r).catch(() => {});
        removedMentions.push(`<@&${r.id}>`);
      }

      for (const t of inWhitelistMembers) {
        session.whitelist.delete(t.id);
        await PreferencesStore.removeWhitelist(guildId!, member.id, t.id);
        await VoicePermissionsManager.resetMember(channel, t);
        removedMentions.push(`<@${t.id}>`);
      }

      VoiceMemoryStore.sync(channel.id);
      const embed = await Usages.executedAction(guildId, "Whitelist Removed", `**__Removed from whitelist :__** ${removedMentions.join(" ")}`);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
      return;
    }

    await message.reply({
      ...(await Usages.whatDidYouMean(guildId, ".v wl", "add | remove | list")),
      allowedMentions: { parse: [] }
    });
  }
};
