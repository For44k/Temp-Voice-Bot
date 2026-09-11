import { ButtonInteraction, ModalSubmitInteraction, AnySelectMenuInteraction, StringSelectMenuInteraction } from "discord.js";
import { SetupInteractionHandler } from "./handlers/setup.handler";
import { SetbotInteractionHandler } from "./handlers/setbot.handler";
import { VoiceButtonHandler } from "./handlers/voice-button.handler";
import { VoiceModalHandler } from "./handlers/voice-modal.handler";
import { GameSelectHandler } from "./handlers/game-select.handler";
import { HelpInteractionHandler } from "./handlers/help.handler";
import { ThemeInteractionHandler } from "./handlers/theme.handler";
import { MusicActivityHandler } from "./handlers/music-activity.handler";

export class InteractionDispatcher {
  public static async handleButton(interaction: ButtonInteraction): Promise<void> {
    const id = interaction.customId;

    if (id === "btn:music_get") {
      await MusicActivityHandler.handleMusicGet(interaction);
      return;
    }

    if (id === "btn:activity_launch") {
      await MusicActivityHandler.handleActivityLaunch(interaction);
      return;
    }

    if (id.startsWith("help:")) {
      await HelpInteractionHandler.handleButton(interaction);
      return;
    }

    if (id.startsWith("theme:")) {
      await ThemeInteractionHandler.handleButton(interaction);
      return;
    }

    if (id.startsWith("setup_modal:") || id.startsWith("setup:")) {
      await SetupInteractionHandler.handleButton(interaction);
      return;
    }

    if (id.startsWith("setbot:")) {
      await SetbotInteractionHandler.handleButton(interaction);
      return;
    }

    await VoiceButtonHandler.handle(interaction);
  }

  public static async handleModal(interaction: ModalSubmitInteraction): Promise<void> {
    const id = interaction.customId;

    if (id.startsWith("theme:")) {
      await ThemeInteractionHandler.handleModal(interaction);
      return;
    }

    if (id.startsWith("setup_submit:") || id.startsWith("setup:")) {
      await SetupInteractionHandler.handleModal(interaction);
      return;
    }

    if (id.startsWith("setbot:")) {
      await SetbotInteractionHandler.handleModal(interaction);
      return;
    }

    await VoiceModalHandler.handle(interaction);
  }

  public static async handleSelectMenu(interaction: AnySelectMenuInteraction): Promise<void> {
    const id = interaction.customId;

    if (id === "select:activity_launch" && interaction.isStringSelectMenu()) {
      await MusicActivityHandler.handleActivitySelect(interaction as StringSelectMenuInteraction);
      return;
    }

    if (id.startsWith("help:") && interaction.isStringSelectMenu()) {
      await HelpInteractionHandler.handleSelectMenu(interaction as StringSelectMenuInteraction);
      return;
    }

    if (id.startsWith("theme:") && interaction.isStringSelectMenu()) {
      await ThemeInteractionHandler.handleSelectMenu(interaction as StringSelectMenuInteraction);
      return;
    }

    if (id === "select:game_mention" && interaction.isStringSelectMenu()) {
      await GameSelectHandler.handle(interaction as StringSelectMenuInteraction);
      return;
    }

    await interaction.deferUpdate().catch(() => {});
  }
}

