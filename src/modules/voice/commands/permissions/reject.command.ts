import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { VoicePermissionsManager } from "../../services/voice-permission.service";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { Usages } from "../../../../shared/embeds/usages";
import { extractTargets } from "../../../../shared/utils/member-parser";

export const rejectCommand: ICommand = {
  name: "reject",
  prefixAliases: ["reject", "block"],
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

    const { members: extractedMembers, roles: targetRoles } = await extractTargets(message, args, 4);

    if (extractedMembers.some((t) => t.id === member.id)) {
      await message.reply({
        ...(await Usages.selfReject(guildId)),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const targetMembers = extractedMembers.filter((target) =>
      VoiceLifecycleService.canManageTarget(channel.id, member.id, target.id)
    );

    if (targetMembers.length === 0 && targetRoles.length === 0) {
      await message.reply({
        ...(await Usages.invalidCommand(
          guildId,
          "`.v reject`",
          "@user | username | `ID`\n`.v reject` @role | rolename | `ID`"
        )),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const appliedMentions: string[] = [];

    if (targetRoles.length > 0) {
      for (const role of targetRoles) {
        await channel.permissionOverwrites.edit(role, {
          Connect: false,
          ViewChannel: true,
          SendMessages: false
        }).catch(() => {});

        for (const [, chMember] of channel.members) {
          if (chMember.roles.cache.has(role.id) && chMember.id !== member.id) {
            chMember.voice.disconnect().catch(() => {});
          }
        }
        appliedMentions.push(`<@&${role.id}>`);
      }
    }

    if (targetMembers.length > 0) {
      const notYetRejected = targetMembers.filter((m) => {
        const overwrite = channel.permissionOverwrites.cache.get(m.id);
        return !overwrite || overwrite.deny.has("Connect") === false;
      });

      if (notYetRejected.length === 0 && targetRoles.length === 0) {
        const embed = await Usages.stopDoingThat(guildId, "You Can't Reject someone he is already Rejected");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }

      if (notYetRejected.length > 0) {
        await VoicePermissionsManager.bulkReject(channel, notYetRejected);

        const session = VoiceMemoryStore.get(channel.id);
        if (session) {
          for (const m of notYetRejected) {
            session.whitelist.delete(m.id);
          }
          VoiceMemoryStore.sync(channel.id);
        }

        for (const m of notYetRejected) {
          appliedMentions.push(`<@${m.id}>`);
        }
      }
    }

    const embed = await Usages.executedAction(
      guildId,
      "Reject",
      `__Target has been rejected:__ ${appliedMentions.join(" ")}`
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
