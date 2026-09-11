import { ButtonInteraction, StringSelectMenuInteraction } from "discord.js";
import { HelpBuilder } from "../../../modules/user/interactions/help.builder";

export class HelpInteractionHandler {
  public static async handleButton(interaction: ButtonInteraction): Promise<void> {
    const parts = interaction.customId.split(":");
    if (parts[0] !== "help") return;

    const action = parts[1];
    if (action === "home") {
      const payload = await HelpBuilder.buildHelpPayload(interaction.guildId, "home", 0);
      await interaction.update(payload).catch(() => { });
      return;
    }

    if (action === "page") {
      const categoryId = parts[2];
      const pageIndex = parseInt(parts[3], 10);
      const payload = await HelpBuilder.buildHelpPayload(interaction.guildId, categoryId, pageIndex);
      await interaction.update(payload).catch(() => { });
      return;
    }

    await interaction.deferUpdate().catch(() => { });
  }

  public static async handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
    if (interaction.customId !== "help:category_select") return;

    const selectedCategory = interaction.values[0];
    const payload = await HelpBuilder.buildHelpPayload(interaction.guildId, selectedCategory, 0);
    await interaction.update(payload).catch(() => { });
  }
}

