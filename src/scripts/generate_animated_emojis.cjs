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

function createAnimatedLockGif() {
  const size = 64;
  const frames = 12;
  const encoder = new GIFEncoder(size, size);
  encoder.setDelay(80);
  encoder.setRepeat(0);
  encoder.setTransparent(0x000000);
  encoder.start();

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < frames; i++) {
    ctx.clearRect(0, 0, size, size);
    const progress = i / frames;
    const pulse = Math.sin(progress * Math.PI * 2) * 2;
    const glowAlpha = 0.3 + 0.3 * Math.sin(progress * Math.PI * 2);

    ctx.save();
    // Subtle animated glow in #858585
    ctx.strokeStyle = `rgba(133, 133, 133, ${glowAlpha})`;
    ctx.lineWidth = 4 + pulse;
    ctx.beginPath();
    ctx.roundRect(16, 26, 32, 26, 6);
    ctx.stroke();

    // Lock body in solid sleek #858585
    ctx.fillStyle = '#858585';
    ctx.beginPath();
    ctx.roundRect(16, 26, 32, 26, 6);
    ctx.fill();

    // Keyhole
    ctx.fillStyle = '#1e1f22';
    ctx.beginPath();
    ctx.arc(32, 36, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(31, 36, 2, 7);

    // Shackle with gentle breathing animation
    ctx.strokeStyle = '#858585';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(32, 22 - (pulse * 0.5), 9, Math.PI, 0);
    ctx.lineTo(41, 26);
    ctx.moveTo(23, 22 - (pulse * 0.5));
    ctx.lineTo(23, 26);
    ctx.stroke();
    ctx.restore();

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

function createAnimatedSparkleGif() {
  const size = 64;
  const frames = 12;
  const encoder = new GIFEncoder(size, size);
  encoder.setDelay(70);
  encoder.setRepeat(0);
  encoder.setTransparent(0x000000);
  encoder.start();

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < frames; i++) {
    ctx.clearRect(0, 0, size, size);
    const progress = i / frames;
    const rot = progress * Math.PI * 2;
    const scale = 0.85 + 0.25 * Math.sin(progress * Math.PI * 2);

    ctx.save();
    ctx.translate(32, 32);
    ctx.rotate(rot * 0.5);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#858585';
    ctx.beginPath();
    // 4-point star sparkle
    for (let p = 0; p < 4; p++) {
      ctx.rotate(Math.PI / 2);
      ctx.lineTo(0, -22);
      ctx.quadraticCurveTo(0, 0, 8, 0);
    }
    ctx.fill();
    ctx.restore();

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

function createAnimatedPulseGif(iconType) {
  const size = 64;
  const frames = 12;
  const encoder = new GIFEncoder(size, size);
  encoder.setDelay(80);
  encoder.setRepeat(0);
  encoder.setTransparent(0x000000);
  encoder.start();

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < frames; i++) {
    ctx.clearRect(0, 0, size, size);
    const progress = i / frames;
    const pulse = Math.sin(progress * Math.PI * 2) * 1.5;

    ctx.save();
    ctx.strokeStyle = '#858585';
    ctx.fillStyle = '#858585';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (iconType === 'claim') {
      // Animated User Badge with check
      ctx.beginPath();
      ctx.arc(32, 22, 8 + (pulse * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(32, 44, 14, Math.PI, 0);
      ctx.fill();
      // Orbit checkmark
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(28, 42);
      ctx.lineTo(31, 45);
      ctx.lineTo(36, 38);
      ctx.stroke();
    } else if (iconType === 'hide') {
      // Eye with animated blink / slash
      ctx.beginPath();
      ctx.ellipse(32, 32, 18, 10 + pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(32, 32, 5, 0, Math.PI * 2);
      ctx.fill();
      // Slash
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(18, 18);
      ctx.lineTo(46, 46);
      ctx.stroke();
    } else if (iconType === 'reset') {
      // Rotating refresh arrow
      ctx.translate(32, 32);
      ctx.rotate(progress * Math.PI * 2);
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 1.5);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(6, -14);
      ctx.lineTo(0, -10);
      ctx.fill();
    }

    ctx.restore();
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

async function uploadEmoji(name, buffer, isGif = true) {
  const mime = isGif ? 'image/gif' : 'image/png';
  const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;
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
  console.log("Generating unique animated #858585 icons...");

  const existingRes = await rest.get(Routes.applicationEmojis(CLIENT_ID)).catch(() => ({ items: [] }));
  const existingItems = existingRes.items || existingRes || [];
  const existingNames = new Set(existingItems.map(e => e.name));

  const animMap = {};

  const lockBuf = createAnimatedLockGif();
  const lockName = 'anim_lock_85';
  if (!existingNames.has(lockName)) {
    const r = await uploadEmoji(lockName, lockBuf, true);
    if (r) animMap.lock = `<a:${r.name}:${r.id}>`;
  } else {
    const found = existingItems.find(e => e.name === lockName);
    animMap.lock = `<a:${found.name}:${found.id}>`;
  }

  const sparkleBuf = createAnimatedSparkleGif();
  const extraName = 'anim_sparkle_85';
  if (!existingNames.has(extraName)) {
    const r = await uploadEmoji(extraName, sparkleBuf, true);
    if (r) animMap.extra = `<a:${r.name}:${r.id}>`;
  } else {
    const found = existingItems.find(e => e.name === extraName);
    animMap.extra = `<a:${found.name}:${found.id}>`;
  }

  const claimBuf = createAnimatedPulseGif('claim');
  const claimName = 'anim_claim_85';
  if (!existingNames.has(claimName)) {
    const r = await uploadEmoji(claimName, claimBuf, true);
    if (r) animMap.claim = `<a:${r.name}:${r.id}>`;
  } else {
    const found = existingItems.find(e => e.name === claimName);
    animMap.claim = `<a:${found.name}:${found.id}>`;
  }

  const hideBuf = createAnimatedPulseGif('hide');
  const hideName = 'anim_hide_85';
  if (!existingNames.has(hideName)) {
    const r = await uploadEmoji(hideName, hideBuf, true);
    if (r) animMap.hide = `<a:${r.name}:${r.id}>`;
  } else {
    const found = existingItems.find(e => e.name === hideName);
    animMap.hide = `<a:${found.name}:${found.id}>`;
  }

  const resetBuf = createAnimatedPulseGif('reset');
  const resetName = 'anim_reset_85';
  if (!existingNames.has(resetName)) {
    const r = await uploadEmoji(resetName, resetBuf, true);
    if (r) animMap.reset = `<a:${r.name}:${r.id}>`;
  } else {
    const found = existingItems.find(e => e.name === resetName);
    animMap.reset = `<a:${found.name}:${found.id}>`;
  }

  console.log("\n=== Animated Emojis ===");
  console.log(JSON.stringify(animMap, null, 2));

  fs.writeFileSync(
    path.join(__dirname, 'animated_emojis.json'),
    JSON.stringify(animMap, null, 2),
    'utf-8'
  );
}

main().catch(console.error);
