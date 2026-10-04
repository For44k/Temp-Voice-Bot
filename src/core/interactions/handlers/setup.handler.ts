import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  LabelBuilder,
  FileUploadBuilder,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
  GuildMember
} from "discord.js";
import { GuildConfigModel } from "../../../database/schemas/guild-config.schema";
import { GuildMemoryStore } from "../../../modules/voice/cache/guild.store";
import { Usages } from "../../../shared/embeds/usages";
import { WebhookLogger } from "../../logger/webhook.logger";
import { safeFetchImage } from "../../../shared/utils/safe-fetch";
import { DefaultAssetService } from "../../services/default-assets.service";
import { buildThemeSelectPayload } from "../../../modules/voice/commands/settings/theme.command";
import { buildSetupPayload } from "../../../modules/voice/commands/management/setup.command";

export class SetupInteractionHandler {
  public static async handleButton(interaction: ButtonInteraction): Promise<void> {
    const member = interaction.member;
    if (!member || !(member instanceof GuildMember)) return;
    const guildId = interaction.guildId;
    if (!guildId) return;

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        ...(await Usages.impossible(guildId, "You need Administrator permissions to use this")),
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
      return;
    }

    const customId = interaction.customId;

    if (customId === "setup_btn:toggle_panels") {
      const config = GuildMemoryStore.resolve(guildId);
      const current = config?.twoPanelsEnabled ?? false;
      const next = !current;

      await GuildConfigModel.updateOne(
        { guildId },
        { $set: { twoPanelsEnabled: next } },
        { upsert: true }
      ).exec();

      if (config) {
        config.twoPanelsEnabled = next;
        GuildMemoryStore.set(guildId, config);
      }

      const updatedPayload = buildSetupPayload(guildId);
      await interaction.update(updatedPayload).catch(async () => {
        await interaction.message.edit(updatedPayload).catch(() => {});
      });
      return;
    }

    if (customId === "setup_btn:theme") {
      const payload = await buildThemeSelectPayload(guildId);
      await interaction.reply({
        ...payload,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
      return;
    }

    if (customId === "setup_modal:support_channels") {
      try {
        const modal = new ModalBuilder()
          .setCustomId("setup_submit:support_channels")
          .setTitle("Set Ticket & Need Help Channels")
          .addLabelComponents(
            new LabelBuilder()
              .setLabel("Need Help Voice Channel")
              .setDescription("Select voice channel for user voice assistance")
              .setChannelSelectMenuComponent(
                new ChannelSelectMenuBuilder()
                  .setCustomId("setup_support_voice")
                  .setPlaceholder("Select Need Help Voice Channel...")
                  .setChannelTypes([ChannelType.GuildVoice])
                  .setMinValues(1)
                  .setMaxValues(1)
              ),
            new LabelBuilder()
              .setLabel("Ticket Text Channel")
              .setDescription("Select text channel to open support tickets")
              .setChannelSelectMenuComponent(
                new ChannelSelectMenuBuilder()
                  .setCustomId("setup_ticket_text")
                  .setPlaceholder("Select Ticket Text Channel...")
                  .setChannelTypes([ChannelType.GuildText])
                  .setMinValues(1)
                  .setMaxValues(1)
              )
          );

        await interaction.showModal(modal);
        return;
      } catch {
        const modal = new ModalBuilder()
          .setCustomId("setup_submit:support_channels")
          .setTitle("Set Ticket & Need Help Channels")
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("text_support_voice")
                .setLabel("Need Help Voice Channel ID")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Voice Channel ID")
                .setRequired(false)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("text_ticket_text")
                .setLabel("Ticket Text Channel ID")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Text Channel ID")
                .setRequired(false)
            )
          );

        await interaction.showModal(modal);
        return;
      }
    }

    if (customId === "setup_modal:channels") {
      try {
        const modal = new ModalBuilder()
          .setCustomId("setup_submit:channels")
          .setTitle("Channels Configuration")
          .addLabelComponents(
            new LabelBuilder()
              .setLabel("Join To Create Voice Channel")
              .setDescription("Select the main generator voice channel")
              .setChannelSelectMenuComponent(
                new ChannelSelectMenuBuilder()
                  .setCustomId("setup_generator")
                  .setPlaceholder("Select Generator Voice Channel...")
                  .setChannelTypes([ChannelType.GuildVoice])
                  .setMinValues(1)
                  .setMaxValues(1)
              ),
            new LabelBuilder()
              .setLabel("Category For Temporary Rooms")
              .setDescription("Select category to place created temp rooms")
              .setChannelSelectMenuComponent(
                new ChannelSelectMenuBuilder()
                  .setCustomId("setup_category")
                  .setPlaceholder("Select Category (or None)...")
                  .setChannelTypes([ChannelType.GuildCategory])
                  .setMinValues(1)
                  .setMaxValues(1)
              ),
            new LabelBuilder()
              .setLabel("Logs Text Channel")
              .setDescription("Select channel where room logs will be sent")
              .setChannelSelectMenuComponent(
                new ChannelSelectMenuBuilder()
                  .setCustomId("setup_logs")
                  .setPlaceholder("Select Logs Channel (or None)...")
                  .setChannelTypes([ChannelType.GuildText])
                  .setMinValues(1)
                  .setMaxValues(1)
              ),
            new LabelBuilder()
              .setLabel("Rejected Voice Channel")
              .setDescription("Select channel to move rejected users to")
              .setChannelSelectMenuComponent(
                new ChannelSelectMenuBuilder()
                  .setCustomId("setup_reject")
                  .setPlaceholder("Select Rejected Channel (or None)...")
                  .setChannelTypes([ChannelType.GuildVoice])
                  .setMinValues(1)
                  .setMaxValues(1)
              ),
            new LabelBuilder()
              .setLabel("Panel Banner Image (Optional)")
              .setDescription("Drop custom image or leave empty for default")
              .setFileUploadComponent(
                new FileUploadBuilder()
                  .setCustomId("setup_panelimage_file")
                  .setRequired(false)
              )
          );

        await interaction.showModal(modal);
        return;
      } catch {
        const modal = new ModalBuilder()
          .setCustomId("setup_submit:channels")
          .setTitle("Channels Configuration")
          .addLabelComponents(
            new LabelBuilder()
              .setLabel("Join To Create Voice Channel")
              .setDescription("Select the main generator voice channel")
              .setChannelSelectMenuComponent(
                new ChannelSelectMenuBuilder()
                  .setCustomId("setup_generator")
                  .setPlaceholder("Select Generator Voice Channel...")
                  .setChannelTypes([ChannelType.GuildVoice])
                  .setMinValues(1)
                  .setMaxValues(1)
              ),
            new LabelBuilder()
              .setLabel("Category For Temporary Rooms")
              .setDescription("Select category to place created temp rooms")
              .setChannelSelectMenuComponent(
                new ChannelSelectMenuBuilder()
                  .setCustomId("setup_category")
                  .setPlaceholder("Select Category (or None)...")
                  .setChannelTypes([ChannelType.GuildCategory])
                  .setMinValues(1)
                  .setMaxValues(1)
              ),
            new LabelBuilder()
              .setLabel("Logs Text Channel")
              .setDescription("Select channel where room logs will be sent")
              .setChannelSelectMenuComponent(
                new ChannelSelectMenuBuilder()
                  .setCustomId("setup_logs")
                  .setPlaceholder("Select Logs Channel (or None)...")
                  .setChannelTypes([ChannelType.GuildText])
                  .setMinValues(1)
                  .setMaxValues(1)
              ),
            new LabelBuilder()
              .setLabel("Rejected Voice Channel")
              .setDescription("Select channel to move rejected users to")
              .setChannelSelectMenuComponent(
                new ChannelSelectMenuBuilder()
                  .setCustomId("setup_reject")
                  .setPlaceholder("Select Rejected Channel (or None)...")
                  .setChannelTypes([ChannelType.GuildVoice])
                  .setMinValues(1)
                  .setMaxValues(1)
              )
          );

        await interaction.showModal(modal);
        return;
      }
    }

    if (customId === "setup_modal:nameplate") {
      const config = GuildMemoryStore.resolve(guildId);
      const currentTemplate = config?.nameTemplate || "{username}'s Room";

      const modal = new ModalBuilder()
        .setCustomId("setup_submit:nameplate")
        .setTitle("Setup Creation NamePlate")
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("name_template")
              .setLabel("Channel Name Template")
              .setStyle(TextInputStyle.Short)
              .setValue(currentTemplate)
              .setPlaceholder("{username}'s Room | {user} Vc")
              .setMaxLength(100)
              .setRequired(true)
          )
        );
      await interaction.showModal(modal);
      return;
    }

    if (customId === "setup_modal:status") {
      const config = GuildMemoryStore.resolve(guildId);
      const currentStatus = config?.defaultStatus || "";

      const modal = new ModalBuilder()
        .setCustomId("setup_submit:status")
        .setTitle("Custom Status In User Vc")
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("default_status")
              .setLabel("Voice Status Pattern")
              .setStyle(TextInputStyle.Short)
              .setValue(currentStatus)
              .setPlaceholder("Best {server} | Chilling with {username}")
              .setMaxLength(500)
              .setRequired(false)
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
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
      return;
    }

    const customId = interaction.customId;

    if (customId === "setup_submit:support_channels") {
      let supportVoiceChannelId = "";
      let ticketTextChannelId = "";

      try {
        const supportChannels = interaction.fields.getSelectedChannels?.("setup_support_voice");
        if (supportChannels && supportChannels.size > 0) supportVoiceChannelId = supportChannels.first()?.id ?? "";
      } catch {}

      try {
        const ticketChannels = interaction.fields.getSelectedChannels?.("setup_ticket_text");
        if (ticketChannels && ticketChannels.size > 0) ticketTextChannelId = ticketChannels.first()?.id ?? "";
      } catch {}

      if (!supportVoiceChannelId) {
        try {
          supportVoiceChannelId = interaction.fields.getTextInputValue("text_support_voice")?.trim().replace(/[<#>]/g, "") || "";
        } catch {}
      }

      if (!ticketTextChannelId) {
        try {
          ticketTextChannelId = interaction.fields.getTextInputValue("text_ticket_text")?.trim().replace(/[<#>]/g, "") || "";
        } catch {}
      }

      const setFields: Record<string, unknown> = { guildId };
      const unsetFields: Record<string, number> = {};

      if (supportVoiceChannelId) setFields.supportVoiceChannelId = supportVoiceChannelId;
      else unsetFields.supportVoiceChannelId = 1;

      if (ticketTextChannelId) setFields.ticketTextChannelId = ticketTextChannelId;
      else unsetFields.ticketTextChannelId = 1;

      const updateQuery: { $set: Record<string, unknown>; $unset?: Record<string, number> } = { $set: setFields };
      if (Object.keys(unsetFields).length > 0) {
        updateQuery.$unset = unsetFields;
      }

      await GuildConfigModel.updateOne({ guildId }, updateQuery, { upsert: true }).exec();

      const existing = GuildMemoryStore.resolve(guildId) || { guildId, defaultLimit: 0, generatorId: "" };
      Object.assign(existing, setFields);
      if (!supportVoiceChannelId) delete existing.supportVoiceChannelId;
      if (!ticketTextChannelId) delete existing.ticketTextChannelId;
      GuildMemoryStore.set(guildId, existing);

      const helpChannelText = supportVoiceChannelId ? `<#${supportVoiceChannelId}>` : "`None`";
      const ticketChannelText = ticketTextChannelId ? `<#${ticketTextChannelId}>` : "`None`";

      const embed = await Usages.executedAction(
        guildId,
        "Support Setup",
        `Need Help Voice Channel  : ${helpChannelText}\nTicket Text Channel  : ${ticketChannelText}`
      );
      await interaction.reply({
        ...embed,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
      return;
    }

    if (customId === "setup_submit:channels") {
      let generatorId = "";
      let categoryId = "";
      let logsChannelId = "";
      let rejectChannelId = "";

      try {
        const genChannels = interaction.fields.getSelectedChannels?.("setup_generator");
        if (genChannels && genChannels.size > 0) generatorId = genChannels.first()?.id ?? "";
      } catch {}

      try {
        const catChannels = interaction.fields.getSelectedChannels?.("setup_category");
        if (catChannels && catChannels.size > 0) categoryId = catChannels.first()?.id ?? "";
      } catch {}

      try {
        const logChannels = interaction.fields.getSelectedChannels?.("setup_logs");
        if (logChannels && logChannels.size > 0) logsChannelId = logChannels.first()?.id ?? "";
      } catch {}

      try {
        const rejChannels = interaction.fields.getSelectedChannels?.("setup_reject");
        if (rejChannels && rejChannels.size > 0) rejectChannelId = rejChannels.first()?.id ?? "";
      } catch {}

      if (!generatorId) {
        try {
          generatorId = interaction.fields.getTextInputValue("text_generator")?.trim().replace(/[<#>]/g, "") || "";
        } catch {}
      }

      if (!categoryId) {
        try {
          categoryId = interaction.fields.getTextInputValue("text_category")?.trim().replace(/[<#>]/g, "") || "";
        } catch {}
      }

      if (!logsChannelId) {
        try {
          logsChannelId = interaction.fields.getTextInputValue("text_logs")?.trim().replace(/[<#>]/g, "") || "";
        } catch {}
      }

      if (!rejectChannelId) {
        try {
          rejectChannelId = interaction.fields.getTextInputValue("text_reject")?.trim().replace(/[<#>]/g, "") || "";
        } catch {}
      }

      if (!generatorId) {
        await interaction.reply({
          ...(await Usages.impossible(guildId, "Join-To-Create channel is required")),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
      }

      let buffer: Buffer | null = null;
      let uploadExt = "png";

      try {
        const files = interaction.fields.getUploadedFiles?.("setup_panelimage_file");
        if (files && files.size > 0) {
          const file = files.first();
          if (file?.url) {
            const fetchRes = await safeFetchImage(file.url);
            buffer = fetchRes.buffer;
            uploadExt = fetchRes.extension || "png";
          }
        }
      } catch {}

      let panelImageUrl: string | undefined = undefined;

      if (buffer) {
        const uploadedUrl = await WebhookLogger.uploadImage(buffer, `panel_${guildId}.${uploadExt}`);
        panelImageUrl = uploadedUrl || undefined;
      }

      if (!panelImageUrl) {
        const defaultImg = await DefaultAssetService.getDefaultPanelImageUrl();
        if (defaultImg) {
          panelImageUrl = defaultImg;
        }
      }

      const setFields: Record<string, unknown> = {
        guildId,
        generatorId,
        defaultLimit: 0
      };
      const unsetFields: Record<string, number> = {};

      if (categoryId) setFields.categoryId = categoryId;
      else unsetFields.categoryId = 1;

      if (logsChannelId) setFields.logsChannelId = logsChannelId;
      else unsetFields.logsChannelId = 1;

      if (rejectChannelId) setFields.rejectChannelId = rejectChannelId;
      else unsetFields.rejectChannelId = 1;

      if (panelImageUrl) setFields.panelImageUrl = panelImageUrl;

      const updateQuery: { $set: Record<string, unknown>; $unset?: Record<string, number> } = { $set: setFields };
      if (Object.keys(unsetFields).length > 0) {
        updateQuery.$unset = unsetFields;
      }

      await GuildConfigModel.updateOne({ guildId }, updateQuery, { upsert: true }).exec();

      const existing = GuildMemoryStore.resolve(guildId) || { guildId, defaultLimit: 0, generatorId };
      Object.assign(existing, setFields);
      if (!categoryId) delete existing.categoryId;
      if (!logsChannelId) delete existing.logsChannelId;
      if (!rejectChannelId) delete existing.rejectChannelId;
      GuildMemoryStore.set(guildId, existing);

      const embed = await Usages.executedAction(
        guildId,
        "Setup",
        `**__One Tap Channels Configured :__**\n- **Join-To-Create:** <#${generatorId}>\n- **Category:** ${categoryId ? `<#${categoryId}>` : "`None`"}\n- **Logs Channel:** ${logsChannelId ? `<#${logsChannelId}>` : "`None`"}\n- **Reject Channel:** ${rejectChannelId ? `<#${rejectChannelId}>` : "`None`"}\n- **Panel Image:** ${panelImageUrl ? "[`Active Banner Image`](" + panelImageUrl + ")" : "`Default Aesthetic Banner`"}`
      );
      await interaction.reply({
        ...embed,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
      return;
    }

    if (customId === "setup_submit:nameplate") {
      const template = interaction.fields.getTextInputValue("name_template").trim();
      const sanitized = Usages.sanitize(template).slice(0, 100);

      await GuildConfigModel.updateOne(
        { guildId },
        { $set: { nameTemplate: sanitized } },
        { upsert: true }
      ).exec();

      const existing = GuildMemoryStore.resolve(guildId);
      if (existing) existing.nameTemplate = sanitized;

      const preview = sanitized
        .replace(/{username}/gi, member.displayName || "User")
        .replace(/{user}/gi, member.user.username)
        .replace(/{server}/gi, interaction.guild?.name || "Server");

      const embed = await Usages.executedAction(
        guildId,
        "NamePlate Setup",
        `**__Channel Name Template Saved :__**\n- **Pattern:** \`${sanitized}\`\n- **Preview:** \`${preview}\``
      );
      await interaction.reply({
        ...embed,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
      return;
    }

    if (customId === "setup_submit:status") {
      const rawStatus = interaction.fields.getTextInputValue("default_status")?.trim() || "";
      const sanitized = Usages.sanitize(rawStatus).slice(0, 500);

      await GuildConfigModel.updateOne(
        { guildId },
        { $set: { defaultStatus: sanitized } },
        { upsert: true }
      ).exec();

      const existing = GuildMemoryStore.resolve(guildId);
      if (existing) existing.defaultStatus = sanitized;

      const preview = sanitized
        .replace(/{username}/gi, member.displayName || "User")
        .replace(/{user}/gi, member.user.username)
        .replace(/{server}/gi, interaction.guild?.name || "Server");

      const embed = await Usages.executedAction(
        guildId,
        "Custom Status Setup",
        sanitized
          ? `**__Default Voice Status Saved :__**\n- **Pattern:** ${sanitized}\n- **Preview:** ${preview}`
          : "**__Default Voice Status has been cleared.__**"
      );
      await interaction.reply({
        ...embed,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
      return;
    }
  }
}
