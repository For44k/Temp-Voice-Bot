const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const CLIENT_ID = process.env.CLIENT_ID;

const USED_NAMES = new Set([
  'brand_steam',
  'brand_spotify',
  'brand_github',
  'brand_reddit',
  'lucide_info',
  'anim_lock_85',
  'anim_unlock_85',
  'anim_hide_85',
  'anim_claim_85',
  'anim_reset_85',
  'anim_roomlimit_85_v3',
  'anim_rename_85_v2',
  'anim_extra_85_v2',
  'anim_mute_85_sleek',
  'anim_deafen_85_sleek',
  'anim_tempreject_85_sleek',
  'anim_reject_minus_85',
  'anim_permit_plus_85',
  'anim_wl_plus_85',
  'anim_bl_minus_85',
  'anim_fixlag_85',
  'anim_tmute_85_sleek',
  'anim_tlock_85',
  'anim_unmute_85',
  'anim_undeafen_85'
]);

async function clean() {
  const res = await rest.get(Routes.applicationEmojis(CLIENT_ID));
  const items = res.items || res || [];
  console.log('Total emojis found:', items.length);

  for (const item of items) {
    if (!USED_NAMES.has(item.name)) {
      console.log('Deleting unused emoji:', item.id, item.name);
      try {
        await rest.delete(Routes.applicationEmoji(CLIENT_ID, item.id));
      } catch (err) {
        console.error('Failed delete', item.name, err.message);
      }
    }
  }
  console.log('Clean complete!');
}

clean().catch(console.error);
