const fs = require('fs');
const path = require('path');

const extraThemeEmojis = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'extra_theme_emojis.json'), 'utf-8')
);

const themeTsPath = path.join(__dirname, '../core/config/theme.ts');
let content = fs.readFileSync(themeTsPath, 'utf-8');

// For each theme hex in extraThemeEmojis
for (const [hex, emojis] of Object.entries(extraThemeEmojis)) {
  // Find the block for this hex: `"${hex}": { ... "activity": "<...>" \n  }`
  const regex = new RegExp(`("${hex}":\\s*\\{[\\s\\S]*?"activity":\\s*"[^"]+")(\\s*\\})`, 'i');
  const match = content.match(regex);
  if (match) {
    const extraLines = `,\n    "mute": "${emojis.mute}",\n    "deafen": "${emojis.deafen}",\n    "tempreject": "${emojis.tempreject}",\n    "randomreject": "${emojis.randomreject}"`;
    content = content.replace(regex, `$1${extraLines}$2`);
    console.log(`Updated theme ${hex} with extra emojis.`);
  } else {
    console.warn(`Could not match theme block for ${hex}`);
  }
}

// Update DEFAULT_EMOJIS
const defaultRegex = /(export const DEFAULT_EMOJIS: Record<string, string> = \{[\s\S]*?"activity":\s*"[^"]+")(\s*\};)/;
if (content.match(defaultRegex)) {
  const extraDefault = `,\n  mute: "${extraThemeEmojis['#00ccdf'].mute}",\n  deafen: "${extraThemeEmojis['#00ccdf'].deafen}",\n  tempreject: "${extraThemeEmojis['#00ccdf'].tempreject}",\n  randomreject: "${extraThemeEmojis['#00ccdf'].randomreject}"`;
  content = content.replace(defaultRegex, `$1${extraDefault}$2`);
  console.log("Updated DEFAULT_EMOJIS with extra emojis.");
}

// Update ThemeManager.getThemeEmoji key mappings
const actionMappingTarget = `else if (key.includes("permit")) key = "permit";
    else if (key.includes("reject") || key.includes("kick")) key = "reject";`;

const actionMappingReplacement = `else if (key.includes("permit")) key = "permit";
    else if (key.includes("temp") && key.includes("reject")) key = "tempreject";
    else if (key.includes("random") && key.includes("reject")) key = "randomreject";
    else if (key.includes("reject") || key.includes("kick")) key = "reject";
    else if (key.includes("mute") && !key.includes("unmute")) key = "mute";
    else if (key.includes("deafen") && !key.includes("undeafen")) key = "deafen";`;

if (content.includes(actionMappingTarget)) {
  content = content.replace(actionMappingTarget, actionMappingReplacement);
  console.log("Updated ThemeManager.getThemeEmoji mappings.");
} else {
  console.warn("Could not find actionMappingTarget in ThemeManager.getThemeEmoji");
}

fs.writeFileSync(themeTsPath, content, 'utf-8');
console.log("Successfully wrote updated theme.ts!");
