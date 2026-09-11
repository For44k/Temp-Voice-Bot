import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  resolveColor
} from "discord.js";
import { ThemeManager } from "../config/theme";
import { GuildMemoryStore } from "../../modules/voice/cache/guild.store";
import { UserProfileStore } from "../../modules/user/cache/user-profile.store";

export class PanelBuilder {
  private static readonly PANEL_TITLE_EMOJI = "<a:pink_Heartjump:1546859773721444382>";

  public static getPanelRow1(guildId?: string | null): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("btn:lock").setEmoji(ThemeManager.getThemeEmoji(guildId, "lock")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("btn:unlock").setEmoji(ThemeManager.getThemeEmoji(guildId, "unlock")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("btn:hide").setEmoji(ThemeManager.getThemeEmoji(guildId, "hide")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("btn:unhide").setEmoji(ThemeManager.getThemeEmoji(guildId, "unhide")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("btn:antiabuse").setEmoji(ThemeManager.getThemeEmoji(guildId, "antiabuse")).setStyle(ButtonStyle.Secondary)
    );
  }

  public static getPanelRow2(guildId?: string | null): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("modal_open:limit").setEmoji(ThemeManager.getThemeEmoji(guildId, "limit")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("modal_open:rename").setEmoji(ThemeManager.getThemeEmoji(guildId, "rename")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("btn:info").setEmoji(ThemeManager.getThemeEmoji(guildId, "info")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("btn:claim").setEmoji(ThemeManager.getThemeEmoji(guildId, "claim")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("btn:extra").setEmoji(ThemeManager.getThemeEmoji(guildId, "extra")).setStyle(ButtonStyle.Secondary)
    );
  }

  public static async createPanel(guildId: string, memberId: string, includeGameSelect: boolean = true): Promise<any> {
    const color = ThemeManager.getColorSync(guildId);
    const guildConfig = GuildMemoryStore.resolve(guildId);
    let panelImageUrl = guildConfig?.panelImageUrl;

    if (memberId) {
      const profile = UserProfileStore.getSync(memberId, guildId) || await UserProfileStore.get(memberId, guildId);
      if (profile?.equippedBannerUrl) {
        panelImageUrl = profile.equippedBannerUrl;
      }
    }

    const resolvedColor = color ? resolveColor(color) : null;
    const container = new ContainerBuilder();
    if (resolvedColor) container.setAccentColor(resolvedColor);

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${this.PANEL_TITLE_EMOJI} ⌇ __Voice Panel..!!__`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`> ⟢ <a:94071angelheart:1546859784374976603>・ **__Welcome : <@${memberId}>__**`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    if (panelImageUrl) {
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(panelImageUrl)
        )
      );
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    }

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `✦ ・ **__Your private room is active! Control your channel settings using the quick buttons below.__**`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(this.getPanelRow1(guildId))
      .addActionRowComponents(this.getPanelRow2(guildId));

    if (includeGameSelect) {
      const games = guildConfig?.games || [];
      const hasGames = games.length > 0;
      const options = hasGames
        ? games.slice(0, 25).map((g) => {
          const opt = new StringSelectMenuOptionBuilder()
            .setLabel(g.name)
            .setValue(g.roleId)
            .setDescription(`Mention @${g.name} role`);

          if (g.emoji) {
            opt.setEmoji(g.emoji);
          }

          return opt;
        })
        : [
          new StringSelectMenuOptionBuilder()
            .setLabel("No games added yet")
            .setValue("no_games")
            .setDescription("Admins can add games via .v game add <name> @role")
        ];

      const gameMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("select:game_mention")
          .setPlaceholder("Select a game to mention its role...")
          .setDisabled(!hasGames)
          .addOptions(options)
      );

      container
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> ✦ ・ **__Looking for teammates? Select a game below to notify players!__**`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addActionRowComponents(gameMenu);
    }

    return {
      flags: MessageFlags.IsComponentsV2 as any,
      components: [container] as any
    };
  }

  public static async createExtraPanel(guildId: string): Promise<any> {
    const color = ThemeManager.getColorSync(guildId);
    const accentColor = color ? resolveColor(color) : null;
    const extraEmoji = ThemeManager.getThemeEmoji(guildId, "extra");

    const muteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("modal_open:mute")
        .setLabel("Mute")
        .setEmoji(ThemeManager.getThemeEmoji(guildId, "mute"))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("modal_open:deafen")
        .setLabel("Deafen")
        .setEmoji(ThemeManager.getThemeEmoji(guildId, "deafen"))
        .setStyle(ButtonStyle.Secondary)
    );

    const rejectRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("modal_open:temp_reject")
        .setLabel("Temp Reject")
        .setEmoji(ThemeManager.getThemeEmoji(guildId, "tempreject"))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("btn:random_reject")
        .setLabel("Random Reject")
        .setEmoji(ThemeManager.getThemeEmoji(guildId, "randomreject"))
        .setStyle(ButtonStyle.Secondary)
    );

    const container = new ContainerBuilder();
    if (accentColor) container.setAccentColor(accentColor);

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${extraEmoji} __Extra Voice Features__`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`> ⟢ **__Voice Moderation Tools :__** *Mute or deafen members inside your voice room*`)
      )
      .addActionRowComponents(muteRow)
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`> ⟢ **__Advanced Rejection Tools :__** *Temporarily or randomly remove users*`)
      )
      .addActionRowComponents(rejectRow);

    return {
      flags: MessageFlags.IsComponentsV2 as any,
      components: [container] as any
    };
  }

  public static async createMusicActivityPanel(guildId: string): Promise<any> {
    const color = ThemeManager.getColorSync(guildId);
    const resolvedColor = color ? resolveColor(color) : null;
    const musicEmoji = ThemeManager.getThemeEmoji(guildId, "music");
    const activityEmoji = ThemeManager.getThemeEmoji(guildId, "activity");

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("btn:music_get")
        .setLabel("Get.B")
        .setEmoji(musicEmoji)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("btn:activity_launch")
        .setLabel("Lunch.A")
        .setEmoji(activityEmoji)
        .setStyle(ButtonStyle.Secondary)
    );

    const container = new ContainerBuilder();
    if (resolvedColor) container.setAccentColor(resolvedColor);

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# <a:eedgy_hkwave:1545100098470416445>  __Want a Music Bot & Launch Activities..?__`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`- __Click the first button to get a music bot, or the second button to launch a voice activity.__`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(actionRow)
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    return {
      flags: MessageFlags.IsComponentsV2 as any,
      components: [container] as any
    };
  }

  public static async createFullPanelPayload(
    guildId: string,
    memberId: string,
    includeGameSelect: boolean = true
  ): Promise<any> {
    const [panelPayload, musicActivityPayload] = await Promise.all([
      this.createPanel(guildId, memberId, includeGameSelect),
      this.createMusicActivityPanel(guildId)
    ]);

    return {
      flags: MessageFlags.IsComponentsV2 as any,
      components: [
        ...panelPayload.components,
        ...musicActivityPayload.components
      ] as any,
      allowedMentions: { parse: [] }
    };
  }
}

