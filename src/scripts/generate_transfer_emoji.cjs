const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const GIFEncoder = require('gif-encoder-2');
const { createCanvas } = require('@napi-rs/canvas');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const rest = new REST({ version: '10' }).setToken(TOKEN);

const COLOR = '#a6c9cb';

function createGif(renderFn) {
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
    renderFn(ctx, progress, pulse);
    ctx.restore();

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

function renderTransfer(ctx, progress, pulse) {
  // Transfer: User with crown transferring / switching ownership arrows
  // 1. Sender (Left User)
  ctx.fillStyle = '#7b9ea0';
  ctx.beginPath();
  ctx.arc(20, 26, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(20, 48, 9, Math.PI, 0);
  ctx.fill();

  // 2. Recipient (Right User)
  ctx.fillStyle = COLOR;
  ctx.beginPath();
  ctx.arc(44, 26, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(44, 48, 9, Math.PI, 0);
  ctx.fill();

  // 3. Animated Transfer Arrow across top
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(22, 14);
  ctx.lineTo(38, 14);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(33, 10);
  ctx.lineTo(39, 14);
  ctx.lineTo(33, 18);
  ctx.stroke();

  // Sparkle / crown pulse above recipient
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(44, 14 - pulse * 1.5, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

async function upload(name, buffer) {
  const dataUri = `data:image/gif;base64,${buffer.toString('base64')}`;
  const res = await rest.post(Routes.applicationEmojis(CLIENT_ID), {
    body: { name, image: dataUri }
  });
  console.log(`[UPLOADED] ${name}: <a:${res.name}:${res.id}>`);
  return `<a:${res.name}:${res.id}>`;
}

async function run() {
  const buf = createGif(renderTransfer);
  const tag = await upload('anim_transfer_cb', buf);
  console.log('Result transfer emoji:', tag);
}
run().catch(console.error);
