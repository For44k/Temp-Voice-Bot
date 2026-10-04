import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  LabelBuilder,
  FileUploadBuilder,
  PermissionFlagsBits,
  Routes,
  MessageFlags,
  REST,
  GuildMember
} from "discord.js";
import { Usages } from "../../../shared/embeds/usages";
import { safeFetchImage } from "../../../shared/utils/safe-fetch";

export class SetbotInteractionHandler {
  private static getRest(interaction: ButtonInteraction | ModalSubmitInteraction, _target?: string): REST {
    const { BotGateway } = require("../../gateway/bot.gateway");
    if (BotGateway.client?.rest) {
      return BotGateway.client.rest;
    }
    return interaction.client.rest;
  }

  public static async handleButton(interaction: ButtonInteraction): Promise<void> {
    const member = interaction.member;
    if (!member || !(member instanceof GuildMember)) return;
    const guildId = interaction.guildId;
    if (!guildId) return;

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        ...(await Usages.impossible(guildId, "You need Administrator permissions to use this")),
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const parts = interaction.customId.split(":");
    const action = parts[1];
    const target = parts[2] || "main";

    if (action === "avatar") {
      try {
        const fileUpload = new FileUploadBuilder()
          .setCustomId("avatar_file")
          .setRequired(true);

        const label = new LabelBuilder()
          .setLabel(`Upload ${target === "worker" ? "Worker" : "Main"} Bot Avatar`)
          .setDescription("Select or drop an avatar image file")
          .setFileUploadComponent(fileUpload);

        const modal = new ModalBuilder()
          .setCustomId(`setbot:avatar_modal:${target}`)
          .setTitle(`Set ${target === "worker" ? "Worker" : "Main"} Bot Avatar`)
          .addLabelComponents(label);

        await interaction.showModal(modal);
        return;
      } catch {
        const modal = new ModalBuilder()
          .setCustomId(`setbot:avatar_modal:${target}`)
          .setTitle(`Set ${target === "worker" ? "Worker" : "Main"} Bot Avatar`)
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("avatar_url")
                .setLabel("Image URL (PNG, JPG, GIF, WebP)")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("https://example.com/avatar.png")
                .setRequired(true)
            )
          );
        await interaction.showModal(modal);
        return;
      }
    }

    if (action === "banner") {
      try {
        const fileUpload = new FileUploadBuilder()
          .setCustomId("banner_file")
          .setRequired(true);

        const label = new LabelBuilder()
          .setLabel(`Upload ${target === "worker" ? "Worker" : "Main"} Bot Banner`)
          .setDescription("Select or drop a banner image file")
          .setFileUploadComponent(fileUpload);

        const modal = new ModalBuilder()
          .setCustomId(`setbot:banner_modal:${target}`)
          .setTitle(`Set ${target === "worker" ? "Worker" : "Main"} Bot Banner`)
          .addLabelComponents(label);

        await interaction.showModal(modal);
        return;
      } catch {
        const modal = new ModalBuilder()
          .setCustomId(`setbot:banner_modal:${target}`)
          .setTitle(`Set ${target === "worker" ? "Worker" : "Main"} Bot Banner`)
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("banner_url")
                .setLabel("Image URL (PNG, JPG, GIF, WebP)")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("https://example.com/banner.png")
                .setRequired(true)
            )
          );
        await interaction.showModal(modal);
        return;
      }
    }

    if (action === "bio") {
      const modal = new ModalBuilder()
        .setCustomId(`setbot:bio_modal:${target}`)
        .setTitle(`Set ${target === "worker" ? "Worker" : "Main"} Bot Bio`)
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("bot_bio")
              .setLabel("Bot Server Bio Description")
              .setStyle(TextInputStyle.Paragraph)
              .setMaxLength(190)
              .setRequired(true)
              .setPlaceholder(`Write bio for ${target === "worker" ? "worker" : "main"} bot in this server...`)
          )
        );
      await interaction.showModal(modal);
      return;
    }

    if (action === "nameplate") {
      try {
        const modal = new ModalBuilder()
          .setCustomId(`setbot:nameplate_modal:${target}`)
          .setTitle(`${target === "worker" ? "Worker" : "Main"} Bot Nameplate`)
          .addLabelComponents(
            new LabelBuilder()
              .setLabel("Typography Font Style")
              .setDescription("Select the font typography for the bot display name")
              .setStringSelectMenuComponent(
                new StringSelectMenuBuilder()
                  .setCustomId("font_select")
                  .setPlaceholder("Choose typography font...")
                  .setMinValues(1)
                  .setMaxValues(1)
                  .setOptions([
                    { label: "Default (gg sans)", value: "11", default: true },
                    { label: "Tempo (Athletic / Fast)", value: "1" },
                    { label: "Sakura (Brush Script)", value: "3" },
                    { label: "Jellybean (Comic / Rounded)", value: "4" },
                    { label: "Modern (Geometric Sans)", value: "6" },
                    { label: "Medieval (Gothic Calligraphy)", value: "7" },
                    { label: "8bit (Pixel Arcade)", value: "8" },
                    { label: "Vampyre (Sharp Display)", value: "10" }
                  ])
              ),
            new LabelBuilder()
              .setLabel("Visual Text Effect")
              .setDescription("Select the visual treatment (Solid, Gradient, Neon, Glow)")
              .setStringSelectMenuComponent(
                new StringSelectMenuBuilder()
                  .setCustomId("effect_select")
                  .setPlaceholder("Choose visual effect...")
                  .setMinValues(1)
                  .setMaxValues(1)
                  .setOptions([
                    { label: "Solid (1 Color)", value: "1", default: true },
                    { label: "Gradient (2 Colors)", value: "2" },
                    { label: "Neon (1 Color)", value: "3" },
                    { label: "Toon (1 Color)", value: "4" },
                    { label: "Pop (1 Color)", value: "5" },
                    { label: "Glow (1 Color)", value: "6" }
                  ])
              ),
            new LabelBuilder()
              .setLabel("First Hex Color")
              .setDescription("Primary hex color (e.g. #FF69B4 or #FF2E63)")
              .setTextInputComponent(
                new TextInputBuilder()
                  .setCustomId("color1")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("#FF69B4 or #FF2E63")
                  .setRequired(true)
              ),
            new LabelBuilder()
              .setLabel("Second Hex Color")
              .setDescription("Secondary hex color (Required for Gradient effect)")
              .setTextInputComponent(
                new TextInputBuilder()
                  .setCustomId("color2")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("#8B17E4 (Gradient only)")
                  .setRequired(false)
              )
          );

        await interaction.showModal(modal);
        return;
      } catch {
        const modal = new ModalBuilder()
          .setCustomId(`setbot:nameplate_modal:${target}`)
          .setTitle(`${target === "worker" ? "Worker" : "Main"} Bot Nameplate`)
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("font_style")
                .setLabel("Font Style")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Default")
                .setRequired(true)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("effect_style")
                .setLabel("Effect Style")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Solid")
                .setRequired(true)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("color1")
                .setLabel("First Hex Color")
                .setPlaceholder("#FF69B4 or #FF2E63")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("color2")
                .setLabel("Second Hex Color (Gradient only)")
                .setPlaceholder("#8B17E4 (Optional)")
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
            )
          );
        await interaction.showModal(modal);
        return;
      }
    }

    if (action === "panelimage") {
      try {
        const fileUpload = new FileUploadBuilder()
          .setCustomId("panelimage_file")
          .setRequired(true);

        const label = new LabelBuilder()
          .setLabel("Upload Panel Image")
          .setDescription("Select or drop a voice control panel image")
          .setFileUploadComponent(fileUpload);

        const modal = new ModalBuilder()
          .setCustomId(`setbot:panelimage_modal:${target}`)
          .setTitle("Set Voice Panel Image")
          .addLabelComponents(label);

        await interaction.showModal(modal);
        return;
      } catch {
        const modal = new ModalBuilder()
          .setCustomId(`setbot:panelimage_modal:${target}`)
          .setTitle("Set Voice Panel Image")
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("panelimage_url")
                .setLabel("Panel Image URL (PNG, JPG, GIF, WebP)")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("https://example.com/banner.png")
                .setRequired(true)
            )
          );
        await interaction.showModal(modal);
        return;
      }
    }

    if (action === "reset") {
      const modal = new ModalBuilder()
        .setCustomId(`setbot:reset_modal:${target}`)
        .setTitle(`Reset ${target === "worker" ? "Worker" : "Main"} Bot`)
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("reset_target")
              .setLabel("Reset: avatar, banner, bio, nameplate, panel")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("avatar / banner / bio / nameplate / panel")
              .setRequired(true)
          )
        );
      await interaction.showModal(modal);
      return;
    }
  }

  public static async handleModal(interaction: ModalSubmitInteraction): Promise<void> {
    const member = interaction.member;
    if (!member || !(member instanceof GuildMember)) return;
    const guildId = interaction.guildId;
    if (!guildId) return;

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        ...(await Usages.impossible(guildId, "You need Administrator permissions to use this")),
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const parts = interaction.customId.split(":");
    const modalType = parts[1];
    const target = parts[2] || "main";
    const rest = this.getRest(interaction, target);

    const { BotGateway } = await import("../../gateway/bot.gateway");
    const { ENV } = await import("../../config/env");
    const botId = BotGateway.client?.user?.id || interaction.client.user?.id || ENV.CLIENT_ID;
    const botMention = `<@${botId}>`;

    const isMainInGuild = BotGateway.client?.guilds.cache.has(guildId) || interaction.client.guilds.cache.has(guildId);
    if (!isMainInGuild) {
      await interaction.reply({
        ...(await Usages.impossible(guildId, `${botMention} is not in this server. Please add ${botMention} first`)),
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (modalType === "avatar_modal") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        let buffer: Buffer | null = null;
        let contentType = "image/png";

        try {
          const files = interaction.fields.getUploadedFiles?.("avatar_file");
          if (files && files.size > 0) {
            const file = files.first();
            if (file?.url) {
              const fetchRes = await safeFetchImage(file.url);
              buffer = fetchRes.buffer;
              contentType = fetchRes.contentType;
            }
          }
        } catch { }

        if (!buffer) {
          let imageUrl = "";
          try {
            imageUrl = interaction.fields.getTextInputValue("avatar_url")?.trim() || "";
          } catch { }

          if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
            await interaction.editReply({
              ...(await Usages.impossible(guildId, "Please upload an image file or provide a valid image URL"))
            });
            return;
          }

          const fetchRes = await safeFetchImage(imageUrl);
          buffer = fetchRes.buffer;
          contentType = fetchRes.contentType;
        }

        const dataUri = `data:${contentType};base64,${buffer.toString("base64")}`;

        await rest.patch(
          Routes.guildMember(guildId, "@me"),
          { body: { avatar: dataUri } }
        );

        const embed = await Usages.executedAction(
          guildId,
          "Profile Avatar",
          `${botMention} server avatar has been successfully updated.`
        );
        await interaction.editReply({ ...embed });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const embed = await Usages.impossible(guildId, `Failed to update ${botMention} avatar: ${errorMessage}`);
        await interaction.editReply({ ...embed });
      }
      return;
    }

    if (modalType === "banner_modal") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        let buffer: Buffer | null = null;
        let contentType = "image/png";

        try {
          const files = interaction.fields.getUploadedFiles?.("banner_file");
          if (files && files.size > 0) {
            const file = files.first();
            if (file?.url) {
              const fetchRes = await safeFetchImage(file.url);
              buffer = fetchRes.buffer;
              contentType = fetchRes.contentType;
            }
          }
        } catch { }

        if (!buffer) {
          let imageUrl = "";
          try {
            imageUrl = interaction.fields.getTextInputValue("banner_url")?.trim() || "";
          } catch { }

          if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
            await interaction.editReply({
              ...(await Usages.impossible(guildId, "Please upload an image file or provide a valid image URL"))
            });
            return;
          }

          const fetchRes = await safeFetchImage(imageUrl);
          buffer = fetchRes.buffer;
          contentType = fetchRes.contentType;
        }

        const dataUri = `data:${contentType};base64,${buffer.toString("base64")}`;

        await rest.patch(
          Routes.guildMember(guildId, "@me"),
          { body: { banner: dataUri } }
        );

        const embed = await Usages.executedAction(
          guildId,
          "Profile Banner",
          `${botMention} server banner has been successfully updated.`
        );
        await interaction.editReply({ ...embed });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const embed = await Usages.impossible(guildId, `Failed to update ${botMention} banner: ${errorMessage}`);
        await interaction.editReply({ ...embed });
      }
      return;
    }

    if (modalType === "bio_modal") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        const bio = interaction.fields.getTextInputValue("bot_bio").trim();
        await rest.patch(
          Routes.guildMember(guildId, "@me"),
          { body: { bio } }
        );

        const embed = await Usages.executedAction(
          guildId,
          "Profile Bio",
          `${botMention} server bio updated to:\n>>> ${bio}`
        );
        await interaction.editReply({ ...embed });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const embed = await Usages.impossible(guildId, `Failed to update ${botMention} bio: ${errorMessage}`);
        await interaction.editReply({ ...embed });
      }
      return;
    }

    if (modalType === "nameplate_modal") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        let fontRaw = "default";
        let effectRaw = "solid";

        try {
          const selFonts = interaction.fields.getStringSelectValues?.("font_select");
          if (selFonts && selFonts.length > 0 && selFonts[0]) fontRaw = selFonts[0];
        } catch { }

        try {
          const selEffects = interaction.fields.getStringSelectValues?.("effect_select");
          if (selEffects && selEffects.length > 0 && selEffects[0]) effectRaw = selEffects[0];
        } catch { }

        if (fontRaw === "default") {
          try {
            const raw = interaction.fields.getTextInputValue("font_style")?.trim().toLowerCase();
            if (raw) fontRaw = raw;
          } catch { }
        }

        if (effectRaw === "solid") {
          try {
            const raw = interaction.fields.getTextInputValue("effect_style")?.trim().toLowerCase();
            if (raw) effectRaw = raw;
          } catch { }
        }

        const color1Hex = interaction.fields.getTextInputValue("color1")?.trim() || "";
        let color2Hex = "";
        try {
          color2Hex = interaction.fields.getTextInputValue("color2")?.trim() || "";
        } catch { }

        const fontMap: Record<string, number> = {
          default: 11,
          "11": 11,
          standard: 11,
          tempo: 1,
          "1": 1,
          athletic: 1,
          sakura: 3,
          "3": 3,
          jellybean: 4,
          "4": 4,
          comic: 4,
          modern: 6,
          "6": 6,
          geometric: 6,
          medieval: 7,
          "7": 7,
          gothic: 7,
          "8bit": 8,
          pixel: 8,
          "8": 8,
          vampyre: 10,
          vampire: 10,
          "10": 10
        };

        const effectMap: Record<string, number> = {
          solid: 1,
          "1": 1,
          gradient: 2,
          "2": 2,
          neon: 3,
          "3": 3,
          toon: 4,
          "4": 4,
          pop: 5,
          "5": 5,
          glow: 6,
          "6": 6
        };

        const fontId = fontMap[fontRaw] ?? parseInt(fontRaw, 10);
        const effectId = effectMap[effectRaw] ?? parseInt(effectRaw, 10);

        if (isNaN(fontId) || isNaN(effectId)) {
          await interaction.editReply({
            ...(await Usages.impossible(guildId, "Invalid font or effect selected. Please choose a valid style"))
          });
          return;
        }

        const hexToDec = (hex: string) => {
          const clean = hex.replace("#", "").trim();
          return parseInt(clean, 16);
        };

        const color1 = hexToDec(color1Hex);
        if (isNaN(color1)) {
          await interaction.editReply({
            ...(await Usages.impossible(guildId, "Invalid first hex color format (e.g. #FF69B4)"))
          });
          return;
        }

        const colors: number[] = [color1];
        if (effectId === 2) {
          if (!color2Hex) {
            await interaction.editReply({
              ...(await Usages.impossible(guildId, "Gradient effect requires second color. Please provide second color"))
            });
            return;
          }
          const color2 = hexToDec(color2Hex);
          if (isNaN(color2)) {
            await interaction.editReply({
              ...(await Usages.impossible(guildId, "Invalid second hex color format"))
            });
            return;
          }
          colors.push(color2);
        }

        await rest.patch(
          Routes.guildMember(guildId, "@me"),
          {
            body: {
              display_name_font_id: fontId,
              display_name_effect_id: effectId,
              display_name_colors: colors
            }
          }
        );

        const embed = await Usages.executedAction(
          guildId,
          "Profile Nameplate",
          `${botMention} nameplate styling applied successfully:\n- **Font ID:** \`${fontId}\`\n- **Effect ID:** \`${effectId}\`\n- **Colors:** \`${colors.map((c) => `#${c.toString(16).toUpperCase()}`).join(", ")}\``
        );
        await interaction.editReply({ ...embed });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const embed = await Usages.impossible(guildId, `Failed to update ${botMention} nameplate: ${errorMessage}`);
        await interaction.editReply({ ...embed });
      }
      return;
    }

    if (modalType === "panelimage_modal") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        const { GuildConfigModel } = await import("../../../database/schemas/guild-config.schema");
        const { GuildMemoryStore } = await import("../../../modules/voice/cache/guild.store");
        const { WebhookLogger } = await import("../../logger/webhook.logger");

        let buffer: Buffer | null = null;

        try {
          const files = interaction.fields.getUploadedFiles?.("panelimage_file");
          if (files && files.size > 0) {
            const file = files.first();
            if (file?.url) {
              const fetchRes = await safeFetchImage(file.url);
              buffer = fetchRes.buffer;
            }
          }
        } catch { }

        let finalUrl: string | null = null;

        if (buffer) {
          finalUrl = await WebhookLogger.uploadImage(buffer, `panel_${guildId}.png`);
        } else {
          let imageUrl = "";
          try {
            imageUrl = interaction.fields.getTextInputValue("panelimage_url")?.trim() || "";
          } catch { }

          if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
            await interaction.editReply({
              ...(await Usages.impossible(guildId, "Please upload an image file or provide a valid image URL"))
            });
            return;
          }

          const fetchRes = await safeFetchImage(imageUrl);
          const secureUrl = await WebhookLogger.uploadImage(fetchRes.buffer, `panel_${guildId}.${fetchRes.extension || "png"}`);
          finalUrl = secureUrl || imageUrl;
        }

        if (!finalUrl) {
          await interaction.editReply({
            ...(await Usages.impossible(guildId, "Failed to process panel image"))
          });
          return;
        }

        await GuildConfigModel.updateOne(
          { guildId },
          { $set: { panelImageUrl: finalUrl } },
          { upsert: true }
        ).exec();

        const cfg = await GuildMemoryStore.resolve(guildId);
        if (cfg) {
          cfg.panelImageUrl = finalUrl;
        }

        const embed = await Usages.executedAction(
          guildId,
          "Panel Image",
          "Voice panel image has been successfully updated."
        );
        await interaction.editReply({ ...embed });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const embed = await Usages.impossible(guildId, `Failed to update panel image: ${errorMessage}`);
        await interaction.editReply({ ...embed });
      }
      return;
    }

    if (modalType === "reset_modal") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        const resetTarget = interaction.fields.getTextInputValue("reset_target").trim().toLowerCase();

        if (!resetTarget) {
          await interaction.editReply({
            ...(await Usages.impossible(guildId, "No item was entered to reset"))
          });
          return;
        }

        if (resetTarget === "avatar") {
          await rest.patch(
            Routes.guildMember(guildId, "@me"),
            { body: { avatar: null } }
          );
          const embed = await Usages.executedAction(guildId, "Reset Avatar", `${botMention} server avatar has been reset to default.`);
          await interaction.editReply({ ...embed });
          return;
        }

        if (resetTarget === "banner") {
          await rest.patch(
            Routes.guildMember(guildId, "@me"),
            { body: { banner: null } }
          );
          const embed = await Usages.executedAction(guildId, "Reset Banner", `${botMention} server banner has been reset to default.`);
          await interaction.editReply({ ...embed });
          return;
        }

        if (resetTarget === "bio") {
          await rest.patch(
            Routes.guildMember(guildId, "@me"),
            { body: { bio: "" } }
          );
          const embed = await Usages.executedAction(guildId, "Reset Bio", `${botMention} server bio has been cleared.`);
          await interaction.editReply({ ...embed });
          return;
        }

        if (resetTarget === "nameplate") {
          await rest.patch(
            Routes.guildMember(guildId, "@me"),
            {
              body: {
                display_name_font_id: 0,
                display_name_effect_id: 0,
                display_name_colors: []
              }
            }
          );
          const embed = await Usages.executedAction(guildId, "Reset Nameplate", `${botMention} nameplate styling has been reset to default.`);
          await interaction.editReply({ ...embed });
          return;
        }

        if (resetTarget === "panel" || resetTarget === "panelimage") {
          const { GuildConfigModel } = await import("../../../database/schemas/guild-config.schema");
          const { GuildMemoryStore } = await import("../../../modules/voice/cache/guild.store");
          await GuildConfigModel.updateOne({ guildId }, { $unset: { panelImageUrl: 1 } }).exec();
          const cfg = await GuildMemoryStore.resolve(guildId);
          if (cfg) delete cfg.panelImageUrl;

          const embed = await Usages.executedAction(guildId, "Reset Panel Image", "Custom voice panel image has been removed.");
          await interaction.editReply({ ...embed });
          return;
        }

        await interaction.editReply({
          ...(await Usages.impossible(guildId, "Invalid option. Choose: avatar, banner, bio, nameplate, or panel"))
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const embed = await Usages.impossible(guildId, `Failed to reset: ${errorMessage}`);
        await interaction.editReply({ ...embed });
      }
    }
  }
}
