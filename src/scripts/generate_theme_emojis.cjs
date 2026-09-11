const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const GIFEncoder = require('gif-encoder-2');
const { createCanvas } = require('@napi-rs/canvas');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing token or client ID");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

function createColorGemGif(hexColor) {
  const size = 64;
  const frames = 12;
  const encoder = new GIFEncoder(size, size);
  encoder.setDelay(75);
  encoder.setRepeat(0);
  encoder.setTransparent(0x000000);
  encoder.start();

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < frames; i++) {
    ctx.clearRect(0, 0, size, size);
    const progress = i / frames;
    const pulse = Math.sin(progress * Math.PI * 2);

    ctx.save();
    
    // Outer animated glowing ring
    const glowAlpha = 0.3 + 0.3 * Math.sin(progress * Math.PI * 2);
    ctx.strokeStyle = hexColor === '#000000' ? `rgba(120, 120, 120, ${glowAlpha})` : hexColor;
    ctx.lineWidth = 3 + pulse * 1.5;
    ctx.beginPath();
    ctx.arc(32, 32, 24, 0, Math.PI * 2);
    ctx.stroke();

    // Diamond / Gem polygon
    ctx.fillStyle = hexColor;
    ctx.strokeStyle = hexColor === '#000000' ? '#555555' : '#ffffff';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(32, 14 - pulse * 1.5);
    ctx.lineTo(48 + pulse * 0.8, 32);
    ctx.lineTo(32, 50 + pulse * 1.5);
    ctx.lineTo(16 - pulse * 0.8, 32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner bright sparkle facet
    ctx.fillStyle = hexColor === '#000000' ? '#555555' : '#ffffff';
    ctx.beginPath();
    ctx.moveTo(32, 20);
    ctx.lineTo(42, 32);
    ctx.lineTo(32, 38);
    ctx.lineTo(22, 32);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

async function uploadEmoji(name, buffer) {
  const dataUri = `data:image/gif;base64,${buffer.toString('base64')}`;
  try {
    const res = await rest.post(Routes.applicationEmojis(CLIENT_ID), {
      body: { name, image: dataUri }
    });
    console.log(`[UPLOADED] ${name}: <a:${res.name}:${res.id}>`);
    return `<a:${res.name}:${res.id}>`;
  } catch (err) {
    console.error(`[ERROR] Failed to upload ${name}:`, err.rawError || err.message);
    return null;
  }
}

async function main() {
  console.log("Fetching existing application emojis...");
  const existingRes = await rest.get(Routes.applicationEmojis(CLIENT_ID)).catch(() => ({ items: [] }));
  const existingItems = existingRes.items || existingRes || [];
  const existingMap = new Map();
  for (const item of existingItems) {
    existingMap.set(item.name, `<a:${item.name}:${item.id}>`);
  }

  const themes = [
    { key: 'theme_black', name: 'anim_col_black', hex: '#000000', label: 'Obsidian Black (#000000)' },
    { key: 'theme_cyan', name: 'anim_col_cyan', hex: '#00ccdf', label: 'Neon Cyan (#00CCDF)' },
    { key: 'theme_silver', name: 'anim_col_silver', hex: '#a7a7a7', label: 'Platinum Silver (#A7A7A7)' },
    { key: 'theme_blue', name: 'anim_col_blue', hex: '#3949ff', label: 'Royal Blue (#3949FF)' },
    { key: 'theme_ocean', name: 'anim_col_ocean', hex: '#1d537c', label: 'Deep Ocean (#1D537C)' }
  ];

  const results = {};

  for (const t of themes) {
    if (existingMap.has(t.name)) {
      console.log(`[EXISTS] ${t.name}: ${existingMap.get(t.name)}`);
      results[t.hex] = {
        name: t.name,
        emoji: existingMap.get(t.name),
        hex: t.hex,
        label: t.label
      };
    } else {
      console.log(`[GENERATING] ${t.name} (${t.hex})...`);
      const gifBuf = createColorGemGif(t.hex);
      const tag = await uploadEmoji(t.name, gifBuf);
      if (tag) {
        results[t.hex] = {
          name: t.name,
          emoji: tag,
          hex: t.hex,
          label: t.label
        };
      }
    }
  }

  const outPath = path.join(__dirname, 'theme_emojis.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n=== Theme Emojis Generated & Saved to ${outPath} ===`);
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
