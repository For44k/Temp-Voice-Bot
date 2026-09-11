import { Message, GuildMember } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { GuildMemoryStore } from "../../cache/guild.store";
import { Usages } from "../../../../shared/embeds/usages";

export const onetapCommand: ICommand = {
  name: "tap",
  prefixAliases: ["tap", "onetap"],
  async executePrefix(message: Message): Promise<void> {
    const guildId = message.guildId;
    if (!guildId) return;

    const config = await GuildMemoryStore.resolve(guildId);
    if (!config || !config.generatorId) {
      await message.reply({
        ...(await Usages.impossible(guildId, "**__Setup channel is not configured on this server :__**")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const member = message.member as GuildMember;
    if (member.voice.channel) {
      const targetChannel = message.guild?.channels.cache.get(config.generatorId);
      if (targetChannel?.isVoiceBased()) {
        await member.voice.setChannel(targetChannel);
        const embed = await Usages.executedAction(
          guildId,
          "One Tap",
          `**__Moved you to__** <#${config.generatorId}> **__to create your room.__**`
        );
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
        return;
      }
    }

    const embed = await Usages.executedAction(
      guildId,
      "One Tap",
      `**__Join__** <#${config.generatorId}> **__to instantly create your personal voice channel.__**`
    );
    await message.reply({ ...embed, allowedMentions: { parse: [] } });
  }
};
