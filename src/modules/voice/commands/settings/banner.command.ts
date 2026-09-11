import {
  Message,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
  resolveColor
} from "discord.js";
import { ICommand } from "../../../../shared/types/command.types";
import { UserProfileModel } from "../../../../database/schemas/user-profile.schema";
import { WebhookLogger } from "../../../../core/logger/webhook.logger";
import { extractTargetMembers } from "../../../../shared/utils/member-parser";
import { Usages } from "../../../../shared/embeds/usages";
import { ThemeManager } from "../../../../core/config/theme";
import { BotDeveloperStore } from "../../../user/cache/bot-developer.store";
import { safeFetchImage } from "../../../../shared/utils/safe-fetch";

export const bannerCommand: ICommand = {
  name: "banner",
  prefixAliases: ["banner", "setbanner", "mybanner", "custombanner", "pimage2"],
  async executePrefix(message: Message, args: string[]): Promise<void> {
    const guildId = message.guildId;
    const userId = message.author.id;
    if (!guildId) return;

    const sub = args[0]?.toLowerCase();
    const color = ThemeManager.getColorSync(guildId);
    const accentColor = color ? resolveColor(color) : null;
    const starEmoji = "<a:white_stars:1547180877962944585>";

    const isBotDev = BotDeveloperStore.isDeveloper(message.author.id);

    if (sub === "list") {
      const bannerUsers = await UserProfileModel.find({
        guildId,
        $or: [{ equippedBannerUrl: { $exists: true, $ne: "" } }, { hasBannerAccess: true }]
      }).lean();

      const container = new ContainerBuilder();
      if (accentColor) container.setAccentColor(accentColor);

      if (bannerUsers.length === 0) {
        container
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${starEmoji} __Custom Voice Banners List__`)
          )
          .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `> -# __No users have custom panel banners or access in this server.__\n\n- __Grant access using:__ \`.v banner allow @User\``
            )
          )
          .addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      } else {
        container
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${starEmoji} __Custom Voice Banners (${bannerUsers.length})__`)
          )
          .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

        for (const user of bannerUsers.slice(0, 15)) {
          const userMention = `<@${user.userId}>`;
          const hasEquipped = Boolean(user.equippedBannerUrl);
          const bannerDisplay = hasEquipped
            ? `[**\`Click to View Banner\`**](${user.equippedBannerUrl})`
            : "*No banner set yet*";
          const statusText = user.hasBannerAccess ? "Granted Access" : "Bot Developer";

          container
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `- **User :** ${userMention} (\`${user.userId}\`)\n- **Status :** \`${statusText}\`\n- **Banner :** ${bannerDisplay}`
              )
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true));
        }
      }

      await message.reply({
        flags: MessageFlags.IsComponentsV2 as any,
        components: [container] as any,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (sub === "allow" || sub === "grant" || sub === "add") {
      if (!isBotDev) {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Only Bot Owner & Developers can grant banner access :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const targets = await extractTargetMembers(message, args.slice(1), 10);
      if (targets.length === 0) {
        await message.reply({
          ...(await Usages.invalidCommand(guildId, "`.v banner allow @user`", "Example: `.v banner allow @User`")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      for (const target of targets) {
        await UserProfileModel.updateOne(
          { userId: target.id, guildId },
          { $set: { hasBannerAccess: true } },
          { upsert: true }
        );
      }

      const mentions = targets.map((t) => `<@${t.id}>`).join(", ");
      const embed = await Usages.executedAction(
        guildId,
        "Banner Access Granted",
        `**__Banner access has been granted to :__** ${mentions}\n> ⟢ They can now set their custom voice panel banner using \`.v banner <url | attach>\`.`
      );
      await message.reply({
        ...embed,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (sub === "revoke" || sub === "deny" || sub === "disallow") {
      if (!isBotDev) {
        await message.reply({
          ...(await Usages.impossible(guildId, "**__Only Bot Owner & Developers can revoke banner access :__**")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      const targets = await extractTargetMembers(message, args.slice(1), 10);
      if (targets.length === 0) {
        await message.reply({
          ...(await Usages.invalidCommand(guildId, "`.v banner revoke @user`", "Example: `.v banner revoke @User`")),
          allowedMentions: { parse: [] }
        });
        return;
      }

      for (const target of targets) {
        await UserProfileModel.updateOne(
          { userId: target.id, guildId },
          { $set: { hasBannerAccess: false } },
          { upsert: true }
        );
      }

      const mentions = targets.map((t) => `<@${t.id}>`).join(", ");
      const embed = await Usages.executedAction(
        guildId,
        "Banner Access Revoked",
        `**__Banner access has been revoked from :__** ${mentions}`
      );
      await message.reply({
        ...embed,
        allowedMentions: { parse: [] }
      });
      return;
    }

    if (sub === "reset" || sub === "remove" || sub === "clear") {
      await UserProfileModel.updateOne(
        { userId, guildId },
        { $unset: { equippedBannerUrl: 1 } },
        { upsert: true }
      );

      const embed = await Usages.executedAction(
        guildId,
        "Custom Banner Reset",
        "**__Your voice panel banner has been reset :__** Your voice rooms will now display the server default banner."
      );
      await message.reply({
        ...embed,
        allowedMentions: { parse: [] }
      });
      return;
    }

    const profile = await UserProfileModel.findOne({ userId, guildId });
    const hasAccess = profile?.hasBannerAccess || isBotDev;

    if (!hasAccess) {
      await message.reply({
        ...(await Usages.impossible(
          guildId,
          "**__Access Denied :__** You don't have permission to set a custom voice panel banner.\n> ⟢ Ask a Bot Developer to grant you access using \`.v banner allow @You\`."
        )),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const attachment = message.attachments.first();
    const possibleUrl = args.find((a) => /^https?:\/\/.+/i.test(a));

    if (!attachment && !possibleUrl) {
      await message.reply({
        ...(await Usages.invalidCommand(
          guildId,
          "`.v banner <url | attach image/GIF>`",
          "Example: `.v banner https://example.com/banner.gif` or attach an image"
        )),
        allowedMentions: { parse: [] }
      });
      return;
    }

    const imageUrl = attachment ? attachment.url : possibleUrl!;
    const processingMsg = await message.reply({
      ...(await Usages.executedAction(
        guildId,
        "Processing Banner",
        "**__Uploading your custom banner to Discord permanent CDN storage...__**"
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

      const filename = `userbanner_${guildId}_${userId}.${ext}`;
      const permanentUrl = await WebhookLogger.uploadImage(buffer, filename);
      const finalUrl = permanentUrl || imageUrl;

      await UserProfileModel.updateOne(
        { userId, guildId },
        { $set: { equippedBannerUrl: finalUrl } },
        { upsert: true }
      );

      await processingMsg.edit({
        ...(await Usages.executedAction(
          guildId,
          "Custom Banner Saved",
          `**__Your custom voice panel banner has been updated and is active!__**\n> ⟢ Saved to Database.\n> ⟢ To reset back to default: \`.v banner reset\`.`
        )),
        allowedMentions: { parse: [] }
      });
    } catch (err: any) {
      await processingMsg.edit({
        ...(await Usages.impossible(guildId, `**__Error uploading banner :__** ${err.message}`)),
        allowedMentions: { parse: [] }
      });
    }
  }
};
