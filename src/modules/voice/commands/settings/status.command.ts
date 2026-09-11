import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceLifecycleService } from "../../services/voice-lifecycle.service";
import { Usages } from "../../../../shared/embeds/usages";
import { ActionLogger } from "../../../../core/logger/action.logger";

export const statusCommand: ICommand = {
  name: "status",
  prefixAliases: ["status", "vstatus", "setstatus"],
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

    const newStatus = args.join(" ").trim();
    if (!newStatus) {
      
      try {
        await message.client.rest.put(
          `/channels/${channel.id}/voice-status`,
          { body: { status: "" } }
        );
        const embed = await Usages.executedAction(
          guildId,
          "Voice Status",
          "Voice channel status has been cleared."
        );
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
      } catch (err: any) {
        const embed = await Usages.impossible(guildId, `Failed to clear voice status: ${err.message}`);
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
      }
      return;
    }

    const sanitized = Usages.sanitize(newStatus).slice(0, 500);
    if (!Usages.isValidChannelName(sanitized)) {
      await message.reply({
        ...(await Usages.invalidInputWarning(guildId)),
        allowedMentions: { parse: [] }
      });
      return;
    }

    try {
      await message.client.rest.put(
        `/channels/${channel.id}/voice-status`,
        { body: { status: sanitized } }
      );

      ActionLogger.logAction({
        guildId: guildId!,
        executorId: member.id,
        action: "Voice Status Changed",
        channelName: channel.name,
        details: sanitized
      }).catch(() => {});

      const embed = await Usages.executedAction(
        guildId,
        "Voice Status",
        `**__Voice status updated to :__ **\`${sanitized}\`**`
      );
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
    } catch (err: any) {
      const embed = await Usages.impossible(guildId, `Failed to set voice status: ${err.message}`);
      await message.reply({ ...embed, allowedMentions: { parse: [] } });
    }
  }
};
