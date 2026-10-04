import {
  Message,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  MessageFlags,
  resolveColor
} from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { Usages } from "../../../../shared/embeds/usages";
import { BotGateway } from "../../../../core/gateway/bot.gateway";
import { ThemeManager } from "../../../../core/config/theme";
import { ENV } from "../../../../core/config/env";
import { V2Payload } from "../../../../shared/types/v2.types";

export type Target = "main";

export function buildPayload(target: Target = "main", botUser?: { id: string; username: string }, guildId?: string): V2Payload {
  const targetTag = "main";
  const mainBotId = BotGateway.client?.user?.id || ENV.CLIENT_ID;
  const botId = botUser?.id || mainBotId;
  const botMention = `<@${botId}>`;
  const color = guildId ? ThemeManager.getColorSync(guildId) : null;
  const accentColor = color ? resolveColor(color) : null;

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`setbot:avatar:${targetTag}`)
      .setLabel("Avatar")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`setbot:banner:${targetTag}`)
      .setLabel("Banner")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`setbot:bio:${targetTag}`)
      .setLabel("Bio")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`setbot:nameplate:${targetTag}`)
      .setLabel("Nameplate")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`setbot:panelimage:${targetTag}`)
      .setLabel("Panel Image")
      .setStyle(ButtonStyle.Success)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`setbot:reset:${targetTag}`)
      .setLabel("Reset...")
      .setStyle(ButtonStyle.Danger)
  );

  const container = new ContainerBuilder();
  if (accentColor) container.setAccentColor(accentColor);

  container
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# <a:eedgy_hkwave:1545100098470416445> __You Want to Customize ${botMention} Profile..!!__`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `- __Click Buttons Below To Make a unique Profile For Bot...!!__`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addActionRowComponents(row1)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addActionRowComponents(row2)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}

export const setbotCommand: ICommand = {
  name: "setbot",
  prefixAliases: ["setbot", "botprofile", "botconfig"],
  async executePrefix(message: Message, _args: string[]): Promise<void> {
    const guildId = message.guildId;
    if (!guildId) return;

    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({
        ...(await Usages.impossible(guildId, "You need Administrator permissions to use this")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const targetUser = BotGateway.client?.user ?? (message.client.user ?? undefined);
    const payload = buildPayload("main", targetUser, guildId);
    await message.reply(payload);
  }
};
