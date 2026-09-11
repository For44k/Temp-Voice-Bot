const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const GIFEncoder = require('gif-encoder-2');
const { createCanvas } = require('@napi-rs/canvas');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MAIN_TOKEN = process.env.DISCORD_TOKEN;
const MAIN_CLIENT_ID = process.env.CLIENT_ID;
const WORKER_TOKEN = process.env.WORKER_TOKEN;
const WORKER_CLIENT_ID = "1546178311460356209";

const restWorker = new REST({ version: "10" }).setToken(WORKER_TOKEN);
const restMain = new REST({ version: "10" }).setToken(MAIN_TOKEN);

// Theme presets
const THEMES = {
  black: { key: 'black', hex: '#000000', drawHex: '#3a3a3c', glowHex: 'rgba(90, 90, 95, 0.4)' },
  cyan: { key: 'cyan', hex: '#00ccdf', drawHex: '#00ccdf', glowHex: 'rgba(0, 204, 223, 0.4)' },
  silver: { key: 'silver', hex: '#a7a7a7', drawHex: '#a7a7a7', glowHex: 'rgba(167, 167, 167, 0.4)' },
  blue: { key: 'blue', hex: '#3949ff', drawHex: '#3949ff', glowHex: 'rgba(57, 73, 255, 0.4)' },
  ocean: { key: 'ocean', hex: '#1d537c', drawHex: '#1d537c', glowHex: 'rgba(29, 83, 124, 0.4)' }
};

function createGif(renderFn, theme) {
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
    renderFn(ctx, progress, pulse, theme);
    ctx.restore();

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

function renderLock(ctx, progress, pulse, theme) {
  const color = theme.drawHex;
  ctx.strokeStyle = theme.glowHex;
  ctx.lineWidth = 4 + pulse * 1.5;
  ctx.beginPath();
  ctx.roundRect(16, 26, 32, 26, 6);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(16, 26, 32, 26, 6);
  ctx.fill();

  ctx.fillStyle = '#1e1f22';
  ctx.beginPath();
  ctx.arc(32, 36, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(31, 36, 2, 7);

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(32, 22 - pulse * 0.5, 9, Math.PI, 0);
  ctx.lineTo(41, 26);
  ctx.moveTo(23, 22 - pulse * 0.5);
  ctx.lineTo(23, 26);
  ctx.stroke();
}

function renderUnlock(ctx, progress, pulse, theme) {
  const color = theme.drawHex;
  ctx.strokeStyle = theme.glowHex;
  ctx.lineWidth = 4 + pulse * 1.5;
  ctx.beginPath();
  ctx.roundRect(16, 26, 32, 26, 6);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(16, 26, 32, 26, 6);
  ctx.fill();

  ctx.fillStyle = '#1e1f22';
  ctx.beginPath();
  ctx.arc(32, 36, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(31, 36, 2, 7);

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(26, 17 - pulse * 0.5, 9, Math.PI, 0);
  ctx.lineTo(35, 17 - pulse * 0.5);
  ctx.moveTo(17, 17 - pulse * 0.5);
  ctx.lineTo(17, 26);
  ctx.stroke();
}

function renderHide(ctx, progress, pulse, theme) {
  const color = theme.drawHex;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
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

  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(14, 14);
  ctx.lineTo(50, 50);
  ctx.stroke();
}

function renderUnHide(ctx, progress, pulse, theme) {
  const color = theme.drawHex;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(12, 32);
  ctx.bezierCurveTo(20, 18 - pulse, 44, 18 - pulse, 52, 32);
  ctx.bezierCurveTo(44, 46 + pulse, 20, 46 + pulse, 12, 32);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(32, 32, 6.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(34, 30, 2, 0, Math.PI * 2);
  ctx.fill();
}

function renderAntiAbuse(ctx, progress, pulse, theme) {
  const color = theme.drawHex;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
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

  ctx.fillStyle = theme.glowHex;
  ctx.fill();

  ctx.fillStyle = '#1e1f22';
  ctx.fillRect(30, 22 - pulse * 0.5, 4, 13);
  ctx.beginPath();
  ctx.arc(32, 40 - pulse * 0.5, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function renderLimit(ctx, progress, pulse, theme) {
  const color = theme.drawHex;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(24, 22, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(24, 46, 12, Math.PI, 0);
  ctx.fill();

  ctx.strokeStyle = color;
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

function renderRename(ctx, progress, pulse, theme) {
  const color = theme.drawHex;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
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

function renderInfo(ctx, progress, pulse, theme) {
  const color = theme.drawHex;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.arc(32, 32, 18, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(32, 22 - pulse * 0.5, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(30, 28, 4, 14);
}

function renderClaim(ctx, progress, pulse, theme) {
  const color = theme.drawHex;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
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

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(41, 44);
  ctx.lineTo(45, 48 + pulse * 0.5);
  ctx.lineTo(51, 40);
  ctx.stroke();
}

function renderExtra(ctx, progress, pulse, theme) {
  const color = theme.drawHex;
  ctx.save();
  ctx.translate(32, 32);
  ctx.rotate(progress * Math.PI * 0.5);
  const scale = 0.85 + 0.2 * Math.sin(progress * Math.PI * 2);
  ctx.scale(scale, scale);

  ctx.fillStyle = color;
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

async function uploadToWorker(name, buffer) {
  const dataUri = `data:image/gif;base64,${buffer.toString('base64')}`;
  const res = await restWorker.post(Routes.applicationEmojis(WORKER_CLIENT_ID), {
    body: { name, image: dataUri }
  });
  console.log(`[WORKER UPLOADED] ${name}: <a:${res.name}:${res.id}>`);
  return `<a:${res.name}:${res.id}>`;
}

async function main() {
  console.log("Generating full themed button emojis on Worker Bot (5 themes x 10 panel buttons = 50 animated emojis)...");

  const actions = [
    { key: 'lock', fn: renderLock },
    { key: 'unlock', fn: renderUnlock },
    { key: 'hide', fn: renderHide },
    { key: 'unhide', fn: renderUnHide },
    { key: 'antiabuse', fn: renderAntiAbuse },
    { key: 'limit', fn: renderLimit },
    { key: 'rename', fn: renderRename },
    { key: 'info', fn: renderInfo },
    { key: 'claim', fn: renderClaim },
    { key: 'extra', fn: renderExtra }
  ];

  const fullThemeMap = {};

  for (const [themeKey, themeConfig] of Object.entries(THEMES)) {
    console.log(`\n=== Generating Theme: ${themeKey} (${themeConfig.hex}) ===`);
    fullThemeMap[themeConfig.hex.toLowerCase()] = {};

    for (const action of actions) {
      const emojiName = `a_${action.key}_${themeKey}`;
      console.log(`Creating ${emojiName}...`);
      const gifBuf = createGif(action.fn, themeConfig);
      const tag = await uploadToWorker(emojiName, gifBuf);
      fullThemeMap[themeConfig.hex.toLowerCase()][action.key] = tag;
      // Sleep slightly to avoid Discord rate limit
      await new Promise(r => setTimeout(r, 600));
    }
  }

  const outputPath = path.join(__dirname, 'theme_emojis_full.json');
  fs.writeFileSync(outputPath, JSON.stringify(fullThemeMap, null, 2), 'utf-8');
  console.log(`\n[SUCCESS] Saved all theme emojis to ${outputPath}`);
}

main().catch(console.error);
