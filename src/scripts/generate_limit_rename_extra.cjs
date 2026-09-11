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

function createAnimatedNewLimitGif() {
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
    // User icon on left
    ctx.fillStyle = '#858585';
    ctx.beginPath();
    ctx.arc(24, 22, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(24, 46, 12, Math.PI, 0);
    ctx.fill();

    // Animated number counter bar / gauge on right in matching #858585
    ctx.strokeStyle = '#858585';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(46, 32, 12, -Math.PI * 0.75, Math.PI * 0.75);
    ctx.stroke();

    // Rotating gauge needle
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

    ctx.restore();
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

function createAnimatedNewRenameGif() {
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
    const wave = Math.sin(progress * Math.PI * 2) * 2;

    ctx.save();
    // Text writing line
    ctx.strokeStyle = '#686868';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(14, 46);
    ctx.lineTo(50, 46);
    ctx.stroke();

    // Animated tilting / writing sleek pencil in #858585
    ctx.save();
    ctx.translate(24 + progress * 16, 34 + wave * 0.5);
    ctx.rotate(Math.PI / 4 + (wave * 0.05));

    ctx.fillStyle = '#858585';
    ctx.fillRect(-4, -14, 8, 22);

    // Pencil tip
    ctx.beginPath();
    ctx.moveTo(-4, 8);
    ctx.lineTo(0, 15);
    ctx.lineTo(4, 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-2, 11);
    ctx.lineTo(0, 15);
    ctx.lineTo(2, 11);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    ctx.restore();

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

function createAnimatedNewExtraGif() {
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
    const rot = progress * Math.PI * 2;

    ctx.save();
    ctx.translate(32, 32);
    ctx.rotate(rot);

    // Sleek geometric 4-diamond star gear in matching #858585
    ctx.fillStyle = '#858585';
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
  console.log("Generating and uploading new animated Limit, Rename, and Extra icons...");

  const limitBuf = createAnimatedNewLimitGif();
  const limitRes = await uploadEmoji('anim_limit_85_v2', limitBuf);

  const renameBuf = createAnimatedNewRenameGif();
  const renameRes = await uploadEmoji('anim_rename_85_v2', renameBuf);

  const extraBuf = createAnimatedNewExtraGif();
  const extraRes = await uploadEmoji('anim_extra_85_v2', extraBuf);

  const results = {
    limit: limitRes ? `<a:${limitRes.name}:${limitRes.id}>` : null,
    rename: renameRes ? `<a:${renameRes.name}:${renameRes.id}>` : null,
    extra: extraRes ? `<a:${extraRes.name}:${extraRes.id}>` : null
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
