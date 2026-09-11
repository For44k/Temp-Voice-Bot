import { Message, GuildMember, VoiceChannel } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { VoiceMemoryStore } from "../../cache/voice.store";
import { PanelBuilder } from "../../../../core/interactions/panel.builder";
import { Usages } from "../../../../shared/embeds/usages";

export const panelCommand: ICommand = {
  name: "panel",
  prefixAliases: ["panel", "controlpanel"],
  async executePrefix(message: Message): Promise<void> {
    const member = message.member as GuildMember;
    const channel = member?.voice?.channel as VoiceChannel | null;
    const guildId = message.guildId!;

    if (!channel) {
      await message.reply({
        ...(await Usages.notInVoice(guildId)),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const session = VoiceMemoryStore.get(channel.id);
    if (!session) {
      await message.reply({
        ...(await Usages.impossible(guildId, "**__This voice channel is not managed by the bot :__**")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const fullPayload = await PanelBuilder.createFullPanelPayload(guildId, session.ownerId, true);
    await message.reply(fullPayload).catch(() => {});
  }
};
