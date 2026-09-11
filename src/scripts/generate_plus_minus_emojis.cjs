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

function create3UsersWithBadge(isPlus) {
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

    // 1. Back Left User
    ctx.fillStyle = '#656565';
    ctx.beginPath();
    ctx.arc(18, 27, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(18, 50, 10, Math.PI, 0);
    ctx.fill();

    // 2. Back Right User
    ctx.fillStyle = '#656565';
    ctx.beginPath();
    ctx.arc(42, 27, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(42, 50, 10, Math.PI, 0);
    ctx.fill();

    // 3. Front Center User
    ctx.fillStyle = '#858585';
    ctx.beginPath();
    ctx.arc(30, 23 - (pulse * 0.5), 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(30, 52, 13, Math.PI, 0);
    ctx.fill();

    // 4. Badge on TOP RIGHT next to users (Plus [+] for WL or Minus [-] for BL)
    ctx.fillStyle = '#1e1f22';
    ctx.beginPath();
    ctx.arc(49, 17, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#858585';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(49, 17, 8.5, 0, Math.PI * 2);
    ctx.stroke();

    if (isPlus) {
      // Plus symbol (+) in white
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Horizontal
      ctx.moveTo(44, 17);
      ctx.lineTo(54, 17);
      // Vertical
      ctx.moveTo(49, 12);
      ctx.lineTo(49, 22);
      ctx.stroke();
    } else {
      // Minus symbol (-) in white
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Horizontal bar
      ctx.moveTo(44, 17);
      ctx.lineTo(54, 17);
      ctx.stroke();
    }

    ctx.restore();
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

function createSingleUserWithBadge(isPlus) {
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

    // User Avatar in #858585
    ctx.fillStyle = '#858585';
    ctx.beginPath();
    ctx.arc(28, 22 - (pulse * 0.5), 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(28, 52, 15, Math.PI, 0);
    ctx.fill();

    // Badge on Top Right
    ctx.fillStyle = '#1e1f22';
    ctx.beginPath();
    ctx.arc(48, 18, 10.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#858585';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(48, 18, 9, 0, Math.PI * 2);
    ctx.stroke();

    if (isPlus) {
      // Plus symbol (+)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(43, 18);
      ctx.lineTo(53, 18);
      ctx.moveTo(48, 13);
      ctx.lineTo(48, 23);
      ctx.stroke();
    } else {
      // Minus symbol (-)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(43, 18);
      ctx.lineTo(53, 18);
      ctx.stroke();
    }

    ctx.restore();
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

function createRealLimitUsersCapacityGif() {
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

    // 2 Users sitting together inside a capacity border box
    // User 1 (Left)
    ctx.fillStyle = '#858585';
    ctx.beginPath();
    ctx.arc(23, 24, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(23, 46, 10, Math.PI, 0);
    ctx.fill();

    // User 2 (Right)
    ctx.beginPath();
    ctx.arc(41, 24, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(41, 46, 10, Math.PI, 0);
    ctx.fill();

    // Capacity limit slot brackets [  ] on sides
    ctx.strokeStyle = '#858585';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Left Bracket
    ctx.beginPath();
    ctx.moveTo(14, 16);
    ctx.lineTo(8, 16);
    ctx.lineTo(8, 50);
    ctx.lineTo(14, 50);
    ctx.stroke();

    // Right Bracket
    ctx.beginPath();
    ctx.moveTo(50, 16);
    ctx.lineTo(56, 16);
    ctx.lineTo(56, 50);
    ctx.lineTo(50, 50);
    ctx.stroke();

    // Animated limit capacity numbers / dots at top "#"
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(27, 10);
    ctx.lineTo(37, 10);
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
    console.log(`[SUCCESS] Uploaded ${name}: <a:${res.name}:${res.id}>`);
    return res;
  } catch (err) {
    console.error(`[ERROR] Failed ${name}:`, err.rawError || err.message);
    return null;
  }
}

async function main() {
  console.log("Generating and uploading requested Plus/Minus and Real Limit icons...");

  const wlBuf = create3UsersWithBadge(true);
  const wlRes = await uploadEmoji('anim_wl_plus_85', wlBuf);

  const blBuf = create3UsersWithBadge(false);
  const blRes = await uploadEmoji('anim_bl_minus_85', blBuf);

  const permitBuf = createSingleUserWithBadge(true);
  const permitRes = await uploadEmoji('anim_permit_plus_85', permitBuf);

  const rejectBuf = createSingleUserWithBadge(false);
  const rejectRes = await uploadEmoji('anim_reject_minus_85', rejectBuf);

  const limitBuf = createRealLimitUsersCapacityGif();
  const limitRes = await uploadEmoji('anim_roomlimit_85_v3', limitBuf);

  const results = {
    whitelist: wlRes ? `<a:${wlRes.name}:${wlRes.id}>` : null,
    blacklist: blRes ? `<a:${blRes.name}:${blRes.id}>` : null,
    permit: permitRes ? `<a:${permitRes.name}:${permitRes.id}>` : null,
    reject: rejectRes ? `<a:${rejectRes.name}:${rejectRes.id}>` : null,
    limit: limitRes ? `<a:${limitRes.name}:${limitRes.id}>` : null
  };

  console.log("\n=== Uploaded Emojis ===");
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
