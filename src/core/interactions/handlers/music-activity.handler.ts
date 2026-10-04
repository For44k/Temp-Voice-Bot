import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  GuildMember,
  VoiceChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  MessageFlags,
  resolveColor,
  Routes
} from "discord.js";
import { ThemeManager } from "../../config/theme";
import { GlobalMusicBotModel, IGlobalMusicBot } from "../../../database/schemas/global-music-bot.schema";
import { FastLogger } from "../../logger/logger";

export class MusicActivityHandler {
  public static readonly STAR_EMOJI = "<a:white_stars:1547180877962944585>";
  public static readonly WAIT_EMOJI = "<a:gh1y1ne:1546859779333292103>";
  private static cachedBots: IGlobalMusicBot[] = [];
  private static lastBotFetch = 0;

  private static async getMusicBots(): Promise<IGlobalMusicBot[]> {
    const now = Date.now();
    if (this.cachedBots.length > 0 && now - this.lastBotFetch < 60_000) {
      return this.cachedBots;
    }
    try {
      this.cachedBots = await GlobalMusicBotModel.find().lean();
      this.lastBotFetch = now;
    } catch (err: unknown) {
      FastLogger.error("Failed to fetch global music bots", err);
      if (this.cachedBots.length === 0) return [];
    }
    return this.cachedBots;
  }

  private static readonly ACTIVITIES: { label: string; value: string; description: string; appId: string }[] = [
    {
      label: "YouTube Together",
      value: "youtube_together",
      description: "Watch YouTube videos with friends in voice",
      appId: "755600276941176913"
    },
    {
      label: "Watch Together",
      value: "watch_together",
      description: "Stream and watch videos together",
      appId: "755600276941176913"
    },
    {
      label: "Poker Night",
      value: "poker_night",
      description: "Play Texas Hold'em poker in voice chat",
      appId: "755827207812677713"
    },
    {
      label: "Checkers in the Park",
      value: "checkers_in_the_park",
      description: "Play classic board games with friends in voice",
      appId: "832013003968348200"
    },
    {
      label: "SpellCast",
      value: "spellcast",
      description: "Word puzzle and spellcasting battle with friends",
      appId: "852509694341283871"
    },
    {
      label: "Blazing 8s",
      value: "blazing_8s",
      description: "Fast-paced classic card game for everyone",
      appId: "832025144389533716"
    },
    {
      label: "Land-io",
      value: "land_io",
      description: "Territory conquest multiplayer game in voice",
      appId: "903769130790969345"
    }
  ];

  public static async handleMusicGet(interaction: ButtonInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (!guildId || !interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral
      }).catch((replyError: unknown) => {
        FastLogger.warn(`Failed to send music get error: ${String(replyError)}`);
      });
      return;
    }

    const color = ThemeManager.getColorSync(guildId);
    const accentColor = color ? resolveColor(color) : null;

    const allBots = await this.getMusicBots();
    let foundBotMember: GuildMember | null = null;
    let foundBotConfig: IGlobalMusicBot | null = null;

    if (allBots.length > 0) {
      for (const bot of allBots) {
        const cached = interaction.guild.members.cache.get(bot.botId);
        if (cached) {
          foundBotMember = cached;
          foundBotConfig = bot;
          break;
        }
      }

      if (!foundBotMember) {
        for (const bot of allBots) {
          const fetched = await interaction.guild.members.fetch(bot.botId).catch(() => null);
          if (fetched) {
            foundBotMember = fetched;
            foundBotConfig = bot;
            break;
          }
        }
      }
    }

    const container = new ContainerBuilder();
    if (accentColor) container.setAccentColor(accentColor);

    if (foundBotMember && foundBotConfig) {
      const botName = foundBotMember.user.username;
      const avatarUrl = foundBotMember.user.displayAvatarURL({ extension: "png", size: 256 });

      const textSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### __${botName} is here to play music for you__\n> **__Type \`${foundBotConfig.prefix}\` to start listening to music.__**`
          )
        );

      if (avatarUrl) {
        textSection.setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarUrl));
      }

      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${this.STAR_EMOJI}  __I Found a Bot For You!__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addSectionComponents(textSection)
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    } else {
      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# __Oops!__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`> -# __No registered global music bot was found in this server.__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`- __Ask an administrator to add one using \`.v music add @Bot <prefix>\`.__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    }

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [container]
    }).catch((replyError: unknown) => {
      FastLogger.warn(`Failed to send music reply: ${String(replyError)}`);
    });
  }

  public static async handleActivityLaunch(interaction: ButtonInteraction): Promise<void> {
    const guildId = interaction.guildId;
    const color = guildId ? ThemeManager.getColorSync(guildId) : null;
    const accentColor = color ? resolveColor(color) : null;
    const activityEmoji = ThemeManager.getThemeEmoji(guildId, "activity");

    const container = new ContainerBuilder();
    if (accentColor) container.setAccentColor(accentColor);

    const options = this.ACTIVITIES.map((act) =>
      new StringSelectMenuOptionBuilder()
        .setLabel(act.label)
        .setValue(act.value)
        .setDescription(act.description)
    );

    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select:activity_launch")
        .setPlaceholder("Select an activity to launch...")
        .addOptions(options)
    );

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${activityEmoji} __Launch a Voice Activity__`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `- __Choose an activity below to play with your friends in voice chat and share great moments together.__`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(selectMenu);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [container]
    }).catch((replyError: unknown) => {
      FastLogger.warn(`Failed to send activity launch reply: ${String(replyError)}`);
    });
  }

  public static async handleActivitySelect(interaction: StringSelectMenuInteraction): Promise<void> {
    const member = interaction.member;
    if (!member || !(member instanceof GuildMember)) return;
    const voiceChannel = member.voice.channel as VoiceChannel | null;
    const guildId = interaction.guildId;
    const color = guildId ? ThemeManager.getColorSync(guildId) : null;
    const accentColor = color ? resolveColor(color) : null;
    const activityEmoji = ThemeManager.getThemeEmoji(guildId, "activity");

    if (!voiceChannel || !voiceChannel.isVoiceBased()) {
      const container = new ContainerBuilder();
      if (accentColor) container.setAccentColor(accentColor);

      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${this.WAIT_EMOJI} __Voice Channel Required__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`- __Please join a voice channel first.__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container]
      }).catch((replyError: unknown) => {
        FastLogger.warn(`Failed to send voice required reply: ${String(replyError)}`);
      });
      return;
    }

    const selectedValue = interaction.values[0];
    const activityConfig = this.ACTIVITIES.find((a) => a.value === selectedValue) || this.ACTIVITIES[0];
    if (!activityConfig) return;

    try {
      let inviteUrl: string | null = null;
      try {
        const restRes = (await interaction.client.rest.post(
          Routes.channelInvites(voiceChannel.id),
          {
            body: {
              max_age: 86400,
              max_uses: 0,
              target_type: 2,
              target_application_id: activityConfig.appId
            }
          }
        )) as { code: string };
        if (restRes?.code) {
          inviteUrl = `https://discord.gg/${restRes.code}`;
        }
      } catch {
        try {
          const standardInvite = await voiceChannel.createInvite({
            maxAge: 86400,
            maxUses: 0
          });
          inviteUrl = `https://discord.gg/${standardInvite.code}`;
        } catch (inviteErr: unknown) {
          FastLogger.error("Failed to create fallback invite", inviteErr);
        }
      }

      if (!inviteUrl) {
        throw new Error("Failed to create voice channel activity invite");
      }

      const container = new ContainerBuilder();
      if (accentColor) container.setAccentColor(accentColor);

      const launchButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setURL(inviteUrl)
          .setLabel(`Launch ${activityConfig.label}`)
          .setEmoji(activityEmoji)
      );

      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${activityEmoji} __Voice Activity Launched!__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `- <@${member.user.id}> **__launched ${activityConfig.label} in__** <#${voiceChannel.id}>\n> ⟢ **__Click the button below to join the voice activity:__**`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addActionRowComponents(launchButtonRow)
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      await interaction.deleteReply().catch(async () => {
        await interaction.deferUpdate().catch(() => {});
      });

      if (voiceChannel.isSendable()) {
        await voiceChannel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        }).catch((sendError: unknown) => {
          FastLogger.warn(`Failed to send activity announcement to channel: ${String(sendError)}`);
        });
      }
    } catch (err: unknown) {
      FastLogger.error("Error launching activity", err);
      const container = new ContainerBuilder();
      if (accentColor) container.setAccentColor(accentColor);

      container
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${this.WAIT_EMOJI} __Activity Launch Error__`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> -# __Could not create activity session. Ensure the bot has \`Create Instant Invite\` permissions in <#${voiceChannel.id}>.__`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      await interaction.update({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container]
      }).catch(async () => {
        await interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container]
        }).catch(() => {});
      });
    }
  }
}
