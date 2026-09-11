import { ColorResolvable } from "discord.js";
import { GuildThemeModel } from "../../database/schemas/guild-theme.schema";

export const THEME_BUTTON_EMOJIS: Record<string, Record<string, string>> = {
  "#000000": {
    "lock": "<a:a_lock_black:1546856369582383144>",
    "unlock": "<a:a_unlock_black:1546856371725541426>",
    "hide": "<a:a_hide_black:1546856374472802334>",
    "unhide": "<a:a_unhide_black:1546856377291513887>",
    "antiabuse": "<a:a_antiabuse_black:1546856379661164654>",
    "limit": "<a:a_limit_black:1546856381771153529>",
    "rename": "<a:a_rename_black:1546856384300064851>",
    "info": "<a:a_info_black:1546856389215916173>",
    "claim": "<a:a_claim_black:1546856391401013318>",
    "extra": "<a:a_extra_black:1546856393414279169>",
    "wl": "<a:a_wl_black:1546870535105937418>",
    "bl": "<a:a_bl_black:1546870542022221865>",
    "permit": "<a:a_permit_black:1546880558943043634>",
    "reject": "<a:a_reject_black:1546880564127072376>",
    "music": "<a:a_music_black:1547197867175837767>",
    "activity": "<a:a_extra_black:1546856393414279169>",
    "mute": "<a:a_mute_black:1547342948247666728>",
    "deafen": "<a:a_deafen_black:1547342953738010730>",
    "tempreject": "<a:a_tempreject_black:1547342959031226379>",
    "randomreject": "<a:a_randomreject_black:1547342962990784673>"
  },
  "#00ccdf": {
    "lock": "<a:a_lock_cyan:1546856397151539230>",
    "unlock": "<a:a_unlock_cyan:1546856403187007628>",
    "hide": "<a:a_hide_cyan:1546856409600360448>",
    "unhide": "<a:a_unhide_cyan:1546856413274316892>",
    "antiabuse": "<a:a_antiabuse_cyan:1546856415149162516>",
    "limit": "<a:a_limit_cyan:1546856417993035887>",
    "rename": "<a:a_rename_cyan:1546856420580917351>",
    "info": "<a:a_info_cyan:1546856423131189355>",
    "claim": "<a:a_claim_cyan:1546856426230653029>",
    "extra": "<a:a_extra_cyan:1546858381417910404>",
    "wl": "<a:a_wl_cyan:1546870546333966417>",
    "bl": "<a:a_bl_cyan:1546870550515683329>",
    "permit": "<a:a_permit_cyan:1546880568338423892>",
    "reject": "<a:a_reject_cyan:1546880572134002698>",
    "music": "<a:a_music_cyan:1547197868656427038>",
    "activity": "<a:a_extra_cyan:1546858381417910404>",
    "mute": "<a:a_mute_cyan:1547342966954135652>",
    "deafen": "<a:a_deafen_cyan:1547342971727511552>",
    "tempreject": "<a:a_tempreject_cyan:1547342975825219586>",
    "randomreject": "<a:a_randomreject_cyan:1547342980367654972>"
  },
  "#a7a7a7": {
    "lock": "<a:a_lock_silver:1546858386094686250>",
    "unlock": "<a:a_unlock_silver:1546858391828303923>",
    "hide": "<a:a_hide_silver:1546858396014219274>",
    "unhide": "<a:a_unhide_silver:1546858399977963530>",
    "antiabuse": "<a:a_antiabuse_silver:1546858404323139595>",
    "limit": "<a:a_limit_silver:1546858409314230372>",
    "rename": "<a:a_rename_silver:1546858413101944952>",
    "info": "<a:a_info_silver:1546858418852204574>",
    "claim": "<a:a_claim_silver:1546858422945710150>",
    "extra": "<a:a_extra_silver:1546858427278426173>",
    "wl": "<a:a_wl_silver:1546870555431411733>",
    "bl": "<a:a_bl_silver:1546870559659270186>",
    "permit": "<a:a_permit_silver:1546880576336822446>",
    "reject": "<a:a_reject_silver:1546880580430463066>",
    "music": "<a:a_music_silver:1547197870208319539>",
    "activity": "<a:a_extra_silver:1546858427278426173>",
    "mute": "<a:a_mute_silver:1547342984381603961>",
    "deafen": "<a:a_deafen_silver:1547342988814979110>",
    "tempreject": "<a:a_tempreject_silver:1547342993315332229>",
    "randomreject": "<a:a_randomreject_silver:1547342998113878076>"
  },
  "#796bc2": {
    "lock": "<a:a_lock_purple:1546858431611146382>",
    "unlock": "<a:a_unlock_purple:1546858481041277019>",
    "hide": "<a:a_hide_purple:1546858485755416596>",
    "unhide": "<a:a_unhide_purple:1546858489899651115>",
    "antiabuse": "<a:a_antiabuse_purple:1546858494421106809>",
    "limit": "<a:a_limit_purple:1546858499080724482>",
    "rename": "<a:a_rename_purple:1546858503954628719>",
    "info": "<a:a_info_purple:1546858511986724985>",
    "claim": "<a:a_claim_purple:1546858517888110652>",
    "extra": "<a:a_extra_purple:1546858524489949346>",
    "wl": "<a:a_wl_purple:1546870564960862339>",
    "bl": "<a:a_bl_purple:1546870569260032061>",
    "permit": "<a:a_permit_purple:1546880584826224681>",
    "reject": "<a:a_reject_purple:1546880589171269643>",
    "music": "<a:a_music_purple:1547197873194668063>",
    "activity": "<a:a_extra_purple:1546858524489949346>",
    "mute": "<a:a_mute_purple:1547343002358382763>",
    "deafen": "<a:a_deafen_purple:1547343006498160730>",
    "tempreject": "<a:a_tempreject_purple:1547343010432295053>",
    "randomreject": "<a:a_randomreject_purple:1547343014538776656>"
  },
  "#fe90e6": {
    "lock": "<a:a_lock_pink:1546858535529349130>",
    "unlock": "<a:a_unlock_pink:1546858540940001340>",
    "hide": "<a:a_hide_pink:1546858545591357491>",
    "unhide": "<a:a_unhide_pink:1546858551442677831>",
    "antiabuse": "<a:a_antiabuse_pink:1546858555590574114>",
    "limit": "<a:a_limit_pink:1546858562192547922>",
    "rename": "<a:a_rename_pink:1546858566437048382>",
    "info": "<a:a_info_pink:1546858571294318635>",
    "claim": "<a:a_claim_pink:1546858575538692127>",
    "extra": "<a:a_extra_pink:1546858579615809577>",
    "wl": "<a:a_wl_pink:1546870573932478535>",
    "bl": "<a:a_bl_pink:1546870584250732616>",
    "permit": "<a:a_permit_pink:1546880593164505158>",
    "reject": "<a:a_reject_pink:1546880597320925234>",
    "music": "<a:a_music_pink:1547197874541043822>",
    "activity": "<a:a_extra_pink:1546858579615809577>",
    "mute": "<a:a_mute_pink:1547343018812641351>",
    "deafen": "<a:a_deafen_pink:1547343022931578961>",
    "tempreject": "<a:a_tempreject_pink:1547343026794537066>",
    "randomreject": "<a:a_randomreject_pink:1547343031261335562>"
  },
  "#f3ad5e": {
    "lock": "<a:a_lock_orange:1546858584980201594>",
    "unlock": "<a:a_unlock_orange:1546858590038532197>",
    "hide": "<a:a_hide_orange:1546858595046400100>",
    "unhide": "<a:a_unhide_orange:1546858600528609311>",
    "antiabuse": "<a:a_antiabuse_orange:1546858605846986772>",
    "limit": "<a:a_limit_orange:1546858610502533180>",
    "rename": "<a:a_rename_orange:1546858614944309370>",
    "info": "<a:a_info_orange:1546858619650314270>",
    "claim": "<a:a_claim_orange:1546858625383931974>",
    "extra": "<a:a_extra_orange:1546858629951660083>",
    "wl": "<a:a_wl_orange:1546870588402962462>",
    "bl": "<a:a_bl_orange:1546870705973362709>",
    "permit": "<a:a_permit_orange:1546880601179562075>",
    "reject": "<a:a_reject_orange:1546880604858224690>",
    "music": "<a:a_music_orange:1547197876050862101>",
    "activity": "<a:a_extra_orange:1546858629951660083>",
    "mute": "<a:a_mute_orange:1547343035669553223>",
    "deafen": "<a:a_deafen_orange:1547343039498948731>",
    "tempreject": "<a:a_tempreject_orange:1547343044016349274>",
    "randomreject": "<a:a_randomreject_orange:1547343047975768094>"
  },
  "#6fd383": {
    "lock": "<a:a_lock_green:1546858634917580960>",
    "unlock": "<a:a_unlock_green:1546858639564869763>",
    "hide": "<a:a_hide_green:1546858643767566380>",
    "unhide": "<a:a_unhide_green:1546858648783945819>",
    "antiabuse": "<a:a_antiabuse_green:1546858653393354903>",
    "limit": "<a:a_limit_green:1546858658602946670>",
    "rename": "<a:a_rename_green:1546858666656010351>",
    "info": "<a:a_info_green:1546858672779427880>",
    "claim": "<a:a_claim_green:1546858677468790881>",
    "extra": "<a:a_extra_green:1546858683114328084>",
    "wl": "<a:a_wl_green:1546870710222454875>",
    "bl": "<a:a_bl_green:1546870715112886343>",
    "permit": "<a:a_permit_green:1546880608553148537>",
    "reject": "<a:a_reject_green:1546880612193804390>",
    "music": "<a:a_music_green:1547197877225390121>",
    "activity": "<a:a_extra_green:1546858683114328084>",
    "mute": "<a:a_mute_green:1547343052346097736>",
    "deafen": "<a:a_deafen_green:1547343056775417926>",
    "tempreject": "<a:a_tempreject_green:1547343061279969411>",
    "randomreject": "<a:a_randomreject_green:1547343065507827862>"
  },
  "#ff4d6d": {
    "lock": "<a:a_lock_ruby:1546856653595607080>",
    "unlock": "<a:a_unlock_ruby:1546858689321902161>",
    "hide": "<a:a_hide_ruby:1546858693969059930>",
    "unhide": "<a:a_unhide_ruby:1546858699094761553>",
    "antiabuse": "<a:a_antiabuse_ruby:1546858704018735195>",
    "limit": "<a:a_limit_ruby:1546858708695257099>",
    "rename": "<a:a_rename_ruby:1546858713548066896>",
    "info": "<a:a_info_ruby:1546858718388551751>",
    "claim": "<a:a_claim_ruby:1546858722847105026>",
    "extra": "<a:a_extra_ruby:1546858727569625128>",
    "wl": "<a:a_wl_ruby:1546870719265116240>",
    "bl": "<a:a_bl_ruby:1546870723195175016>",
    "permit": "<a:a_permit_ruby:1546880616010616883>",
    "reject": "<a:a_reject_ruby:1546880621249433691>",
    "music": "<a:a_music_ruby:1547197878600999004>",
    "activity": "<a:a_extra_ruby:1546858727569625128>",
    "mute": "<a:a_mute_ruby:1547343069651800068>",
    "deafen": "<a:a_deafen_ruby:1547343073938378852>",
    "tempreject": "<a:a_tempreject_ruby:1547343078107643964>",
    "randomreject": "<a:a_randomreject_ruby:1547343082154893472>"
  },
  "#5865f2": {
    "lock": "<a:a_lock_indigo:1546858732439347262>",
    "unlock": "<a:a_unlock_indigo:1546858736797225002>",
    "hide": "<a:a_hide_indigo:1546858741851492373>",
    "unhide": "<a:a_unhide_indigo:1546858746062577737>",
    "antiabuse": "<a:a_antiabuse_indigo:1546858751544262728>",
    "limit": "<a:a_limit_indigo:1546858756196012032>",
    "rename": "<a:a_rename_indigo:1546858760906215545>",
    "info": "<a:a_info_indigo:1546858767126110258>",
    "claim": "<a:a_claim_indigo:1546858771601694760>",
    "extra": "<a:a_extra_indigo:1546858776210972675>",
    "wl": "<a:a_wl_indigo:1546870727569842246>",
    "bl": "<a:a_bl_indigo:1546870731449573436>",
    "permit": "<a:a_permit_indigo:1546880626064629801>",
    "reject": "<a:a_reject_indigo:1546880630661451798>",
    "music": "<a:a_music_indigo:1547197879888908308>",
    "activity": "<a:a_extra_indigo:1546858776210972675>",
    "mute": "<a:a_mute_indigo:1547343086089281607>",
    "deafen": "<a:a_deafen_indigo:1547343090082390126>",
    "tempreject": "<a:a_tempreject_indigo:1547343094494666802>",
    "randomreject": "<a:a_randomreject_indigo:1547343098873380874>"
  },
  "#ff7a59": {
    "lock": "<a:a_lock_coral:1546858783362515057>",
    "unlock": "<a:a_unlock_coral:1546858787888038100>",
    "hide": "<a:a_hide_coral:1546858792531271744>",
    "unhide": "<a:a_unhide_coral:1546858797698514964>",
    "antiabuse": "<a:a_antiabuse_coral:1546858880104140821>",
    "limit": "<a:a_limit_coral:1546858884474601512>",
    "rename": "<a:a_rename_coral:1546858888953987152>",
    "info": "<a:a_info_coral:1546858893097836638>",
    "claim": "<a:a_claim_coral:1546858899297276007>",
    "extra": "<a:a_extra_coral:1546858906205163561>",
    "wl": "<a:a_wl_coral:1546870735744671784>",
    "bl": "<a:a_bl_coral:1546870739595034634>",
    "permit": "<a:a_permit_coral:1546880634822066249>",
    "reject": "<a:a_reject_coral:1546880638181838992>",
    "music": "<a:a_music_coral:1547197881793122315>",
    "activity": "<a:a_extra_coral:1546858906205163561>",
    "mute": "<a:a_mute_coral:1547343103122481213>",
    "deafen": "<a:a_deafen_coral:1547343107962568774>",
    "tempreject": "<a:a_tempreject_coral:1547343112685228133>",
    "randomreject": "<a:a_randomreject_coral:1547343116678336582>"
  },
  "#246409": {
    "lock": "<a:a_lock_forest:1546858911154311168>",
    "unlock": "<a:a_unlock_forest:1546858916074233956>",
    "hide": "<a:a_hide_forest:1546858921354989682>",
    "unhide": "<a:a_unhide_forest:1546858926719369256>",
    "antiabuse": "<a:a_antiabuse_forest:1546858933723865270>",
    "limit": "<a:a_limit_forest:1546858939805728768>",
    "rename": "<a:a_rename_forest:1546858944331386930>",
    "info": "<a:a_info_forest:1546858948856909964>",
    "claim": "<a:a_claim_forest:1546858953877753878>",
    "extra": "<a:a_extra_forest:1546858959221166131>",
    "wl": "<a:a_wl_forest:1546870744451911811>",
    "bl": "<a:a_bl_forest:1546870749237743667>",
    "permit": "<a:a_permit_forest:1546880642237595678>",
    "reject": "<a:a_reject_forest:1546880648331923598>",
    "music": "<a:a_music_forest:1547197884460572682>",
    "activity": "<a:a_extra_forest:1546858959221166131>",
    "mute": "<a:a_mute_forest:1547343121153654816>",
    "deafen": "<a:a_deafen_forest:1547343125197099100>",
    "tempreject": "<a:a_tempreject_forest:1547343129764696064>",
    "randomreject": "<a:a_randomreject_forest:1547343134264918139>"
  },
  "#8c8f45": {
    "lock": "<a:a_lock_olive:1546858964443205633>",
    "unlock": "<a:a_unlock_olive:1546858969354477618>",
    "hide": "<a:a_hide_olive:1546858973922332744>",
    "unhide": "<a:a_unhide_olive:1546858979676782612>",
    "antiabuse": "<a:a_antiabuse_olive:1546858985246695547>",
    "limit": "<a:a_limit_olive:1546858989822935140>",
    "rename": "<a:a_rename_olive:1546858995162030201>",
    "info": "<a:a_info_olive:1546859001159880774>",
    "claim": "<a:a_claim_olive:1546859006134583416>",
    "extra": "<a:a_extra_olive:1546859010257330329>",
    "wl": "<a:a_wl_olive:1546870754623356939>",
    "bl": "<a:a_bl_olive:1546870760251986033>",
    "permit": "<a:a_permit_olive:1546880652715102250>",
    "reject": "<a:a_reject_olive:1546880656523534478>",
    "music": "<a:a_music_olive:1547197885739835494>",
    "activity": "<a:a_extra_olive:1546859010257330329>",
    "mute": "<a:a_mute_olive:1547343138878783568>",
    "deafen": "<a:a_deafen_olive:1547343143094067291>",
    "tempreject": "<a:a_tempreject_olive:1547343147158212689>",
    "randomreject": "<a:a_randomreject_olive:1547343150681559112>"
  },
  "#ffffff": {
    "lock": "<a:a_lock_white:1546859017069133907>",
    "unlock": "<a:a_unlock_white:1546859024576680007>",
    "hide": "<a:a_hide_white:1546859030625132626>",
    "unhide": "<a:a_unhide_white:1546859180931940462>",
    "antiabuse": "<a:a_antiabuse_white:1546859185457856543>",
    "limit": "<a:a_limit_white:1546859191187021884>",
    "rename": "<a:a_rename_white:1546859196165783554>",
    "info": "<a:a_info_white:1546859201177976903>",
    "claim": "<a:a_claim_white:1546859206760599675>",
    "extra": "<a:a_extra_white:1546859211588108348>",
    "wl": "<a:a_wl_white:1546870765088153651>",
    "bl": "<a:a_bl_white:1546870770414780498>",
    "permit": "<a:a_permit_white:1546880660545863760>",
    "reject": "<a:a_reject_white:1546880665562386452>",
    "music": "<a:a_music_white:1547197887191187456>",
    "activity": "<a:a_extra_white:1546859211588108348>",
    "mute": "<a:a_mute_white:1547343154951229555>",
    "deafen": "<a:a_deafen_white:1547343158818373774>",
    "tempreject": "<a:a_tempreject_white:1547343166859116575>",
    "randomreject": "<a:a_randomreject_white:1547343170956697622>"
  },
  "#ff0004": {
    "lock": "<a:a_lock_scarlet:1546916186262995025>",
    "unlock": "<a:a_unlock_scarlet:1546916191182921758>",
    "hide": "<a:a_hide_scarlet:1546916195104718969>",
    "unhide": "<a:a_unhide_scarlet:1546916198955090050>",
    "antiabuse": "<a:a_antiabuse_scarlet:1546916203048603749>",
    "limit": "<a:a_limit_scarlet:1546916206718746655>",
    "rename": "<a:a_rename_scarlet:1546916210464002201>",
    "info": "<a:a_info_scarlet:1546916215187046520>",
    "claim": "<a:a_claim_scarlet:1546916221654401104>",
    "extra": "<a:a_extra_scarlet:1546916225664286852>",
    "wl": "<a:a_wl_scarlet:1546916231129604286>",
    "bl": "<a:a_bl_scarlet:1546916235726430318>",
    "permit": "<a:a_permit_scarlet:1546916242374524999>",
    "reject": "<a:a_reject_scarlet:1546916247491448842>",
    "music": "<a:a_music_scarlet:1547197889439211520>",
    "activity": "<a:a_extra_scarlet:1546916225664286852>",
    "mute": "<a:a_mute_scarlet:1547343175964692630>",
    "deafen": "<a:a_deafen_scarlet:1547343181161435298>",
    "tempreject": "<a:a_tempreject_scarlet:1547343185435562105>",
    "randomreject": "<a:a_randomreject_scarlet:1547343189508235315>"
  },
  "#a6af27": {
    "lock": "<a:a_lock_chartreuse:1546916257092341761>",
    "unlock": "<a:a_unlock_chartreuse:1546916261844230237>",
    "hide": "<a:a_hide_chartreuse:1546916266781049005>",
    "unhide": "<a:a_unhide_chartreuse:1546916272514531439>",
    "antiabuse": "<a:a_antiabuse_chartreuse:1546916276436336751>",
    "limit": "<a:a_limit_chartreuse:1546916281205129298>",
    "rename": "<a:a_rename_chartreuse:1546916285332590673>",
    "info": "<a:a_info_chartreuse:1546916290810093648>",
    "claim": "<a:a_claim_chartreuse:1546916295100993631>",
    "extra": "<a:a_extra_chartreuse:1546916299077193759>",
    "wl": "<a:a_wl_chartreuse:1546916303393001472>",
    "bl": "<a:a_bl_chartreuse:1546916308522762431>",
    "permit": "<a:a_permit_chartreuse:1546916312452825140>",
    "reject": "<a:a_reject_chartreuse:1546916316449869969>",
    "music": "<a:a_music_chartreuse:1547197891687481375>",
    "activity": "<a:a_extra_chartreuse:1546916299077193759>",
    "mute": "<a:a_mute_chartreuse:1547343193786290226>",
    "deafen": "<a:a_deafen_chartreuse:1547343198056218624>",
    "tempreject": "<a:a_tempreject_chartreuse:1547343202527477930>",
    "randomreject": "<a:a_randomreject_chartreuse:1547343207447273572>"
  },
  "#1f5351": {
    "lock": "<a:a_lock_teal:1546916324595212308>",
    "unlock": "<a:a_unlock_teal:1546916328453963939>",
    "hide": "<a:a_hide_teal:1546916332422041761>",
    "unhide": "<a:a_unhide_teal:1546916336184205352>",
    "antiabuse": "<a:a_antiabuse_teal:1546916339430461483>",
    "limit": "<a:a_limit_teal:1546916344329543771>",
    "rename": "<a:a_rename_teal:1546916349006053396>",
    "info": "<a:a_info_teal:1546916352814620752>",
    "claim": "<a:a_claim_teal:1546916356547547216>",
    "extra": "<a:a_extra_teal:1546916360930463824>",
    "wl": "<a:a_wl_teal:1546916364663656508>",
    "bl": "<a:a_bl_teal:1546916369373593740>",
    "permit": "<a:a_permit_teal:1546916374067286058>",
    "reject": "<a:a_reject_teal:1546916378852724886>",
    "music": "<a:a_music_teal:1547197893230731295>",
    "activity": "<a:a_extra_teal:1546916360930463824>",
    "mute": "<a:a_mute_teal:1547343212782424196>",
    "deafen": "<a:a_deafen_teal:1547343217421320222>",
    "tempreject": "<a:a_tempreject_teal:1547343221498318988>",
    "randomreject": "<a:a_randomreject_teal:1547343225600348170>"
  },
  "#65c75e": {
    "lock": "<a:a_lock_lime:1546916390424936609>",
    "unlock": "<a:a_unlock_lime:1546916395315363880>",
    "hide": "<a:a_hide_lime:1546916400386416713>",
    "unhide": "<a:a_unhide_lime:1546916405209862184>",
    "antiabuse": "<a:a_antiabuse_lime:1546916408816828437>",
    "limit": "<a:a_limit_lime:1546916413090955424>",
    "rename": "<a:a_rename_lime:1546916417679528119>",
    "info": "<a:a_info_lime:1546916421710258237>",
    "claim": "<a:a_claim_lime:1546916425703366676>",
    "extra": "<a:a_extra_lime:1546916430300184637>",
    "wl": "<a:a_wl_lime:1546916438277628004>",
    "bl": "<a:a_bl_lime:1546916442383974470>",
    "permit": "<a:a_permit_lime:1546916450957008977>",
    "reject": "<a:a_reject_lime:1546916454740394004>",
    "music": "<a:a_music_lime:1547197895390920724>",
    "activity": "<a:a_extra_lime:1546916430300184637>",
    "mute": "<a:a_mute_lime:1547343229404581978>",
    "deafen": "<a:a_deafen_lime:1547343235599564841>",
    "tempreject": "<a:a_tempreject_lime:1547343239584030761>",
    "randomreject": "<a:a_randomreject_lime:1547343243878858904>"
  }
};

export const DEFAULT_EMOJIS: Record<string, string> = {
  lock: "<a:anim_lock_cb:1546633975487930435>",
  unlock: "<a:anim_unlock_cb:1546633978600099910>",
  hide: "<a:anim_hide_cb:1546633980558835722>",
  unhide: "<a:anim_unhide_cb:1546639680995459203>",
  antiabuse: "<a:anim_antiabuse_cb:1546633994903490570>",
  limit: "<a:anim_limit_cb:1546633984975311029>",
  rename: "<a:anim_rename_cb:1546633989324804128>",
  info: "<a:anim_info_cb:1546639682924712037>",
  claim: "<a:anim_claim_cb:1546633981829718106>",
  extra: "<a:anim_extra_cb:1546633992030265507>",
  wl: "<a:anim_wl_cb:1546636688980451489>",
  bl: "<a:anim_bl_cb:1546636690746245202>",
  permit: "<a:anim_permit_cb:1546636691845152838>",
  reject: "<a:anim_reject_cb:1546634011315806218>",
  music: "<a:a_music_cyan:1547197868656427038>",
  activity: "<a:anim_extra_cb:1546633992030265507>",
  mute: "<a:a_mute_cyan:1547342966954135652>",
  deafen: "<a:a_deafen_cyan:1547342971727511552>",
  tempreject: "<a:a_tempreject_cyan:1547342975825219586>",
  randomreject: "<a:a_randomreject_cyan:1547342980367654972>"
};

export class ThemeManager {
  private static guildColorCache: Map<string, ColorResolvable | null> = new Map();

  public static async preload(): Promise<void> {
    try {
      const records = await GuildThemeModel.find().lean();
      for (const rec of records) {
        if (rec.guildId && rec.embedColor) {
          this.guildColorCache.set(rec.guildId, rec.embedColor as ColorResolvable);
        }
      }
    } catch {}
  }

  public static getColorSync(guildId?: string | null): ColorResolvable | null {
    if (!guildId) return null;
    return this.guildColorCache.get(guildId) ?? null;
  }

  public static getThemeEmoji(guildId: string | undefined | null, action: string): string {
    const rawColor = this.getColorSync(guildId);
    let key = action.toLowerCase().trim();
    if (key.includes("anti") && key.includes("abuse")) key = "antiabuse";
    else if (key.includes("lock")) key = key.includes("un") ? "unlock" : "lock";
    else if (key.includes("hide")) key = key.includes("un") ? "unhide" : "hide";
    else if (key.includes("rename") || key.includes("name")) key = "rename";
    else if (key.includes("status")) key = "extra";
    else if (key.includes("limit")) key = "limit";
    else if (key.includes("claim")) key = "claim";
    else if (key.includes("info")) key = "info";
    else if (key.includes("permit")) key = "permit";
    else if (key.includes("temp") && key.includes("reject")) key = "tempreject";
    else if (key.includes("random") && key.includes("reject")) key = "randomreject";
    else if (key.includes("reject") || key.includes("kick")) key = "reject";
    else if (key.includes("mute") && !key.includes("unmute")) key = "mute";
    else if (key.includes("deafen") && !key.includes("undeafen")) key = "deafen";
    else if (key.includes("extra")) key = "extra";
    else if (key.includes("manager") || key.includes("cowner") || key.includes("co-owner") || key.includes("trusted") || key === "man") key = "extra";
    else if (key.includes("wl") || key.includes("white")) key = "wl";
    else if (key.includes("bl") || key.includes("black")) key = "bl";
    else if (key.includes("music") || key.includes("song")) key = "music";
    else if (key.includes("activity") || key.includes("game") || key.includes("lunch")) key = "activity";

    if (rawColor && typeof rawColor === "string") {
      const hex = rawColor.toLowerCase();
      const map = THEME_BUTTON_EMOJIS[hex];
      if (map && map[key]) {
        return map[key];
      }
    }
    return DEFAULT_EMOJIS[key] || DEFAULT_EMOJIS.extra;
  }

  public static async getColor(guildId?: string | null): Promise<ColorResolvable | null> {
    if (!guildId) return null;

    if (this.guildColorCache.has(guildId)) {
      return this.guildColorCache.get(guildId) ?? null;
    }

    const record = await GuildThemeModel.findOne({ guildId }).maxTimeMS(1000).lean().catch(() => null);
    const color = record?.embedColor ? (record.embedColor as ColorResolvable) : null;
    this.guildColorCache.set(guildId, color);
    return color;
  }

  public static async setColor(guildId: string, hexColor: string): Promise<void> {
    const formatted = hexColor.startsWith("#") ? hexColor : `#${hexColor}`;
    this.guildColorCache.set(guildId, formatted as ColorResolvable);
    await GuildThemeModel.updateOne(
      { guildId },
      { embedColor: formatted },
      { upsert: true }
    ).exec();
  }

  public static invalidateCache(guildId: string): void {
    this.guildColorCache.delete(guildId);
  }

  public static isValidHex(hex: string): boolean {
    return /^#?([0-9A-F]{3}){1,2}$/i.test(hex);
  }
}
