const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or CLIENT_ID in .env");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

let lucide = null;
try {
  lucide = require('/root/lucide_icons.cjs');
} catch (e) {
  console.error("Failed to load /root/lucide_icons.cjs", e.message);
}

const HEX_COLOR = "#858585";

const BRAND_ICONS = {
  steam: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="${HEX_COLOR}"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.495 0 4.524 2.029 4.524 4.524s-2.029 4.524-4.524 4.524h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.704L.438 15.05C1.942 20.207 6.605 24 12.135 24 18.69 24 24 18.69 24 12.135S18.69 0 11.979 0zm-3.613 16.038c-.352-.146-.628-.42-.777-.771l-1.503-.621c.241.672.766 1.198 1.439 1.439.957.344 2.02-.143 2.363-1.1.144-.352.144-.736.043-1.09l-1.565.643zm7.573-7.128c0-1.674-1.362-3.036-3.036-3.036s-3.036 1.362-3.036 3.036 1.362 3.036 3.036 3.036 3.036-1.362 3.036-3.036zm-5.327 0c0-1.263 1.028-2.291 2.291-2.291 1.263 0 2.291 1.028 2.291 2.291s-1.028 2.291-2.291 2.291c-1.263 0-2.291-1.028-2.291-2.291z"/></svg>`,
  spotify: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="${HEX_COLOR}"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.216.354-.674.468-1.028.252-2.822-1.724-6.376-2.114-10.564-1.158-.403.092-.806-.157-.899-.56-.092-.403.157-.806.56-.899 4.588-1.048 8.52-.602 11.679 1.337.354.216.468.674.252 1.028zm1.468-3.26c-.272.443-.852.585-1.295.313-3.23-1.985-8.155-2.56-11.977-1.4-4.96.15-1.02-.132-1.171-.629-.15-.496.132-1.02.629-1.171 4.372-1.326 9.803-.687 13.501 1.592.443.272.585.852.313 1.295zm.126-3.41c-3.874-2.3-10.264-2.513-13.974-1.387-.594.18-1.226-.155-1.406-.749-.18-.594.155-1.226.749-1.406 4.262-1.294 11.312-1.047 15.772 1.6c.534.317.708 1.009.391 1.543-.317.534-1.009.708-1.532.399z"/></svg>`,
  github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="${HEX_COLOR}"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`,
  reddit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="${HEX_COLOR}"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>`
};

const LUCIDE_MAPPINGS = {
  lock: "lock",
  unlock: "unlock",
  claim: "user-check",
  hide: "eye-off",
  unhide: "eye",
  reset: "rotate-ccw",
  limit: "hash",
  rename: "edit-3",
  info: "info",
  mute: "mic-off",
  deafen: "volume-x",
  reject: "user-x",
  extra: "sparkles",
  temp_reject: "clock"
};

async function getCanvas() {
  try {
    return require('@napi-rs/canvas');
  } catch {
    try {
      return require('canvas');
    } catch {
      throw new Error("No canvas library available");
    }
  }
}

async function svgToPngDataUri(svg, size = 128) {
  const canvasMod = await getCanvas();
  const { createCanvas, loadImage } = canvasMod;
  const img = await loadImage(Buffer.from(svg));
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, size, size);

  let pngBuf;
  if (typeof canvas.toBuffer === "function") {
    pngBuf = canvas.toBuffer("image/png");
  } else if (typeof canvas.encode === "function") {
    pngBuf = await canvas.encode("png");
  }
  return `data:image/png;base64,${pngBuf.toString("base64")}`;
}

async function uploadEmoji(name, dataUri) {
  try {
    const res = await rest.post(Routes.applicationEmojis(CLIENT_ID), {
      body: { name, image: dataUri }
    });
    console.log(`[SUCCESS] Uploaded: <:${res.name}:${res.id}>`);
    return res;
  } catch (err) {
    console.error(`[ERROR] Failed to upload ${name}:`, err.rawError || err.message);
    return null;
  }
}

async function main() {
  console.log("Starting custom #858585 emojis generation and upload to Application Portal...");

  const existingRes = await rest.get(Routes.applicationEmojis(CLIENT_ID)).catch(() => ({ items: [] }));
  const existingItems = existingRes.items || existingRes || [];
  const existingNames = new Set(existingItems.map(e => e.name));

  const uploadedEmojis = {};

  for (const [name, svg] of Object.entries(BRAND_ICONS)) {
    const emojiName = `brand_${name}`;
    if (existingNames.has(emojiName)) {
      const match = existingItems.find(e => e.name === emojiName);
      console.log(`[EXISTS] ${emojiName} -> <:${match.name}:${match.id}>`);
      uploadedEmojis[name] = `<:${match.name}:${match.id}>`;
      continue;
    }
    try {
      const uri = await svgToPngDataUri(svg, 128);
      const res = await uploadEmoji(emojiName, uri);
      if (res) uploadedEmojis[name] = `<:${res.name}:${res.id}>`;
    } catch (e) {
      console.error(`Failed ${name}:`, e.message);
    }
  }

  if (lucide && lucide.getIconSvg) {
    for (const [key, iconName] of Object.entries(LUCIDE_MAPPINGS)) {
      const emojiName = `lucide_${key}`;
      if (existingNames.has(emojiName)) {
        const match = existingItems.find(e => e.name === emojiName);
        console.log(`[EXISTS] ${emojiName} -> <:${match.name}:${match.id}>`);
        uploadedEmojis[key] = `<:${match.name}:${match.id}>`;
        continue;
      }
      try {
        const svg = lucide.getIconSvg(iconName, { color: HEX_COLOR, size: 64, strokeWidth: 2 });
        if (svg) {
          const uri = await svgToPngDataUri(svg, 128);
          const res = await uploadEmoji(emojiName, uri);
          if (res) uploadedEmojis[key] = `<:${res.name}:${res.id}>`;
        }
      } catch (e) {
        console.error(`Failed lucide ${iconName}:`, e.message);
      }
    }
  }

  console.log("\n=== Uploaded Emojis Map ===");
  console.log(JSON.stringify(uploadedEmojis, null, 2));

  fs.writeFileSync(
    path.join(__dirname, 'uploaded_emojis.json'),
    JSON.stringify(uploadedEmojis, null, 2),
    'utf-8'
  );
  console.log("Saved mapping to uploaded_emojis.json");
}

main().catch(console.error);
