import { MessageFlags, MessageMentionOptions, BaseMessageOptions } from "discord.js";

export interface V2Payload {
  flags: number | MessageFlags;
  components: NonNullable<BaseMessageOptions["components"]>;
  allowedMentions?: MessageMentionOptions;
}
