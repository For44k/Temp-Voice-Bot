import { ContainerBuilder, MessageFlags } from "discord.js";

export interface V2Payload {
  flags: number | MessageFlags;
  components: ContainerBuilder[];
  allowedMentions?: { parse: string[] };
}
