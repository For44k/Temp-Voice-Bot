import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceAuthService } from "../../services/voice-auth.service";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";
import { extractTargets } from "../../../../shared/utils/member-parser";

export const permitCommand: ICommand = {
  name: "permit",
  prefixAliases: ["permit", "perm", "pemir"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    if (!channel) {
      await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    if (!VoiceAuthService.isManager(channel.id, member.id)) {
      await message.reply({ ...(await Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
      return;
    }

    const { members: targetMembers, roles: targetRoles } = await extractTargets(message, args, 4);

    if (targetMembers.length === 0 && targetRoles.length === 0) {
      await message.reply({
        ...(await Usages.invalidCommand(
          guildId,
          "`.v permit`",
          "@user | username | `ID`\n`.v permit` @role | rolename | `ID`"
        )),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const appliedMentions: string[] = [];

    if (targetRoles.length > 0) {
      for (const role of targetRoles) {
        await channel.permissionOverwrites.edit(role, {
          Connect: true,
          ViewChannel: true,
          SendMessages: true,
          Speak: true,
          Stream: true
        }).catch(() => {});
        appliedMentions.push(`<@&${role.id}>`);
      }
    }

    if (targetMembers.length > 0) {
      if (targetMembers.some((t) => t.id === member.id)) {
        await message.reply({
          ...(await Usages.stopDoingThat(guildId, "You Can't Permit yourself")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const notYetPermitted = targetMembers.filter((m) => {
        const overwrite = channel.permissionOverwrites.cache.get(m.id);
        return !overwrite || overwrite.allow.has("Connect") === false;
      });

      if (notYetPermitted.length === 0 && targetRoles.length === 0) {
        await message.reply({
          ...(await Usages.stopDoingThat(guildId, "You Can't Permit someone he is already Permitted")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      if (notYetPermitted.length > 0) {
        await VoicePermissionsManager.bulkPermit(channel, notYetPermitted);

        const session = VoiceMemoryStore.get(channel.id);
        if (session) {
          for (const m of notYetPermitted) {
            session.whitelist.add(m.id);
          }
          VoiceMemoryStore.sync(channel.id);
        }

        for (const m of notYetPermitted) {
          appliedMentions.push(`<@${m.id}>`);
        }
      }
    }

    const embed = await Usages.executedAction(
      guildId,
      "Permit",
      `__Target has been permitted:__ ${appliedMentions.join(" ")}`
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
