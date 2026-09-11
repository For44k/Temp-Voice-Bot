import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  LabelBuilder,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
  Routes
} from "discord.js";
import { GuildConfigModel } from "../../../database/schemas/guild-config.schema";
import { GuildMemoryStore } from "../../../modules/voice/cache/guild.store";
import { Usages } from "../../../shared/embeds/usages";

export class SetupInteractionHandler {
  public static async handleButton(interaction: ButtonInteraction): Promise<void> {
    const member = interaction.member as any;
    const guildId = interaction.guildId!;

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        ...(await Usages.impossible(guildId, "**__You need Administrator permissions to use this :__**")),
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
      });
      return;
    }

    const customId = interaction.customId;

    if (customId === "setup_modal:channels") {
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
    const member = interaction.member as any;
    const guildId = interaction.guildId!;

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        ...(await Usages.impossible(guildId, "**__You need Administrator permissions to use this :__**")),
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
      });
      return;
    }

    const customId = interaction.customId;

    if (customId === "setup_submit:channels") {
      let generatorId = "";
      let categoryId = "";
      let logsChannelId = "";
      let rejectChannelId = "";

      try {
        const rawComponents = (interaction as any).data?.components as any[];
        if (rawComponents) {
          for (const row of rawComponents) {
            for (const comp of (row.components || [])) {
              const vals: string[] = comp.values || [];
              if (comp.custom_id === "setup_generator" && vals.length > 0) generatorId = vals[0];
              if (comp.custom_id === "setup_category" && vals.length > 0) categoryId = vals[0];
              if (comp.custom_id === "setup_logs" && vals.length > 0) logsChannelId = vals[0];
              if (comp.custom_id === "setup_reject" && vals.length > 0) rejectChannelId = vals[0];
            }
          }
        }
      } catch {}

      if (!generatorId) {
        try {
          const genChannels = (interaction.fields as any).getSelectedChannels?.("setup_generator");
          if (genChannels && genChannels.size > 0) generatorId = genChannels.first().id;
        } catch {}
      }
      if (!categoryId) {
        try {
          const catChannels = (interaction.fields as any).getSelectedChannels?.("setup_category");
          if (catChannels && catChannels.size > 0) categoryId = catChannels.first().id;
        } catch {}
      }
      if (!logsChannelId) {
        try {
          const logChannels = (interaction.fields as any).getSelectedChannels?.("setup_logs");
          if (logChannels && logChannels.size > 0) logsChannelId = logChannels.first().id;
        } catch {}
      }
      if (!rejectChannelId) {
        try {
          const rejChannels = (interaction.fields as any).getSelectedChannels?.("setup_reject");
          if (rejChannels && rejChannels.size > 0) rejectChannelId = rejChannels.first().id;
        } catch {}
      }

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
          ...(await Usages.impossible(guildId, "**__Join-To-Create channel is required :__**")),
          flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
        });
        return;
      }

      const setFields: any = {
        guildId,
        generatorId,
        defaultLimit: 0
      };
      const unsetFields: any = {};

      if (categoryId) setFields.categoryId = categoryId;
      else unsetFields.categoryId = 1;

      if (logsChannelId) setFields.logsChannelId = logsChannelId;
      else unsetFields.logsChannelId = 1;

      if (rejectChannelId) setFields.rejectChannelId = rejectChannelId;
      else unsetFields.rejectChannelId = 1;

      const updateQuery: any = { $set: setFields };
      if (Object.keys(unsetFields).length > 0) {
        updateQuery.$unset = unsetFields;
      }

      await GuildConfigModel.updateOne({ guildId }, updateQuery, { upsert: true }).exec();

      const existing = GuildMemoryStore.resolve(guildId) || { guildId, defaultLimit: 0, generatorId };
      Object.assign(existing, setFields);
      if (!categoryId) delete existing.categoryId;
      if (!logsChannelId) delete existing.logsChannelId;
      if (!rejectChannelId) delete existing.rejectChannelId;
      GuildMemoryStore.set(guildId, existing as any);

      const embed = await Usages.executedAction(
        guildId,
        "Setup",
        `**__One Tap Channels Configured :__**\n- **Join-To-Create:** <#${generatorId}>\n- **Category:** ${categoryId ? `<#${categoryId}>` : "`None`"}\n- **Logs Channel:** ${logsChannelId ? `<#${logsChannelId}>` : "`None`"}\n- **Reject Channel:** ${rejectChannelId ? `<#${rejectChannelId}>` : "`None`"}`
      );
      await interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
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
        .replace(/{user}/gi, member.user?.username || "user")
        .replace(/{server}/gi, interaction.guild?.name || "Server");

      const embed = await Usages.executedAction(
        guildId,
        "NamePlate Setup",
        `**__Channel Name Template Saved :__**\n- **Pattern:** \`${sanitized}\`\n- **Preview:** \`${preview}\``
      );
      await interaction.reply({
        ...embed,
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
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
        .replace(/{user}/gi, member.user?.username || "user")
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
        flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any
      });
      return;
    }
  }
}
