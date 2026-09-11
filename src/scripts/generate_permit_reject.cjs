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

const THEME_PALETTES = [
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
  { id: 'white', hex: '#ffffff', main: '#ffffff', dark: '#888888' }
];

// Generates animated Permit (1 Person with glowing checkmark in theme color)
function createThemedPermitGif(theme) {
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
    // 1 Single person centered
    ctx.fillStyle = theme.main;
    ctx.beginPath();
    ctx.arc(32, 21 - (pulse * 0.5), 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(32, 51, 15, Math.PI, 0);
    ctx.fill();

    // Themed badge with checkmark overlay on bottom right
    ctx.fillStyle = '#1e1f22';
    ctx.beginPath();
    ctx.arc(46, 44, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = theme.main;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(46, 44, 7.5, 0, Math.PI * 2);
    ctx.stroke();

    // Checkmark
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(42, 44);
    ctx.lineTo(45, 47 + pulse * 0.4);
    ctx.lineTo(50, 41);
    ctx.stroke();

    ctx.restore();
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

// Generates animated Reject (1 Person with minus sign / ban slash badge in theme color like BL)
function createThemedRejectGif(theme) {
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
    // 1 Single person centered
    ctx.fillStyle = theme.main;
    ctx.beginPath();
    ctx.arc(32, 21 - (pulse * 0.5), 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(32, 51, 15, Math.PI, 0);
    ctx.fill();

    // Themed badge with minus line / slash cutout on bottom right like BL
    ctx.fillStyle = '#1e1f22';
    ctx.beginPath();
    ctx.arc(46, 44, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = theme.main;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(46, 44, 7.5, 0, Math.PI * 2);
    ctx.stroke();

    // Minus horizontal bar in center of circle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(41.5, 44);
    ctx.lineTo(50.5, 44);
    ctx.stroke();

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
  console.log("=== Generating & Uploading 1-Person Permit and Reject Emojis for All 13 Themes ===");
  const results = {};

  for (const theme of THEME_PALETTES) {
    console.log(`\nProcessing theme: ${theme.id} (${theme.hex})...`);
    results[theme.hex] = {};

    // 1. Permit
    const permitName = `a_permit_${theme.id}`;
    const permitBuf = createThemedPermitGif(theme);
    const permitTag = await uploadEmoji(permitName, permitBuf);
    results[theme.hex].permit = permitTag;
    await new Promise(r => setTimeout(r, 600));

    // 2. Reject
    const rejectName = `a_reject_${theme.id}`;
    const rejectBuf = createThemedRejectGif(theme);
    const rejectTag = await uploadEmoji(rejectName, rejectBuf);
    results[theme.hex].reject = rejectTag;
    await new Promise(r => setTimeout(r, 600));
  }

  console.log("\n=== ALL THEMED PERMIT & REJECT EMOJIS GENERATED & UPLOADED ===");
  console.log(JSON.stringify(results, null, 2));

  fs.writeFileSync(path.join(__dirname, 'permit_reject_emojis.json'), JSON.stringify(results, null, 2), 'utf-8');
}

main().catch(console.error);
