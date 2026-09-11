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

// Renders 3 clean users in perspective (one in center, two behind left/right)
function drawThreeUsers(ctx, progress, pulse, isWhitelist = false) {
  // Back Left User
  ctx.save();
  ctx.fillStyle = '#686868';
  ctx.beginPath();
  ctx.arc(20, 24, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(20, 48, 11, Math.PI, 0);
  ctx.fill();
  ctx.restore();

  // Back Right User
  ctx.save();
  ctx.fillStyle = '#686868';
  ctx.beginPath();
  ctx.arc(44, 24, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(44, 48, 11, Math.PI, 0);
  ctx.fill();
  ctx.restore();

  // Front Center User
  ctx.save();
  ctx.fillStyle = '#858585';
  ctx.beginPath();
  ctx.arc(32, 20 - (pulse * 0.5), 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(32, 50, 14, Math.PI, 0);
  ctx.fill();

  if (isWhitelist) {
    // Glowing checkmark overlay on front user in matching theme #858585 / white
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(27, 44);
    ctx.lineTo(31, 48 + pulse * 0.5);
    ctx.lineTo(38, 40);
    ctx.stroke();
  } else {
    // Matching theme #858585 ban slash badge (no red, sleek #858585 & dark cutout)
    ctx.fillStyle = '#1e1f22';
    ctx.beginPath();
    ctx.arc(44, 44, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#858585';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(44, 44, 6.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(39, 39);
    ctx.lineTo(49, 49);
    ctx.stroke();
  }
  ctx.restore();
}

function createSleekAnimatedIconGif(type) {
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

    if (type === 'whitelist') {
      drawThreeUsers(ctx, progress, pulse, true);
    } else if (type === 'blacklist') {
      drawThreeUsers(ctx, progress, pulse, false);
    } else if (type === 'reject') {
      // Sleek user with matching #858585 X badge (NO red)
      ctx.beginPath();
      ctx.arc(32, 22, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(32, 48, 15, Math.PI, 0);
      ctx.fill();

      // Cutout circle & matching #858585 X
      ctx.fillStyle = '#1e1f22';
      ctx.beginPath();
      ctx.arc(44, 44, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#858585';
      ctx.lineWidth = 3;
      const xSize = 4.5 + pulse * 0.5;
      ctx.beginPath();
      ctx.moveTo(44 - xSize, 44 - xSize);
      ctx.lineTo(44 + xSize, 44 + xSize);
      ctx.moveTo(44 + xSize, 44 - xSize);
      ctx.lineTo(44 - xSize, 44 + xSize);
      ctx.stroke();
    } else if (type === 'temp_reject') {
      // Clock with animated ticking hand & matching #858585 X badge
      ctx.beginPath();
      ctx.arc(28, 28, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(28, 28);
      ctx.lineTo(28, 18);
      ctx.stroke();

      ctx.save();
      ctx.translate(28, 28);
      ctx.rotate(progress * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -12);
      ctx.stroke();
      ctx.restore();

      // Matching #858585 X
      ctx.fillStyle = '#1e1f22';
      ctx.beginPath();
      ctx.arc(48, 48, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#858585';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(44, 44);
      ctx.lineTo(52, 52);
      ctx.moveTo(52, 44);
      ctx.lineTo(44, 52);
      ctx.stroke();
    } else if (type === 'mute') {
      // Microphone with matching #858585 animated slash (NO red)
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

      // Matching #858585 Slash
      ctx.strokeStyle = '#858585';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(16, 16);
      ctx.lineTo(48, 48);
      ctx.stroke();
    } else if (type === 'deafen') {
      // Headphones with matching #858585 slash
      ctx.beginPath();
      ctx.arc(32, 30, 16, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(14, 28, 8, 16, 4);
      ctx.roundRect(42, 28, 8, 16, 4);
      ctx.fill();

      ctx.strokeStyle = '#858585';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.lineTo(50, 50);
      ctx.stroke();
    } else if (type === 'tmute') {
      // Chat bubble with matching #858585 slash
      ctx.beginPath();
      ctx.roundRect(14, 16, 36, 26, 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(22, 42);
      ctx.lineTo(16, 50);
      ctx.lineTo(28, 42);
      ctx.fill();

      ctx.strokeStyle = '#858585';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.lineTo(50, 50);
      ctx.stroke();
    } else if (type === 'permit') {
      // Animated shield with sleek checkmark
      ctx.beginPath();
      ctx.moveTo(32, 14);
      ctx.lineTo(48, 20);
      ctx.lineTo(48, 34);
      ctx.bezierCurveTo(48, 46, 32, 52, 32, 52);
      ctx.bezierCurveTo(32, 52, 16, 46, 16, 34);
      ctx.lineTo(16, 20);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(24, 32);
      ctx.lineTo(30, 38 + pulse * 0.5);
      ctx.lineTo(40, 26);
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
  console.log("Generating and uploading sleek 3-people whitelist/blacklist & matching #858585 icons...");

  const iconsToGen = [
    { key: 'whitelist', name: 'anim_whitelist_85' },
    { key: 'blacklist', name: 'anim_blacklist_85' },
    { key: 'reject', name: 'anim_reject_85_sleek' },
    { key: 'temp_reject', name: 'anim_tempreject_85_sleek' },
    { key: 'mute', name: 'anim_mute_85_sleek' },
    { key: 'deafen', name: 'anim_deafen_85_sleek' },
    { key: 'tmute', name: 'anim_tmute_85_sleek' }
  ];

  const results = {};

  for (const item of iconsToGen) {
    console.log(`[GENERATING] ${item.name}...`);
    const gifBuf = createSleekAnimatedIconGif(item.key);
    const res = await uploadEmoji(item.name, gifBuf);
    if (res) {
      results[item.key] = `<a:${res.name}:${res.id}>`;
    }
  }

  console.log("\n=== Uploaded Sleek Animated Emojis ===");
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
