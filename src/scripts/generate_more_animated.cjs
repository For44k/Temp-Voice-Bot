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

function createAnimatedIconGif(type) {
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
    ctx.strokeStyle = '#858585';
    ctx.fillStyle = '#858585';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'mute') {
      // Microphone with animated sound wave slash
      ctx.beginPath();
      ctx.roundRect(26, 16, 12, 20, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(32, 26, 12, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(32, 38);
      ctx.lineTo(32, 48);
      ctx.moveTo(24, 48);
      ctx.lineTo(40, 48);
      ctx.stroke();
      // Animated slash
      const slashProgress = Math.min(1, Math.max(0, (progress - 0.2) * 2));
      ctx.strokeStyle = '#e06c75';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(16, 16);
      ctx.lineTo(16 + 32 * (0.5 + 0.5 * pulse), 16 + 32 * (0.5 + 0.5 * pulse));
      ctx.stroke();
    } else if (type === 'unmute') {
      // Mic with animated soundwaves
      ctx.beginPath();
      ctx.roundRect(26, 18, 12, 18, 6);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(32, 26, 12, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(32, 38);
      ctx.lineTo(32, 48);
      ctx.moveTo(24, 48);
      ctx.lineTo(40, 48);
      ctx.stroke();
      // Waves
      ctx.beginPath();
      ctx.arc(32, 27, 18 + (pulse * 2), -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    } else if (type === 'deafen') {
      // Headphones with slash
      ctx.beginPath();
      ctx.arc(32, 30, 16, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(14, 28, 8, 16, 4);
      ctx.roundRect(42, 28, 8, 16, 4);
      ctx.fill();
      // Slash
      ctx.strokeStyle = '#e06c75';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.lineTo(50, 50);
      ctx.stroke();
    } else if (type === 'undeafen') {
      // Headphones with sound pulse
      ctx.beginPath();
      ctx.arc(32, 30, 16, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(14, 28, 8, 16, 4);
      ctx.roundRect(42, 28, 8, 16, 4);
      ctx.fill();
      // Sound rings
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(10, 36, 4 + pulse * 2, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(54, 36, 4 + pulse * 2, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
    } else if (type === 'reject') {
      // User with X / Ban circle
      ctx.beginPath();
      ctx.arc(32, 22, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(32, 46, 15, Math.PI, 0);
      ctx.fill();
      // Red X
      ctx.strokeStyle = '#e06c75';
      ctx.lineWidth = 4;
      const xSize = 6 + pulse * 1.5;
      ctx.beginPath();
      ctx.moveTo(46 - xSize, 46 - xSize);
      ctx.lineTo(46 + xSize, 46 + xSize);
      ctx.moveTo(46 + xSize, 46 - xSize);
      ctx.lineTo(46 - xSize, 46 + xSize);
      ctx.stroke();
    } else if (type === 'temp_reject') {
      // Clock with animated ticking hand + user
      ctx.beginPath();
      ctx.arc(28, 28, 18, 0, Math.PI * 2);
      ctx.stroke();
      // Hour hand
      ctx.beginPath();
      ctx.moveTo(28, 28);
      ctx.lineTo(28, 18);
      ctx.stroke();
      // Minute hand rotating
      ctx.save();
      ctx.translate(28, 28);
      ctx.rotate(progress * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -12);
      ctx.stroke();
      ctx.restore();
      // X icon on bottom right
      ctx.strokeStyle = '#e06c75';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(42, 42);
      ctx.lineTo(54, 54);
      ctx.moveTo(54, 42);
      ctx.lineTo(42, 54);
      ctx.stroke();
    } else if (type === 'permit') {
      // Animated shield / checkmark
      ctx.beginPath();
      ctx.moveTo(32, 14);
      ctx.lineTo(48, 20);
      ctx.lineTo(48, 34);
      ctx.bezierCurveTo(48, 46, 32, 52, 32, 52);
      ctx.bezierCurveTo(32, 52, 16, 46, 16, 34);
      ctx.lineTo(16, 20);
      ctx.closePath();
      ctx.fill();
      // White checkmark pulsing
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(24, 32);
      ctx.lineTo(30, 38 + pulse * 0.5);
      ctx.lineTo(40, 26);
      ctx.stroke();
    } else if (type === 'fixlag') {
      // Signal WiFi waves pulsing
      const waveAlpha1 = 0.4 + 0.6 * Math.sin(progress * Math.PI * 2);
      const waveAlpha2 = 0.4 + 0.6 * Math.sin((progress + 0.33) * Math.PI * 2);
      const waveAlpha3 = 0.4 + 0.6 * Math.sin((progress + 0.66) * Math.PI * 2);

      // Dot
      ctx.beginPath();
      ctx.arc(32, 48, 4, 0, Math.PI * 2);
      ctx.fill();

      // Wave 1
      ctx.strokeStyle = `rgba(133, 133, 133, ${waveAlpha1})`;
      ctx.beginPath();
      ctx.arc(32, 48, 12, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();

      // Wave 2
      ctx.strokeStyle = `rgba(133, 133, 133, ${waveAlpha2})`;
      ctx.beginPath();
      ctx.arc(32, 48, 20, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();

      // Wave 3
      ctx.strokeStyle = `rgba(133, 133, 133, ${waveAlpha3})`;
      ctx.beginPath();
      ctx.arc(32, 48, 28, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();
    } else if (type === 'tmute') {
      // Chat bubble with slash
      ctx.beginPath();
      ctx.roundRect(14, 16, 36, 26, 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(22, 42);
      ctx.lineTo(16, 50);
      ctx.lineTo(28, 42);
      ctx.fill();
      // Slash
      ctx.strokeStyle = '#e06c75';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.lineTo(50, 50);
      ctx.stroke();
    } else if (type === 'tlock') {
      // Chat bubble with animated lock
      ctx.beginPath();
      ctx.roundRect(12, 14, 40, 30, 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(20, 44);
      ctx.lineTo(14, 52);
      ctx.lineTo(28, 44);
      ctx.fill();
      // Lock on right
      ctx.fillStyle = '#858585';
      ctx.beginPath();
      ctx.roundRect(32, 28, 18, 16, 4);
      ctx.fill();
      ctx.strokeStyle = '#858585';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(41, 25 - pulse * 0.5, 5, Math.PI, 0);
      ctx.stroke();
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
    console.log(`[SUCCESS] Uploaded ${name}: <a:${res.name}:${res.id}>`);
    return res;
  } catch (err) {
    console.error(`[ERROR] Failed ${name}:`, err.rawError || err.message);
    return null;
  }
}

async function main() {
  console.log("Generating and uploading requested animated emojis...");

  const existingRes = await rest.get(Routes.applicationEmojis(CLIENT_ID)).catch(() => ({ items: [] }));
  const existingItems = existingRes.items || existingRes || [];
  const existingMap = new Map();
  for (const item of existingItems) {
    existingMap.set(item.name, (item.animated ? '<a:' : '<:') + item.name + ':' + item.id + '>');
  }

  const iconsToGen = [
    { key: 'mute', name: 'anim_mute_85' },
    { key: 'unmute', name: 'anim_unmute_85' },
    { key: 'deafen', name: 'anim_deafen_85' },
    { key: 'undeafen', name: 'anim_undeafen_85' },
    { key: 'reject', name: 'anim_reject_85' },
    { key: 'temp_reject', name: 'anim_tempreject_85' },
    { key: 'permit', name: 'anim_permit_85' },
    { key: 'fixlag', name: 'anim_fixlag_85' },
    { key: 'tmute', name: 'anim_tmute_85' },
    { key: 'tlock', name: 'anim_tlock_85' }
  ];

  const results = {};

  for (const item of iconsToGen) {
    if (existingMap.has(item.name)) {
      console.log(`[EXISTS] ${item.name}: ${existingMap.get(item.name)}`);
      results[item.key] = existingMap.get(item.name);
    } else {
      console.log(`[GENERATING] ${item.name}...`);
      const gifBuf = createAnimatedIconGif(item.key);
      const res = await uploadEmoji(item.name, gifBuf);
      if (res) {
        results[item.key] = `<a:${res.name}:${res.id}>`;
      }
    }
  }

  console.log("\n=== Generated Animated Emojis ===");
  console.log(JSON.stringify(results, null, 2));

  const animPath = path.join(__dirname, 'animated_emojis.json');
  let currentAnim = {};
  if (fs.existsSync(animPath)) {
    try {
      currentAnim = JSON.parse(fs.readFileSync(animPath, 'utf-8'));
    } catch {}
  }
  const merged = { ...currentAnim, ...results };
  fs.writeFileSync(animPath, JSON.stringify(merged, null, 2), 'utf-8');
}

main().catch(console.error);
