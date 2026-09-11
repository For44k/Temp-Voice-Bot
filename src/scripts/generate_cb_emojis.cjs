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

// Theme color #a6c9cb
const COLOR = '#a6c9cb';
const COLOR_DARK = '#7b9ea0';

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

function renderLock(ctx, progress, pulse) {
  const glowAlpha = 0.25 + 0.25 * Math.sin(progress * Math.PI * 2);
  ctx.strokeStyle = `rgba(166, 201, 203, ${glowAlpha})`;
  ctx.lineWidth = 4 + pulse * 1.5;
  ctx.beginPath();
  ctx.roundRect(16, 26, 32, 26, 6);
  ctx.stroke();

  ctx.fillStyle = COLOR;
  ctx.beginPath();
  ctx.roundRect(16, 26, 32, 26, 6);
  ctx.fill();

  ctx.fillStyle = '#1e1f22';
  ctx.beginPath();
  ctx.arc(32, 36, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(31, 36, 2, 7);

  ctx.strokeStyle = COLOR;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(32, 22 - pulse * 0.5, 9, Math.PI, 0);
  ctx.lineTo(41, 26);
  ctx.moveTo(23, 22 - pulse * 0.5);
  ctx.lineTo(23, 26);
  ctx.stroke();
}

function renderUnlock(ctx, progress, pulse) {
  const glowAlpha = 0.25 + 0.25 * Math.sin(progress * Math.PI * 2);
  ctx.strokeStyle = `rgba(166, 201, 203, ${glowAlpha})`;
  ctx.lineWidth = 4 + pulse * 1.5;
  ctx.beginPath();
  ctx.roundRect(16, 26, 32, 26, 6);
  ctx.stroke();

  ctx.fillStyle = COLOR;
  ctx.beginPath();
  ctx.roundRect(16, 26, 32, 26, 6);
  ctx.fill();

  ctx.fillStyle = '#1e1f22';
  ctx.beginPath();
  ctx.arc(32, 36, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(31, 36, 2, 7);

  ctx.strokeStyle = COLOR;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(26, 17 - pulse * 0.5, 9, Math.PI, 0);
  ctx.lineTo(35, 17 - pulse * 0.5);
  ctx.moveTo(17, 17 - pulse * 0.5);
  ctx.lineTo(17, 26);
  ctx.stroke();
}

function renderHide(ctx, progress, pulse) {
  ctx.strokeStyle = COLOR;
  ctx.fillStyle = COLOR;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(12, 32);
  ctx.bezierCurveTo(20, 18 - pulse, 44, 18 - pulse, 52, 32);
  ctx.bezierCurveTo(44, 46 + pulse, 20, 46 + pulse, 12, 32);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(32, 32, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1e1f22';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(14, 14);
  ctx.lineTo(50, 50);
  ctx.stroke();

  ctx.strokeStyle = COLOR;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(14, 14);
  ctx.lineTo(50, 50);
  ctx.stroke();
}

function renderClaim(ctx, progress, pulse) {
  ctx.fillStyle = COLOR;
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(32, 20 - pulse * 0.5, 8.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(32, 50, 14, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = '#1e1f22';
  ctx.beginPath();
  ctx.arc(46, 44, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLOR;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(41, 44);
  ctx.lineTo(45, 48 + pulse * 0.5);
  ctx.lineTo(51, 40);
  ctx.stroke();
}

function renderLimit(ctx, progress, pulse) {
  ctx.fillStyle = COLOR;
  ctx.beginPath();
  ctx.arc(24, 22, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(24, 46, 12, Math.PI, 0);
  ctx.fill();

  ctx.strokeStyle = COLOR;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(46, 32, 12, -Math.PI * 0.75, Math.PI * 0.75);
  ctx.stroke();

  ctx.save();
  ctx.translate(46, 32);
  ctx.rotate(-Math.PI * 0.5 + progress * Math.PI * 0.8);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -9);
  ctx.stroke();
  ctx.restore();
}

function renderRename(ctx, progress, pulse) {
  ctx.strokeStyle = COLOR;
  ctx.fillStyle = COLOR;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.save();
  const bounceX = pulse * 1.5;
  const bounceY = -pulse * 1.5;
  ctx.translate(bounceX, bounceY);

  ctx.beginPath();
  ctx.moveTo(20, 44);
  ctx.lineTo(44, 20);
  ctx.lineTo(48, 24);
  ctx.lineTo(24, 48);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(20, 44);
  ctx.lineTo(16, 48);
  ctx.lineTo(24, 48);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(14, 52);
  ctx.lineTo(50, 52);
  ctx.stroke();
}

function renderExtra(ctx, progress, pulse) {
  ctx.save();
  ctx.translate(32, 32);
  ctx.rotate(progress * Math.PI * 0.5);
  const scale = 0.85 + 0.2 * Math.sin(progress * Math.PI * 2);
  ctx.scale(scale, scale);

  ctx.fillStyle = COLOR;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.bezierCurveTo(0, -6, 6, 0, 22, 0);
  ctx.bezierCurveTo(6, 0, 0, 6, 0, 22);
  ctx.bezierCurveTo(0, 6, -6, 0, -22, 0);
  ctx.bezierCurveTo(-6, 0, 0, -6, 0, -22);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  const smallPulse = Math.cos(progress * Math.PI * 2);
  ctx.beginPath();
  ctx.arc(14, 16 + smallPulse * 1.5, 3, 0, Math.PI * 2);
  ctx.arc(50, 46 - smallPulse * 1.5, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function renderAntiAbuse(ctx, progress, pulse) {
  // Shield with animated lightning / cross pulse
  ctx.fillStyle = COLOR;
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(32, 12);
  ctx.lineTo(48, 18);
  ctx.lineTo(48, 34);
  ctx.bezierCurveTo(48, 46, 32, 53, 32, 53);
  ctx.bezierCurveTo(32, 53, 16, 46, 16, 34);
  ctx.lineTo(16, 18);
  ctx.closePath();
  ctx.stroke();

  // Glowing center pulse
  const alpha = 0.3 + 0.3 * Math.sin(progress * Math.PI * 2);
  ctx.fillStyle = `rgba(166, 201, 203, ${alpha})`;
  ctx.fill();

  // Exclamation mark / warning shield center
  ctx.fillStyle = '#1e1f22';
  ctx.fillRect(30, 22 - pulse * 0.5, 4, 13);
  ctx.beginPath();
  ctx.arc(32, 40 - pulse * 0.5, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function renderReset(ctx, progress, pulse) {
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.save();
  ctx.translate(32, 32);
  ctx.rotate(-progress * Math.PI * 2);

  ctx.beginPath();
  ctx.arc(0, 0, 16, -Math.PI * 0.8, Math.PI * 0.8);
  ctx.stroke();

  ctx.fillStyle = COLOR;
  ctx.beginPath();
  ctx.moveTo(8, -18);
  ctx.lineTo(16, -14);
  ctx.lineTo(14, -6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function renderMute(ctx, progress, pulse) {
  ctx.strokeStyle = COLOR;
  ctx.fillStyle = COLOR;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

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

  ctx.strokeStyle = COLOR;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(16, 16);
  ctx.lineTo(48, 48);
  ctx.stroke();
}

function renderDeafen(ctx, progress, pulse) {
  ctx.strokeStyle = COLOR;
  ctx.fillStyle = COLOR;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.arc(32, 30, 16, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(14, 28, 8, 16, 4);
  ctx.roundRect(42, 28, 8, 16, 4);
  ctx.fill();

  ctx.strokeStyle = COLOR;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(14, 14);
  ctx.lineTo(50, 50);
  ctx.stroke();
}

function renderTempReject(ctx, progress, pulse) {
  ctx.strokeStyle = COLOR;
  ctx.fillStyle = COLOR;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';

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

  ctx.fillStyle = '#1e1f22';
  ctx.beginPath();
  ctx.arc(48, 48, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(44, 44);
  ctx.lineTo(52, 52);
  ctx.moveTo(52, 44);
  ctx.lineTo(44, 52);
  ctx.stroke();
}

function renderReject(ctx, progress, pulse) {
  ctx.fillStyle = COLOR;
  ctx.beginPath();
  ctx.arc(32, 20, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(32, 48, 15, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = '#1e1f22';
  ctx.beginPath();
  ctx.arc(44, 44, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLOR;
  ctx.lineWidth = 3;
  const xSize = 4.5 + pulse * 0.5;
  ctx.beginPath();
  ctx.moveTo(44 - xSize, 44 - xSize);
  ctx.lineTo(44 + xSize, 44 + xSize);
  ctx.moveTo(44 + xSize, 44 - xSize);
  ctx.lineTo(44 - xSize, 44 + xSize);
  ctx.stroke();
}

async function upload(name, buffer) {
  const dataUri = `data:image/gif;base64,${buffer.toString('base64')}`;
  const res = await rest.post(Routes.applicationEmojis(CLIENT_ID), {
    body: { name, image: dataUri }
  });
  console.log(`[UPLOADED] ${name}: <a:${res.name}:${res.id}>`);
  return `<a:${res.name}:${res.id}>`;
}

async function main() {
  console.log("Generating all emojis with new theme #a6c9cb...");

  const emojisToGenerate = [
    { name: 'anim_lock_cb', fn: renderLock, key: 'lock' },
    { name: 'anim_unlock_cb', fn: renderUnlock, key: 'unlock' },
    { name: 'anim_hide_cb', fn: renderHide, key: 'hide' },
    { name: 'anim_claim_cb', fn: renderClaim, key: 'claim' },
    { name: 'anim_limit_cb', fn: renderLimit, key: 'limit' },
    { name: 'anim_rename_cb', fn: renderRename, key: 'rename' },
    { name: 'anim_extra_cb', fn: renderExtra, key: 'extra' },
    { name: 'anim_antiabuse_cb', fn: renderAntiAbuse, key: 'antiabuse' },
    { name: 'anim_reset_cb', fn: renderReset, key: 'reset' },
    { name: 'anim_mute_cb', fn: renderMute, key: 'mute' },
    { name: 'anim_deafen_cb', fn: renderDeafen, key: 'deafen' },
    { name: 'anim_tempreject_cb', fn: renderTempReject, key: 'temp_reject' },
    { name: 'anim_reject_cb', fn: renderReject, key: 'reject' }
  ];

  const results = {};

  for (const item of emojisToGenerate) {
    console.log(`Generating ${item.name}...`);
    const buf = createGif(item.fn);
    const tag = await upload(item.name, buf);
    results[item.key] = tag;
  }

  console.log("\n=== Generated #a6c9cb Emojis ===");
  console.log(JSON.stringify(results, null, 2));

  fs.writeFileSync(
    path.join(__dirname, 'cb_emojis.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );
}

main().catch(console.error);
