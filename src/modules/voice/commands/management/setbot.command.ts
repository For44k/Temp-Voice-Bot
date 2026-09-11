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
import { TaskWorkerQueue } from "../../../../core/workers/task-worker.queue";
import { ThemeManager } from "../../../../core/config/theme";

export type Target = "main" | "worker";

export function buildPayload(target: Target = "main", botUser?: { id: string; username: string }, guildId?: string) {
  const targetTag = target === "worker" ? "worker" : "main";
  const botId = botUser?.id || (target === "worker" ? TaskWorkerQueue.client?.user?.id : BotGateway.client.user?.id);
  const botMention = botId ? `<@${botId}>` : (target === "worker" ? "Worker Bot" : "Main Bot");
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
    flags: MessageFlags.IsComponentsV2 as any,
    components: [container] as any
  };
}

export const setbotCommand: ICommand = {
  name: "setbot",
  prefixAliases: ["setbot", "botprofile", "botconfig"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const guildId = message.guildId;
    if (!guildId) return;

    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({
        ...(await Usages.impossible(guildId, "**__You need Administrator permissions to use this :__**")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    let target: Target = "main";
    let targetUser: { id: string; username: string } | undefined = BotGateway.client.user ?? undefined;

    const mentioned = message.mentions.users.first();
    const firstArg = args[0]?.trim().toLowerCase();

    if (mentioned) {
      if (TaskWorkerQueue.hasWorker && TaskWorkerQueue.client?.user?.id === mentioned.id) {
        target = "worker";
        targetUser = TaskWorkerQueue.client?.user ?? undefined;
      } else {
        target = "main";
        targetUser = mentioned;
      }
    } else if (firstArg === "worker" || firstArg === "3045" || firstArg === "helper") {
      target = "worker";
      targetUser = TaskWorkerQueue.client?.user ?? undefined;
    } else if (firstArg === "main" || firstArg === "3067") {
      target = "main";
      targetUser = BotGateway.client.user ?? undefined;
    } else if (firstArg) {
      const rawId = firstArg.replace(/[<@!>]/g, "");
      if (TaskWorkerQueue.hasWorker && TaskWorkerQueue.client?.user?.id === rawId) {
        target = "worker";
        targetUser = TaskWorkerQueue.client?.user ?? undefined;
      } else if (BotGateway.client.user?.id === rawId) {
        target = "main";
        targetUser = BotGateway.client.user;
      }
    }

    const payload = buildPayload(target, targetUser, guildId);
    await message.reply(payload);
  }
};

