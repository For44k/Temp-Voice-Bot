import {
  Message,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
  resolveColor
} from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { GlobalMusicBotModel } from "../../../../database/schemas/global-music-bot.schema";
import { GuildMemoryStore } from "../../cache/guild.store";
import { Usages } from "../../../../shared/embeds/usages";
import { ThemeManager } from "../../../../core/config/theme";

export const musicCommand: ICommand = {
  name: "music",
  prefixAliases: ["music", "musicbot", "musicbots", "mbot"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const guildId = message.guildId;
    if (!guildId) return;

    const sub = args[0]?.toLowerCase();
    const color = ThemeManager.getColorSync(guildId);
    const accentColor = color ? resolveColor(color) : null;
    const starEmoji = "<a:white_stars:1547180877962944585>";

    if (sub === "add" || sub === "remove" || sub === "delete" || sub === "del") {
      const hasPermission =
        message.member?.permissions.has(PermissionFlagsBits.ManageGuild) ||
        message.member?.permissions.has(PermissionFlagsBits.Administrator);

      if (!hasPermission) {
        await message.reply({
          ...(await Usages.impossible(
            guildId,
            "You need Manage Server or Administrator permissions to manage music bots"
          )),
          allowedMentions: { parse: [] }
        });
        return;
      }
    }

    if (!sub || sub === "list") {
      const allBots = await GlobalMusicBotModel.find().lean();
      const container = new ContainerBuilder();
      if (accentColor) container.setAccentColor(accentColor);

      if (allBots.length === 0) {
        container
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${starEmoji} __Global Music Bots..!!__`)
          )
          .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `> -# __No global music bots registered yet.__\n\n- __Add one using:__ \`.v music add @Bot <prefix>\``
            )
          )
          .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

        await message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container],
          allowedMentions: { parse: [] }
        });
        return;
      }

      const listStr = allBots
        .map((b) => `- __Bot :__ <@${b.botId}> ⌇ **Prefix :** \`${b.prefix}\` ⌇ **ID :** \`${b.botId}\``)
        .join("\n");

      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${starEmoji} __Global Music Bots (${allBots.length})..!!__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(listStr))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (sub === "add") {
      const config = GuildMemoryStore.resolve(guildId);
      if (!config?.twoPanelsEnabled) {
        await message.reply({
          ...(await Usages.impossible(
            guildId,
            "Two Panels feature is disabled. Please enable Secondary Music & Activities Panel in `.v setup` first."
          )),
          allowedMentions: { parse: [] }
        });
        return;
      }

      let targetBotId: string | null = null;
      const mention = message.mentions.users.first();
      if (mention) {
        targetBotId = mention.id;
      } else if (args[1]) {
        targetBotId = args[1].replace(/[<@!>]/g, "").trim();
      }

      const prefix = args[2]?.trim();

      if (!targetBotId || !prefix || !/^\d{17,20}$/.test(targetBotId)) {
        await message.reply({
          ...(await Usages.invalidCommand(
            guildId,
            "`.v music add <@Bot | botId> <prefix>`",
            "`.v music add @Hydra .` or `.v music add 547905866255433758 !`"
          )),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const targetUser = await message.client.users.fetch(targetBotId).catch(() => null);
      if (!targetUser) {
        await message.reply({
          ...(await Usages.impossible(guildId, "Bot user not found. Please check the provided Bot ID or mention.")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      if (!targetUser.bot) {
        await message.reply({
          ...(await Usages.impossible(guildId, "Invalid Target: The specified user is not a Discord bot account.")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      await GlobalMusicBotModel.updateOne(
        { botId: targetBotId },
        { $set: { botId: targetBotId, prefix, addedAt: new Date() } },
        { upsert: true }
      ).exec();

      const container = new ContainerBuilder();
      if (accentColor) container.setAccentColor(accentColor);

      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${starEmoji} __Music Bot Registred..!!__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `- __Bot :__ <@${targetBotId}>\n- __BotId :__ **\`${targetBotId}\`**\n- __Prefix :__ \`${prefix}\``
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (sub === "remove" || sub === "delete" || sub === "del") {
      let targetBotId: string | null = null;
      const mention = message.mentions.users.first();
      if (mention) {
        targetBotId = mention.id;
      } else if (args[1]) {
        targetBotId = args[1].replace(/[<@!>]/g, "").trim();
      }

      if (!targetBotId || !/^\d{17,20}$/.test(targetBotId)) {
        await message.reply({
          ...(await Usages.invalidCommand(
            guildId,
            "`.v music remove <@Bot | botId>`",
            "`.v music remove @Hydra` or `.v music remove 547905866255433758`"
          )),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const deleted = await GlobalMusicBotModel.findOneAndDelete({ botId: targetBotId }).exec();
      if (!deleted) {
        await message.reply({
          ...(await Usages.impossible(guildId, `Music bot <@${targetBotId}> is not in the global registry.`)),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const container = new ContainerBuilder();
      if (accentColor) container.setAccentColor(accentColor);

      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${starEmoji} __Music Bot Removed..!!__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `- __Bot :__ <@${targetBotId}>\n- __BotId :__ **\`${targetBotId}\`**`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
        allowedMentions: { parse: [] }
      });
      return;
    }

    await message.reply({
      ...(await Usages.invalidCommand(guildId, "`.v music <add | remove | list>`", "`.v music add @Hydra .`")),
      allowedMentions: { parse: [] }
    });
  }
};
