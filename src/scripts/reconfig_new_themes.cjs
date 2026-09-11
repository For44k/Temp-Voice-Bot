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

const restMain = new REST({ version: "10" }).setToken(MAIN_TOKEN);
const restWorker = new REST({ version: "10" }).setToken(WORKER_TOKEN);

// The 7 final themes: black, cyan, silver, and the 4 new ones
const THEMES_TO_CONFIG = {
  black: { key: 'black', hex: '#000000', name: 'Obsidian Black', drawHex: '#3a3a3c', glowHex: 'rgba(90, 90, 95, 0.4)' },
  cyan: { key: 'cyan', hex: '#00ccdf', name: 'Neon Cyan', drawHex: '#00ccdf', glowHex: 'rgba(0, 204, 223, 0.4)' },
  silver: { key: 'silver', hex: '#a7a7a7', name: 'Platinum Silver', drawHex: '#a7a7a7', glowHex: 'rgba(167, 167, 167, 0.4)' },
  purple: { key: 'purple', hex: '#796bc2', name: 'Lavender Purple', drawHex: '#796bc2', glowHex: 'rgba(121, 107, 194, 0.4)' },
  pink: { key: 'pink', hex: '#fe90e6', name: 'Pastel Pink', drawHex: '#fe90e6', glowHex: 'rgba(254, 144, 230, 0.4)' },
  orange: { key: 'orange', hex: '#f3ad5e', name: 'Warm Amber', drawHex: '#f3ad5e', glowHex: 'rgba(243, 173, 94, 0.4)' },
  green: { key: 'green', hex: '#6fd383', name: 'Emerald Mint', drawHex: '#6fd383', glowHex: 'rgba(111, 211, 131, 0.4)' }
};

// 1. Color Circle Gif
function createColorOrbGif(hexColor) {
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
    const pulse = Math.sin(progress * Math.PI * 2);

    ctx.save();
    const radius = 18 + pulse * 2.5;

    ctx.fillStyle = hexColor;
    ctx.beginPath();
    ctx.arc(32, 32, radius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle inner shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(28, 26, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

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

async function uploadEmoji(restClient, clientId, name, buffer) {
  const dataUri = `data:image/gif;base64,${buffer.toString('base64')}`;
  const res = await restClient.post(Routes.applicationEmojis(clientId), {
    body: { name, image: dataUri }
  });
  console.log(`[UPLOADED] ${name}: <a:${res.name}:${res.id}>`);
  return `<a:${res.name}:${res.id}>`;
}

async function main() {
  console.log("=== 1. Cleaning old Blue and Ocean emojis from Main & Worker ===");

  // Main Bot Clean old anim_col_blue, anim_col_ocean
  const mainEmojis = await restMain.get(Routes.applicationEmojis(MAIN_CLIENT_ID));
  const mainItems = mainEmojis.items || mainEmojis;
  for (const item of mainItems) {
    if (item.name === 'anim_col_blue' || item.name === 'anim_col_ocean') {
      console.log(`Deleting ${item.name} (${item.id}) from Main Bot...`);
      await restMain.delete(Routes.applicationEmoji(MAIN_CLIENT_ID, item.id));
    }
  }

  // Worker Bot Clean old blue and ocean button emojis
  const workerEmojis = await restWorker.get(Routes.applicationEmojis(WORKER_CLIENT_ID));
  const workerItems = workerEmojis.items || workerEmojis;
  for (const item of workerItems) {
    if (item.name.endsWith('_blue') || item.name.endsWith('_ocean')) {
      console.log(`Deleting ${item.name} (${item.id}) from Worker Bot...`);
      await restWorker.delete(Routes.applicationEmoji(WORKER_CLIENT_ID, item.id));
    }
  }

  console.log("=== 2. Generating & Uploading 4 New Color Selector Emojis to Main Bot ===");
  const newThemeColors = [
    { key: 'purple', hex: '#796bc2' },
    { key: 'pink', hex: '#fe90e6' },
    { key: 'orange', hex: '#f3ad5e' },
    { key: 'green', hex: '#6fd383' }
  ];

  const colorEmojisMap = {
    black: '<a:anim_col_black:1546842529888997376>',
    cyan: '<a:anim_col_cyan:1546842531332100176>',
    silver: '<a:anim_col_silver:1546842532749778954>'
  };

  for (const tc of newThemeColors) {
    const emojiName = `anim_col_${tc.key}`;
    console.log(`Creating ${emojiName} for ${tc.hex}...`);
    const buf = createColorOrbGif(tc.hex);
    const tag = await uploadEmoji(restMain, MAIN_CLIENT_ID, emojiName, buf);
    colorEmojisMap[tc.key] = tag;
    await new Promise(r => setTimeout(r, 600));
  }

  console.log("=== 3. Generating & Uploading The 4 New Themes (4x10 = 40 Buttons) to Worker Bot ===");
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

  // Read existing generated theme emojis for black, cyan, silver
  let fullThemeMap = {};
  try {
    fullThemeMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'theme_emojis_full.json'), 'utf-8'));
    delete fullThemeMap['#3949ff'];
    delete fullThemeMap['#1d537c'];
  } catch {
    fullThemeMap = {};
  }

  const newThemesToGenerate = ['purple', 'pink', 'orange', 'green'];
  for (const themeKey of newThemesToGenerate) {
    const config = THEMES_TO_CONFIG[themeKey];
    console.log(`\n=== Generating Button Set: ${themeKey} (${config.hex}) ===`);
    fullThemeMap[config.hex.toLowerCase()] = {};

    for (const action of actions) {
      const emojiName = `a_${action.key}_${themeKey}`;
      console.log(`Creating ${emojiName}...`);
      const gifBuf = createGif(action.fn, config);
      const tag = await uploadEmoji(restWorker, WORKER_CLIENT_ID, emojiName, gifBuf);
      fullThemeMap[config.hex.toLowerCase()][action.key] = tag;
      await new Promise(r => setTimeout(r, 600));
    }
  }

  // Save all theme maps and color emojis map
  fs.writeFileSync(
    path.join(__dirname, 'theme_emojis_full.json'),
    JSON.stringify(fullThemeMap, null, 2),
    'utf-8'
  );

  fs.writeFileSync(
    path.join(__dirname, 'color_emojis.json'),
    JSON.stringify(colorEmojisMap, null, 2),
    'utf-8'
  );

  console.log("\n[SUCCESS] Completed all uploads and configuration saves!");
}

main().catch(console.error);
