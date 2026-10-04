import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceClaimService } from "../../services/voice-claim.service";
import { Usages } from "../../../../shared/embeds/usages";

export const claimCommand: ICommand = {
  name: "claim",
  prefixAliases: ["claim"],
  async executePrefix(message: Message): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member.voice.channel as VoiceChannel | null;
    const guildId = message.guildId;

    const result = await VoiceClaimService.claimChannel(channel, member);

    switch (result.status) {
      case "not_in_voice": {
        await message.reply({ ...(await Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
        return;
      }
      case "not_active_voice": {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Channel is not managed :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "already_owner": {
        await message.reply({
          ...(await Usages.stopDoingThat(guildId, "You are already the owner of this channel")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "owner_still_present": {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__The owner is still inside the voice channel :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "failed": {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Failed to claim channel on Discord :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }
      case "claimed": {
        const embed = await Usages.executedAction(
          guildId,
          "Claim",
          `**__Channel Claimed :__** <@${member.id}> is now the owner of the channel!`
        );
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
    }
  }
};
