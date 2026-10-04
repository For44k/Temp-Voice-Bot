import { Message, PermissionFlagsBits } from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { GuildConfigModel } from "../../../../database/schemas/guild-config.schema";
import { GuildMemoryStore } from "../../cache/guild.store";
import { WebhookLogger } from "../../../../core/logger/webhook.logger";
import { Usages } from "../../../../shared/embeds/usages";
import { safeFetchImage } from "../../../../shared/utils/safe-fetch";

export const panelimageCommand: ICommand = {
  name: "panelimage",
  prefixAliases: ["panelimage", "pimage", "setimage"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const guildId = message.guildId;
    if (!guildId) return;

    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({
        ...(await Usages.impossible(guildId, "You need Administrator permissions to use this")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const sub = args[0]?.toLowerCase();

    if (sub === "reset" || sub === "remove" || sub === "clear") {
      await GuildConfigModel.updateOne({ guildId }, { $unset: { panelImageUrl: 1 } }).exec();
      const cfg = await GuildMemoryStore.resolve(guildId);
      if (cfg) {
        delete cfg.panelImageUrl;
      }
      GuildMemoryStore.purge(guildId);

      const embed = await Usages.executedAction(
        guildId,
        "Panel Image",
        "Panel image has been removed. The voice panel will now show without a custom image."
      );
      await message.reply({
        ...embed,
        allowedMentions: { parse: [] }
      });
      return;
    }

    const attachment = message.attachments.first();
    const possibleUrl = args.find((a) => /^https?:\/\/.+/i.test(a));

    if (!attachment && !possibleUrl) {
      await message.reply({
        ...(await Usages.invalidCommand(guildId, "`.v panelimage`", "<attach media | url>")),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const imageUrl = attachment ? attachment.url : possibleUrl;
    if (!imageUrl) return;

    const processingMsg = await message.reply({
      ...(await Usages.executedAction(
        guildId,
        "Panel Image",
        "Uploading your image to storage..."
      )),
      allowedMentions: { parse: [] }
    });

    try {
      const fetchRes = await safeFetchImage(imageUrl);
      const buffer = fetchRes.buffer;
      let ext = fetchRes.extension || "png";
      if (attachment?.name) {
        const attachExt = attachment.name.split(".").pop();
        if (attachExt) ext = attachExt;
      }

      const filename = `panel_${guildId}.${ext}`;
      const permanentUrl = await WebhookLogger.uploadImage(buffer, filename);

      const finalUrl = permanentUrl || imageUrl;

      await GuildConfigModel.updateOne(
        { guildId },
        { $set: { panelImageUrl: finalUrl } },
        { upsert: false }
      ).exec();

      GuildMemoryStore.purge(guildId);

      await processingMsg.edit(
        await Usages.executedAction(
          guildId,
          "Panel Image",
          "Panel image has been updated and is now active for voice panels in this server."
        )
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await processingMsg.edit({
        ...(await Usages.impossible(guildId, `Error uploading image: ${errorMessage}`)),
      });
    }
  }
};
