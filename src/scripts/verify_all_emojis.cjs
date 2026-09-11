const dotenv = require('dotenv');
const { REST, Routes } = require('discord.js');
dotenv.config();

const restMain = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const restWorker = new REST({ version: '10' }).setToken(process.env.WORKER_TOKEN);

async function checkAll() {
  const mainRes = await restMain.get(Routes.applicationEmojis(process.env.CLIENT_ID));
  const mainEmojis = new Map((mainRes.items || []).map(e => [e.name, e]));
  console.log(`Main Bot has ${mainEmojis.size} application emojis.`);

  let workerEmojis = new Map();
  if (process.env.WORKER_TOKEN) {
    try {
      const workerRes = await restWorker.get(Routes.applicationEmojis('1546178311460356209'));
      workerEmojis = new Map((workerRes.items || []).map(e => [e.name, e]));
      console.log(`Worker Bot has ${workerEmojis.size} application emojis.`);
    } catch (e) {
      console.log('Could not fetch worker emojis:', e.message);
    }
  }

  const themeFile = require('./src/core/config/theme.ts');
}

async function verifyAllThemeEmojis() {
  const mainRes = await restMain.get(Routes.applicationEmojis(process.env.CLIENT_ID));
  const mainEmojis = new Map((mainRes.items || []).map(e => [e.id, e.name]));
  const mainByName = new Map((mainRes.items || []).map(e => [e.name, e.id]));
  console.log(`Total Main application emojis: ${mainEmojis.size}`);

  const fs = require('fs');
  const content = fs.readFileSync('/root/3067/src/core/config/theme.ts', 'utf-8');

  // Extract all <a:name:id>
  const regex = /<a?:([\w_]+):(\d+)>/g;
  let match;
  const invalid = [];
  const valid = [];
  while ((match = regex.exec(content)) !== null) {
    const [full, name, id] = match;
    if (!mainEmojis.has(id)) {
      invalid.push({ full, name, id, existsByName: mainByName.get(name) });
    } else {
      valid.push({ full, name, id });
    }
  }

  console.log(`Found ${valid.length} valid theme emojis and ${invalid.length} INVALID theme emojis:`);
  console.log(JSON.stringify(invalid, null, 2));
}

verifyAllThemeEmojis().catch(console.error);
