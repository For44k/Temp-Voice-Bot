export interface EmojiItem {
  name: string;
  id: string;
  animated: boolean;
}

export const ACTION_EMOJIS: Record<string, string> = {
  lock: "<a:anim_lock_cb:1546633975487930435>",
  unlock: "<a:anim_unlock_cb:1546633978600099910>",
  hide: "<a:anim_hide_cb:1546633980558835722>",
  unhide: "<a:anim_unhide_cb:1546639680995459203>",
  claim: "<a:anim_claim_cb:1546633981829718106>",
  unclaim: "<a:anim_claim_cb:1546633981829718106>",
  reject: "<a:anim_reject_cb:1546634011315806218>",
  "random reject": "<a:anim_reject_cb:1546634011315806218>",
  "temp reject": "<a:anim_tempreject_cb:1546634008832638986>",
  "temporary reject": "<a:anim_tempreject_cb:1546634008832638986>",
  kick: "<a:anim_reject_cb:1546634011315806218>",
  "random kick": "<a:anim_reject_cb:1546634011315806218>",
  mute: "<a:anim_mute_cb:1546634004919222355>",
  unmute: "<a:anim_mute_cb:1546634004919222355>",
  deafen: "<a:anim_deafen_85_sleek:1546594284516679680>",
  undeafen: "<a:anim_undeafen_85:1546593361618800641>",
  permit: "<a:anim_permit_cb:1546636691845152838>",
  limit: "<a:anim_limit_cb:1546633984975311029>",
  rename: "<a:anim_rename_cb:1546633989324804128>",
  name: "<a:anim_rename_cb:1546633989324804128>",
  "channel name": "<a:anim_rename_cb:1546633989324804128>",
  "voice name": "<a:anim_rename_cb:1546633989324804128>",
  status: "<a:anim_extra_cb:1546633992030265507>",
  "voice status": "<a:anim_extra_cb:1546633992030265507>",
  reset: "<a:anim_reset_cb:1546633997524799578>",
  fixlag: "<a:anim_reset_cb:1546633997524799578>",
  "lag resolved": "<a:anim_reset_cb:1546633997524799578>",
  tmute: "<a:anim_mute_cb:1546634004919222355>",
  tunmute: "<a:anim_mute_cb:1546634004919222355>",
  "text mute": "<a:anim_mute_cb:1546634004919222355>",
  "text unmute": "<a:anim_mute_cb:1546634004919222355>",
  tlock: "<a:anim_lock_cb:1546633975487930435>",
  tunlock: "<a:anim_unlock_cb:1546633978600099910>",
  "text lock": "<a:anim_lock_cb:1546633975487930435>",
  "text unlock": "<a:anim_unlock_cb:1546633978600099910>",
  antiabuse: "<a:anim_antiabuse_cb:1546633994903490570>",
  "anti abuse": "<a:anim_antiabuse_cb:1546633994903490570>",
  whitelist: "<a:anim_wl_cb:1546636688980451489>",
  whitelisted: "<a:anim_wl_cb:1546636688980451489>",
  "whitelist cleared": "<a:anim_wl_cb:1546636688980451489>",
  blacklist: "<a:anim_bl_cb:1546636690746245202>",
  blacklisted: "<a:anim_bl_cb:1546636690746245202>",
  "blacklist removed": "<a:anim_bl_cb:1546636690746245202>",
  "global user blacklist": "<a:anim_bl_cb:1546636690746245202>",
  "global server blacklist": "<a:anim_bl_cb:1546636690746245202>",
  owner: "<a:anim_sparkle_85:1546687452079722506>",
  transfer: "<a:anim_transfer_cb:1546683267892387882>",
  "ownership transferred": "<a:anim_transfer_cb:1546683267892387882>",
  "co-owners": "<a:anim_sparkle_85:1546687452079722506>",
  "co-owners list": "<a:anim_sparkle_85:1546687452079722506>",
  "trusted managers added": "<a:anim_sparkle_85:1546687452079722506>",
  "trusted managers removed": "<a:anim_sparkle_85:1546687452079722506>",
  info: "<a:anim_info_cb:1546639682924712037>",
  extra: "<a:anim_extra_cb:1546633992030265507>",
  theme: "<a:anim_sparkle_85:1546687452079722506>",
  "theme updated": "<a:anim_sparkle_85:1546687452079722506>",
  "server theme": "<a:anim_sparkle_85:1546687452079722506>",
  support: "<a:anim_info_cb:1546639682924712037>",
  steam: "<:brand_steam:1546587516461645838>",
  spotify: "<:brand_spotify:1546587517694902313>",
  github: "<:brand_github:1546587519410372638>",
  reddit: "<:brand_reddit:1546587523839434824>",
  heart: "<a:pink_Heartjump:1546859773721444382>"
};

export class EmojiManager {
  private static dynamicEmojis: Map<string, string> = new Map();

  public static setDynamicEmojis(emojis: EmojiItem[]): void {
    this.dynamicEmojis.clear();
    for (const item of emojis) {
      const formatted = `<${item.animated ? "a" : ""}:${item.name}:${item.id}>`;
      this.dynamicEmojis.set(item.name.toLowerCase(), formatted);
    }
  }

  public static get(key: string, fallback?: string): string {
    const cleanKey = key.toLowerCase().trim();
    if (this.dynamicEmojis.has(cleanKey)) {
      return this.dynamicEmojis.get(cleanKey)!;
    }
    if (ACTION_EMOJIS[cleanKey]) {
      return ACTION_EMOJIS[cleanKey];
    }
    for (const [k, v] of Object.entries(ACTION_EMOJIS)) {
      if (cleanKey.includes(k) || k.includes(cleanKey)) {
        return v;
      }
    }
    return fallback || ACTION_EMOJIS["info"] || "ℹ️";
  }

  public static getAll(): Record<string, string> {
    const result: Record<string, string> = { ...ACTION_EMOJIS };
    for (const [key, val] of this.dynamicEmojis.entries()) {
      result[key] = val;
    }
    return result;
  }
}
