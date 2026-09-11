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

// Existing 13 Themes + 4 New Themes requested: #ff0004 (Blood Red), #a6af27 (Chartreuse Olive), #1f5351 (Deep Teal), #65c75e (Lime Green)
const THEMES = [
  { id: 'black', hex: '#000000', main: '#555555', dark: '#222222' },
  { id: 'cyan', hex: '#00ccdf', main: '#00ccdf', dark: '#006673' },
  { id: 'silver', hex: '#a7a7a7', main: '#a7a7a7', dark: '#555555' },
  { id: 'purple', hex: '#796bc2', main: '#796bc2', dark: '#3c3563' },
  { id: 'pink', hex: '#fe90e6', main: '#fe90e6', dark: '#804473' },
  { id: 'orange', hex: '#f3ad5e', main: '#f3ad5e', dark: '#7a542b' },
  { id: 'green', hex: '#6fd383', main: '#6fd383', dark: '#33663c' },
  { id: 'ruby', hex: '#ff4d6d', main: '#ff4d6d', dark: '#802636' },
  { id: 'indigo', hex: '#5865f2', main: '#5865f2', dark: '#293073' },
  { id: 'coral', hex: '#ff7a59', main: '#ff7a59', dark: '#803c2b' },
  { id: 'forest', hex: '#246409', main: '#38a30c', dark: '#194206' },
  { id: 'olive', hex: '#8c8f45', main: '#8c8f45', dark: '#464722' },
  { id: 'white', hex: '#ffffff', main: '#ffffff', dark: '#888888' },
  // 4 NEW THEMES:
  { id: 'scarlet', hex: '#ff0004', main: '#ff0004', dark: '#800002', name: 'Blood Scarlet', desc: 'Vivid Blood Scarlet (#FF0004)' },
  { id: 'chartreuse', hex: '#a6af27', main: '#a6af27', dark: '#535813', name: 'Citrus Olive', desc: 'Bright Citrus Olive (#A6AF27)' },
  { id: 'teal', hex: '#1f5351', main: '#2a7572', dark: '#133534', name: 'Deep Teal', desc: 'Oceanic Deep Teal (#1F5351)' },
  { id: 'lime', hex: '#65c75e', main: '#65c75e', dark: '#32632f', name: 'Neon Lime', desc: 'Vibrant Neon Lime (#65C75E)' }
];

// EMOJI GENERATOR FUNCTIONS
function createThemedGif(type, theme) {
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
    ctx.strokeStyle = theme.main;
    ctx.fillStyle = theme.main;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'lock') {
      ctx.beginPath();
      ctx.roundRect(14, 26, 36, 26, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(32, 26 - pulse * 1.5, 12, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#1e1f22';
      ctx.beginPath();
      ctx.arc(32, 37, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'unlock') {
      ctx.beginPath();
      ctx.roundRect(14, 26, 36, 26, 8);
      ctx.fill();
      ctx.save();
      ctx.translate(20, 26);
      ctx.rotate(-0.35 + pulse * 0.1);
      ctx.beginPath();
      ctx.arc(12, 0, 12, Math.PI, 0);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#1e1f22';
      ctx.beginPath();
      ctx.arc(32, 37, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'hide') {
      ctx.beginPath();
      ctx.arc(32, 32, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e1f22';
      ctx.beginPath();
      ctx.arc(32, 32, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = theme.main;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(12, 12);
      ctx.lineTo(52, 52);
      ctx.stroke();
    } else if (type === 'unhide') {
      ctx.beginPath();
      ctx.arc(32, 32, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e1f22';
      ctx.beginPath();
      ctx.arc(32, 32, 7 + pulse * 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'antiabuse') {
      ctx.beginPath();
      ctx.moveTo(32, 12);
      ctx.lineTo(50, 18);
      ctx.lineTo(50, 34);
      ctx.bezierCurveTo(50, 48, 32, 54, 32, 54);
      ctx.bezierCurveTo(32, 54, 14, 48, 14, 34);
      ctx.lineTo(14, 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1e1f22';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(24, 33);
      ctx.lineTo(29, 39 + pulse * 0.5);
      ctx.lineTo(40, 26);
      ctx.stroke();
    } else if (type === 'limit') {
      ctx.beginPath();
      ctx.arc(24, 22, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(24, 46, 12, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(46, 32, 12, -Math.PI * 0.75, Math.PI * 0.75);
      ctx.stroke();
      ctx.save();
      ctx.translate(46, 32);
      ctx.rotate(-Math.PI * 0.5 + (progress * Math.PI * 0.8));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -9);
      ctx.stroke();
      ctx.restore();
    } else if (type === 'rename') {
      ctx.strokeStyle = '#686868';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(14, 46);
      ctx.lineTo(50, 46);
      ctx.stroke();
      ctx.save();
      const wave = Math.sin(progress * Math.PI * 2) * 2;
      ctx.translate(34 + wave, 22 + wave);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = theme.main;
      ctx.fillRect(-4, -14, 8, 22);
      ctx.beginPath();
      ctx.moveTo(-4, 8);
      ctx.lineTo(0, 16);
      ctx.lineTo(4, 8);
      ctx.fill();
      ctx.restore();
    } else if (type === 'info') {
      ctx.beginPath();
      ctx.arc(32, 32, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(32, 22 - pulse * 0.5, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(32, 30);
      ctx.lineTo(32, 42);
      ctx.stroke();
    } else if (type === 'claim') {
      ctx.beginPath();
      ctx.moveTo(16, 44);
      ctx.lineTo(16, 26 + pulse * 2);
      ctx.lineTo(26, 34);
      ctx.lineTo(32, 20);
      ctx.lineTo(38, 34);
      ctx.lineTo(48, 26 + pulse * 2);
      ctx.lineTo(48, 44);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'extra') {
      ctx.translate(32, 32);
      ctx.rotate(progress * Math.PI * 2);
      for (let j = 0; j < 6; j++) {
        ctx.rotate((Math.PI * 2) / 6);
        ctx.beginPath();
        ctx.roundRect(-3.5, -20, 7, 10, 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e1f22';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'wl') {
      // 3 People + check
      ctx.save();
      ctx.fillStyle = theme.dark;
      ctx.beginPath();
      ctx.arc(20, 24, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(20, 48, 11, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(44, 24, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(44, 48, 11, Math.PI, 0);
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(32, 20 - (pulse * 0.5), 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(32, 50, 14, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(27, 44);
      ctx.lineTo(31, 48 + pulse * 0.5);
      ctx.lineTo(38, 40);
      ctx.stroke();
    } else if (type === 'bl') {
      // 3 People + ban badge
      ctx.save();
      ctx.fillStyle = theme.dark;
      ctx.beginPath();
      ctx.arc(20, 24, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(20, 48, 11, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(44, 24, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(44, 48, 11, Math.PI, 0);
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(32, 20 - (pulse * 0.5), 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(32, 50, 14, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#1e1f22';
      ctx.beginPath();
      ctx.arc(44, 44, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme.main;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(44, 44, 6.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(39, 39);
      ctx.lineTo(49, 49);
      ctx.stroke();
    } else if (type === 'permit') {
      // 1 Person + checkmark
      ctx.beginPath();
      ctx.arc(32, 21 - (pulse * 0.5), 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(32, 51, 15, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#1e1f22';
      ctx.beginPath();
      ctx.arc(46, 44, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme.main;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(46, 44, 7.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(42, 44);
      ctx.lineTo(45, 47 + pulse * 0.4);
      ctx.lineTo(50, 41);
      ctx.stroke();
    } else if (type === 'reject') {
      // 1 Person + minus badge
      ctx.beginPath();
      ctx.arc(32, 21 - (pulse * 0.5), 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(32, 51, 15, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#1e1f22';
      ctx.beginPath();
      ctx.arc(46, 44, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme.main;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(46, 44, 7.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(41.5, 44);
      ctx.lineTo(50.5, 44);
      ctx.stroke();
    } else if (type === 'col') {
      // Theme select pulsing crystal / orb
      ctx.beginPath();
      ctx.arc(32, 32, 18 + pulse * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(26, 26, 5, 0, Math.PI * 2);
      ctx.fill();
    }

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
    console.log(`[UPLOADED] ${name} -> <a:${res.name}:${res.id}>`);
    return `<a:${res.name}:${res.id}>`;
  } catch (err) {
    console.error(`[ERROR] Failed to upload ${name}:`, err.rawError || err.message);
    return null;
  }
}

async function main() {
  console.log("=== Fetching all existing application emojis on bot token ===");
  const mainRes = await rest.get(Routes.applicationEmojis(CLIENT_ID));
  const existingByName = new Map((mainRes.items || []).map(e => [e.name, `<a:${e.name}:${e.id}>`]));
  console.log(`Found ${existingByName.size} existing application emojis.`);

  const ACTIONS = ['lock', 'unlock', 'hide', 'unhide', 'antiabuse', 'limit', 'rename', 'info', 'claim', 'extra', 'wl', 'bl', 'permit', 'reject'];
  const fullThemeMap = {};
  const newPresetEmojis = {};

  for (const theme of THEMES) {
    fullThemeMap[theme.hex] = {};
    console.log(`\n=== Processing Theme: ${theme.id} (${theme.hex}) ===`);

    for (const action of ACTIONS) {
      const emojiName = `a_${action}_${theme.id}`;
      if (existingByName.has(emojiName)) {
        fullThemeMap[theme.hex][action] = existingByName.get(emojiName);
        console.log(`[EXISTS] ${emojiName} -> ${existingByName.get(emojiName)}`);
      } else {
        console.log(`[GENERATING & UPLOADING] ${emojiName}...`);
        const buf = createThemedGif(action, theme);
        const tag = await uploadEmoji(emojiName, buf);
        fullThemeMap[theme.hex][action] = tag;
        existingByName.set(emojiName, tag);
        await new Promise(r => setTimeout(r, 600));
      }
    }

    // Also check theme selector orb
    const colName = `anim_col_${theme.id}`;
    if (existingByName.has(colName)) {
      newPresetEmojis[theme.id] = existingByName.get(colName);
    } else {
      console.log(`[GENERATING & UPLOADING] ${colName}...`);
      const buf = createThemedGif('col', theme);
      const tag = await uploadEmoji(colName, buf);
      newPresetEmojis[theme.id] = tag;
      existingByName.set(colName, tag);
      await new Promise(r => setTimeout(r, 600));
    }
  }

  console.log("\n=== ALL THEMES VERIFIED & GENERATED ===");
  fs.writeFileSync(path.join(__dirname, 'all_themes_emojis.json'), JSON.stringify(fullThemeMap, null, 2), 'utf-8');
  fs.writeFileSync(path.join(__dirname, 'all_presets_emojis.json'), JSON.stringify(newPresetEmojis, null, 2), 'utf-8');
}

main().catch(console.error);
