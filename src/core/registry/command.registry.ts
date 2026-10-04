import { ICommand } from "../../shared/types/command.types";
import { lockCommand } from "../../modules/voice/commands/access/lock.command";
import { unlockCommand } from "../../modules/voice/commands/access/unlock.command";
import { tlockCommand } from "../../modules/voice/commands/access/tlock.command";
import { tunlockCommand } from "../../modules/voice/commands/access/tunlock.command";
import { tmuteCommand } from "../../modules/voice/commands/access/tmute.command";
import { tunmuteCommand } from "../../modules/voice/commands/access/tunmute.command";
import { hideCommand } from "../../modules/voice/commands/access/hide.command";
import { unhideCommand } from "../../modules/voice/commands/access/unhide.command";
import { permitCommand } from "../../modules/voice/commands/permissions/permit.command";
import { rejectCommand } from "../../modules/voice/commands/permissions/reject.command";
import { kickCommand } from "../../modules/voice/commands/permissions/kick.command";
import { muteCommand } from "../../modules/voice/commands/permissions/mute.command";
import { unmuteCommand } from "../../modules/voice/commands/permissions/unmute.command";
import { deafenCommand } from "../../modules/voice/commands/permissions/deafen.command";
import { undeafenCommand } from "../../modules/voice/commands/permissions/undeafen.command";
import { ownerCommand } from "../../modules/voice/commands/ownership/owner.command";
import { claimCommand } from "../../modules/voice/commands/ownership/claim.command";
import { unclaimCommand } from "../../modules/voice/commands/ownership/unclaim.command";
import { vcCommand } from "../../modules/voice/commands/ownership/vc.command";
import { cownerCommand } from "../../modules/voice/commands/management/cowner.command";
import { whitelistCommand } from "../../modules/voice/commands/management/whitelist.command";
import { onetapCommand } from "../../modules/voice/commands/management/onetap.command";
import { setupCommand } from "../../modules/voice/commands/management/setup.command";
import { setbotCommand } from "../../modules/voice/commands/management/setbot.command";
import { nameCommand } from "../../modules/voice/commands/settings/name.command";
import { limitCommand } from "../../modules/voice/commands/settings/limit.command";
import { statsCommand } from "../../modules/voice/commands/settings/stats.command";
import { fixlagCommand } from "../../modules/voice/commands/settings/fixlag.command";
import { themeCommand } from "../../modules/voice/commands/settings/theme.command";
import { panelimageCommand } from "../../modules/voice/commands/settings/panelimage.command";
import { aliasCommand } from "../../modules/user/commands/alias.command";
import { blacklistCommand } from "../../modules/user/commands/blacklist.command";
import { trustedCommand } from "../../modules/user/commands/trusted.command";
import { bluCommand } from "../../modules/user/commands/blu.command";
import { blsCommand } from "../../modules/user/commands/bls.command";
import { serversCommand } from "../../modules/user/commands/servers.command";
import { devCommand } from "../../modules/user/commands/dev.command";

import { bitrateCommand } from "../../modules/voice/commands/settings/bitrate.command";
import { regionCommand } from "../../modules/voice/commands/settings/region.command";
import { statusCommand } from "../../modules/voice/commands/settings/status.command";
import { gameCommand } from "../../modules/voice/commands/management/game.command";
import { musicCommand } from "../../modules/voice/commands/management/music.command";
import { panelCommand } from "../../modules/voice/commands/settings/panel.command";
import { joinCommand } from "../../modules/voice/commands/management/join.command";
import { helpCommand } from "../../modules/user/commands/help.command";
import { pingCommand } from "../../modules/user/commands/ping.command";
import { bannerCommand } from "../../modules/voice/commands/settings/banner.command";
import { abCommand } from "../../modules/voice/commands/access/ab.command";
import { needhelpCommand } from "../../modules/voice/commands/management/needhelp.command";

export const commandRegistry: ICommand[] = [
  helpCommand,
  pingCommand,
  bannerCommand,
  abCommand,
  lockCommand,
  unlockCommand,
  tlockCommand,
  tunlockCommand,
  tmuteCommand,
  tunmuteCommand,
  hideCommand,
  unhideCommand,
  permitCommand,
  rejectCommand,
  kickCommand,
  muteCommand,
  unmuteCommand,
  deafenCommand,
  undeafenCommand,
  ownerCommand,
  claimCommand,
  unclaimCommand,
  vcCommand,
  cownerCommand,
  whitelistCommand,
  gameCommand,
  musicCommand,
  panelCommand,
  joinCommand,
  onetapCommand,
  setupCommand,
  setbotCommand,
  needhelpCommand,
  nameCommand,
  limitCommand,
  statusCommand,
  statsCommand,
  fixlagCommand,
  bitrateCommand,
  regionCommand,
  themeCommand,
  panelimageCommand,
  aliasCommand,
  blacklistCommand,
  trustedCommand,
  bluCommand,
  blsCommand,
  serversCommand,
  devCommand
];

export const commandMap: Map<string, ICommand> = new Map(
  commandRegistry.map((cmd) => [cmd.name, cmd])
);

export const prefixCommandMap: Map<string, ICommand> = new Map();
for (const cmd of commandRegistry) {
  prefixCommandMap.set(cmd.name, cmd);
  if (cmd.prefixAliases) {
    for (const alias of cmd.prefixAliases) {
      prefixCommandMap.set(alias, cmd);
    }
  }
}
