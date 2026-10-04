import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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
import { DefaultAssetService } from "../services/default-assets.service";
import { V2Payload } from "../../shared/types/v2.types";

export class PanelBuilder {
  public static getPanelRow1(guildId?: string | null): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("modal_open:rename").setEmoji(ThemeManager.getThemeEmoji(guildId, "rename")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("btn:lock").setEmoji(ThemeManager.getThemeEmoji(guildId, "lock")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("btn:unlock").setEmoji(ThemeManager.getThemeEmoji(guildId, "unlock")).setStyle(ButtonStyle.Secondary)
    );
  }

  public static getPanelRow2(guildId?: string | null): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("btn:hide").setEmoji(ThemeManager.getThemeEmoji(guildId, "hide")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("btn:unhide").setEmoji(ThemeManager.getThemeEmoji(guildId, "unhide")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("modal_open:limit").setEmoji(ThemeManager.getThemeEmoji(guildId, "limit")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("btn:antiabuse").setEmoji(ThemeManager.getThemeEmoji(guildId, "antiabuse")).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("btn:info").setEmoji(ThemeManager.getThemeEmoji(guildId, "info")).setStyle(ButtonStyle.Secondary)
    );
  }

  public static async createPanel(guildId: string, memberId: string): Promise<V2Payload> {
    const color = ThemeManager.getColorSync(guildId);
    const guildConfig = GuildMemoryStore.resolve(guildId);
    let panelImageUrl = guildConfig?.panelImageUrl;

    if (memberId) {
      const profile = UserProfileStore.getSync(memberId, guildId) || await UserProfileStore.get(memberId, guildId);
      if (profile?.equippedBannerUrl) {
        panelImageUrl = profile.equippedBannerUrl;
      }
    }

    if (!panelImageUrl) {
      panelImageUrl = DefaultAssetService.getDefaultPanelImageSync() || (await DefaultAssetService.getDefaultPanelImageUrl()) || undefined;
    }

    const resolvedColor = color ? resolveColor(color) : null;
    const container = new ContainerBuilder();
    if (resolvedColor) container.setAccentColor(resolvedColor);

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## __**<@${memberId}> Enjoy**__`)
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

    const supportBtnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("btn:need_help")
        .setLabel("Need Help")
        .setStyle(ButtonStyle.Secondary)
    );

    const ticketBtnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("btn:ticket")
        .setLabel("Ticket")
        .setStyle(ButtonStyle.Secondary)
    );

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`✦ ・ For voice assistance, join a support voice channel`)
      )
      .addActionRowComponents(supportBtnRow)
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`✦ ・ To report any issues on the server, please open a ticket.`)
      )
      .addActionRowComponents(ticketBtnRow)
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(this.getPanelRow1(guildId))
      .addActionRowComponents(this.getPanelRow2(guildId))
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Enjoy your voice channel`)
      );

    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container]
    };
  }

  public static async createExtraPanel(guildId: string): Promise<V2Payload> {
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
        new TextDisplayBuilder().setContent(`## ${extraEmoji} Extra Voice Features`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`- __Voice Moderation Tools: Mute or deafen members inside your voice room__  ⁘`)
      )
      .addActionRowComponents(muteRow)
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`- __Advanced Rejection Tools: Temporarily or randomly remove users__  ⁘`)
      )
      .addActionRowComponents(rejectRow);

    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container]
    };
  }

  public static async createMusicActivityPanel(guildId: string): Promise<V2Payload> {
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
        .setLabel("Launch.A")
        .setEmoji(activityEmoji)
        .setStyle(ButtonStyle.Secondary)
    );

    const container = new ContainerBuilder();
    if (resolvedColor) container.setAccentColor(resolvedColor);

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## <a:anim_extra_cb:1546633992030265507> Music & Activities`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`- __Click the first button to get a music bot, or the second button to launch a voice activity__  ⁘`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(actionRow)
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container]
    };
  }

  public static async createFullPanelPayload(
    guildId: string,
    memberId: string
  ): Promise<V2Payload> {
    const config = GuildMemoryStore.resolve(guildId) ?? await GuildMemoryStore.resolveAsync(guildId);
    const panelPayload = await this.createPanel(guildId, memberId);

    if (config?.twoPanelsEnabled) {
      const musicActivityPayload = await this.createMusicActivityPanel(guildId);
      return {
        flags: MessageFlags.IsComponentsV2,
        components: [
          ...panelPayload.components,
          ...musicActivityPayload.components
        ],
        allowedMentions: { parse: [] }
      };
    }

    return {
      flags: MessageFlags.IsComponentsV2,
      components: panelPayload.components,
      allowedMentions: { parse: [] }
    };
  }
}
