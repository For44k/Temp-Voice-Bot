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
  console.error("Missing token or client ID in .env");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

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
  { id: 'scarlet', hex: '#ff0004', main: '#ff0004', dark: '#800002' },
  { id: 'chartreuse', hex: '#a6af27', main: '#a6af27', dark: '#535813' },
  { id: 'teal', hex: '#1f5351', main: '#2a7572', dark: '#133534' },
  { id: 'lime', hex: '#65c75e', main: '#65c75e', dark: '#32632f' }
];

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

    if (type === 'mute') {
      ctx.strokeStyle = theme.main;
      ctx.fillStyle = theme.main;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Mic body
      ctx.beginPath();
      ctx.roundRect(26, 16 - pulse * 0.5, 12, 20, 6);
      ctx.stroke();

      // Mic inner
      ctx.fillStyle = theme.dark;
      ctx.beginPath();
      ctx.roundRect(27, 17 - pulse * 0.5, 10, 18, 5);
      ctx.fill();

      // Mic cradle
      ctx.beginPath();
      ctx.arc(32, 26, 12, 0, Math.PI);
      ctx.stroke();

      // Mic stand
      ctx.beginPath();
      ctx.moveTo(32, 38);
      ctx.lineTo(32, 48);
      ctx.moveTo(24, 48);
      ctx.lineTo(40, 48);
      ctx.stroke();

      // Slash across
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(15, 15);
      ctx.lineTo(49, 49);
      ctx.stroke();
    } else if (type === 'deafen') {
      ctx.strokeStyle = theme.main;
      ctx.fillStyle = theme.main;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      // Headband arc
      ctx.beginPath();
      ctx.arc(32, 28 - pulse * 0.5, 16, Math.PI, 0);
      ctx.stroke();

      // Ear cups
      ctx.beginPath();
      ctx.roundRect(13, 26, 8, 18, 4);
      ctx.roundRect(43, 26, 8, 18, 4);
      ctx.fill();

      // Slash across
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(13, 13);
      ctx.lineTo(51, 51);
      ctx.stroke();
    } else if (type === 'tempreject') {
      ctx.strokeStyle = theme.main;
      ctx.fillStyle = theme.main;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Clock dial
      ctx.beginPath();
      ctx.arc(28, 28, 17, 0, Math.PI * 2);
      ctx.stroke();

      // Clock center
      ctx.beginPath();
      ctx.arc(28, 28, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Minute hand rotating
      ctx.save();
      ctx.translate(28, 28);
      ctx.rotate(progress * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -11);
      ctx.stroke();
      ctx.restore();

      // Hour hand
      ctx.beginPath();
      ctx.moveTo(28, 28);
      ctx.lineTo(35, 28);
      ctx.stroke();

      // Bottom right badge circle
      ctx.fillStyle = '#1e1f22';
      ctx.beginPath();
      ctx.arc(46, 46, 9.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme.main;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(46, 46, 8, 0, Math.PI * 2);
      ctx.stroke();

      // X inside badge
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(42.5, 42.5);
      ctx.lineTo(49.5, 49.5);
      ctx.moveTo(49.5, 42.5);
      ctx.lineTo(42.5, 49.5);
      ctx.stroke();
    } else if (type === 'randomreject') {
      ctx.fillStyle = theme.main;
      ctx.strokeStyle = theme.main;

      // Person silhouette
      ctx.beginPath();
      ctx.arc(28, 21 - (pulse * 0.5), 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(28, 51, 14, Math.PI, 0);
      ctx.fill();

      // Badge background
      ctx.fillStyle = '#1e1f22';
      ctx.beginPath();
      ctx.arc(46, 44, 10, 0, Math.PI * 2);
      ctx.fill();

      // Dice
      ctx.save();
      ctx.translate(46, 44);
      ctx.rotate(pulse * 0.15);
      ctx.fillStyle = theme.main;
      ctx.beginPath();
      ctx.roundRect(-7, -7, 14, 14, 3);
      ctx.fill();

      // Dice pips
      ctx.fillStyle = '#1e1f22';
      const framePip = Math.floor(progress * 3);
      if (framePip === 0) {
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (framePip === 1) {
        ctx.beginPath();
        ctx.arc(-3, -3, 1.8, 0, Math.PI * 2);
        ctx.arc(3, 3, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(-3.5, -3.5, 1.6, 0, Math.PI * 2);
        ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
        ctx.arc(3.5, 3.5, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
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
  console.log(`Found ${existingByName.size} existing application emojis on bot.`);

  const ACTIONS = ['mute', 'deafen', 'tempreject', 'randomreject'];
  const extraThemeMap = {};

  for (const theme of THEMES) {
    extraThemeMap[theme.hex] = {};
    console.log(`\n--- Processing Theme: ${theme.id} (${theme.hex}) ---`);

    for (const action of ACTIONS) {
      const emojiName = `a_${action}_${theme.id}`;
      if (existingByName.has(emojiName)) {
        extraThemeMap[theme.hex][action] = existingByName.get(emojiName);
        console.log(`[EXISTS] ${emojiName} -> ${existingByName.get(emojiName)}`);
      } else {
        console.log(`[GENERATING & UPLOADING] ${emojiName}...`);
        const buf = createThemedGif(action, theme);
        const tag = await uploadEmoji(emojiName, buf);
        if (tag) {
          extraThemeMap[theme.hex][action] = tag;
          existingByName.set(emojiName, tag);
        }
        await new Promise(r => setTimeout(r, 650));
      }
    }
  }

  const outPath = path.join(__dirname, 'extra_theme_emojis.json');
  fs.writeFileSync(outPath, JSON.stringify(extraThemeMap, null, 2), 'utf-8');
  console.log(`\n=== All extra emojis processed! Saved to ${outPath} ===`);
}

main().catch(console.error);
