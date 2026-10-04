import { Client, GatewayIntentBits, Partials, Routes, REST, Message, ActivityType, MessageFlags, Interaction, Events } from "discord.js";
import { ENV } from "../config/env";
import { FastLogger } from "../logger/logger";
import { WebhookLogger } from "../logger/webhook.logger";
import { prefixCommandMap } from "../registry/command.registry";
import { onVoiceStateUpdate } from "../../modules/voice/events/voice-state.event";
import { GuildMemoryStore } from "../../modules/voice/cache/guild.store";
import { VoiceMemoryStore } from "../../modules/voice/cache/voice.store";
import { AliasStore } from "../../modules/user/cache/alias.store";
import { GlobalBlacklistStore } from "../../modules/user/cache/global-blacklist.store";
import { Replies } from "../../shared/embeds/replies";
import { Usages } from "../../shared/embeds/usages";
import { InteractionDispatcher } from "../interactions/interaction.dispatcher";
import { VoicePersistManager } from "../voice/voice-persist.manager";
import { ThemeManager } from "../config/theme";
import { PreferencesStore } from "../../modules/user/cache/preferences.store";
import { BotDeveloperStore } from "../../modules/user/cache/bot-developer.store";
import { UserProfileStore } from "../../modules/user/cache/user-profile.store";
import { EmojiSyncService } from "../services/emoji-sync.service";

export class BotGateway {
  public static client: Client;
  private client: Client;
  private presenceInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ],
      partials: [Partials.Channel]
    });
    BotGateway.client = this.client;
  }

  public async start(): Promise<void> {
    this.registerEvents();
    await this.client.login(ENV.TOKEN);
  }

  private registerEvents(): void {
    this.client.once(Events.ClientReady, async () => {
      FastLogger.success(`Logged in as ${this.client.user?.tag}`);

      const statuses = ["67", "3067", "3045 Twins"];
      let statusIndex = 0;

      const applyStatus = () => {
        this.client.user?.setPresence({
          status: "dnd",
          activities: [{ name: statuses[statusIndex], type: ActivityType.Custom }]
        });
        statusIndex = (statusIndex + 1) % statuses.length;
      };

      if (this.presenceInterval) {
        clearInterval(this.presenceInterval);
        this.presenceInterval = null;
      }
      applyStatus();
      this.presenceInterval = setInterval(applyStatus, 30_000);

      void Promise.all([
        GuildMemoryStore.preload(),
        VoiceMemoryStore.preload(),
        GlobalBlacklistStore.preload(),
        PreferencesStore.preload(),
        ThemeManager.preload(),
        BotDeveloperStore.preload(),
        UserProfileStore.preload(),
        EmojiSyncService.loadApplicationEmojis(ENV.TOKEN, ENV.CLIENT_ID)
      ]).then(async () => {
        await VoiceMemoryStore.reconcileWithDiscord(this.client);
        for (const [guildId, guild] of this.client.guilds.cache) {
          if (GlobalBlacklistStore.isServerBlacklisted(guildId)) {
            await guild.leave().catch(() => {});
          }
        }
        await VoicePersistManager.reconnectAll().catch(() => {});
      });

      void this.deployCommands();
    });

    this.client.on("guildCreate", async (guild) => {
      if (GlobalBlacklistStore.isServerBlacklisted(guild.id)) {
        await guild.leave().catch(() => { });
        return;
      }
      WebhookLogger.logGuildJoin(guild.name, guild.id, guild.memberCount, guild.ownerId).catch(() => { });
    });

    this.client.on("guildDelete", async (guild) => {
      WebhookLogger.logGuildLeave(guild.name, guild.id, guild.memberCount).catch(() => { });
    });

    this.client.on("voiceStateUpdate", (oldState, newState) => {
      if (oldState.member?.id === this.client.user?.id && !newState.channelId) {
        const data = VoicePersistManager.load();
        if (data.mainBot && data.mainBot.guildId === oldState.guild.id) {
          setTimeout(() => {
            void VoicePersistManager.joinVoice(this.client, data.mainBot!.guildId, data.mainBot!.channelId);
          }, 1000);
        }
      }

      onVoiceStateUpdate(oldState, newState).catch((err: unknown) =>
        FastLogger.error("VoiceStateUpdate Error", err)
      );
    });

    this.client.on("interactionCreate", async (interaction) => {
      await handleInteractionEvent(interaction);
    });

    this.client.on("messageCreate", async (message: Message) => {
      await handlePrefixMessage(message);
    });
  }

  private async deployCommands(): Promise<void> {
    try {
      const rest = new REST({ version: "10" }).setToken(ENV.TOKEN);
      await rest.put(Routes.applicationCommands(ENV.CLIENT_ID), { body: [] });
      FastLogger.success("Unregistered all application commands (slash commands removed)");
    } catch (err) {
      FastLogger.error("Failed to clear application commands", err);
    }
  }
}

export async function handleInteractionEvent(interaction: Interaction): Promise<void> {
  try {
    if (GlobalBlacklistStore.isUserBlacklisted(interaction.user.id)) {
      return;
    }

    if (interaction.isButton()) {
      await InteractionDispatcher.handleButton(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      await InteractionDispatcher.handleModal(interaction);
      return;
    }

    if (interaction.isAnySelectMenu()) {
      await InteractionDispatcher.handleSelectMenu(interaction);
      return;
    }
  } catch (err) {
    FastLogger.error(`Interaction Error`, err);
    const reply = await Usages.impossible(interaction.guildId, "**__An error occurred while executing this action :__**");
    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ ...reply, flags: MessageFlags.Ephemeral }).catch(() => { });
      } else {
        await interaction.reply({ ...reply, flags: MessageFlags.Ephemeral }).catch(() => { });
      }
    }
  }
}

export async function handlePrefixMessage(message: Message): Promise<void> {
  if (message.author.bot || !message.guild) return;
  if (GlobalBlacklistStore.isUserBlacklisted(message.author.id)) return;

  const trimmed = message.content.trim();
  if (!trimmed.startsWith(".v ") && trimmed !== ".v") return;

  const restContent = trimmed === ".v" ? "help" : trimmed.slice(2).trim();
  const rawArgs = restContent.split(/\s+/);
  const rawCmdName = rawArgs[0]?.toLowerCase() || "help";

  const userAliasTarget = await AliasStore.resolve(message.guild.id, message.author.id, rawCmdName);
  const commandName = userAliasTarget || rawCmdName;

  const cmd = prefixCommandMap.get(commandName);
  if (cmd && cmd.executePrefix) {
    try {
      await cmd.executePrefix(message, rawArgs.slice(1));
      const { ActionLogger } = await import("../logger/action.logger");
      await ActionLogger.logAction({
        guildId: message.guild.id,
        executorId: message.author.id,
        action: `Command: .v ${commandName}`,
        details: rawArgs.slice(1).length > 0 ? `\`${rawArgs.slice(1).join(" ")}\`` : undefined
      }).catch(() => { });
    } catch (err: unknown) {
      FastLogger.error(`Prefix Command Error: ${commandName}`, err);
      const reply = await Usages.impossible(message.guildId, "An error occurred while executing this command.");
      await message.reply({ ...reply, allowedMentions: { parse: [] } }).catch(() => {});
    }
  }
}

