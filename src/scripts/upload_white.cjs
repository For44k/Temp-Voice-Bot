const fs = require('fs');
const dotenv = require('dotenv');
const { REST, Routes } = require('discord.js');
dotenv.config();

const restMain = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const restWorker = new REST({ version: '10' }).setToken(process.env.WORKER_TOKEN);

async function uploadWhiteRemaining() {
  const workerRes = await restWorker.get(Routes.applicationEmojis('1546178311460356209'));
  const workerItems = workerRes.items || [];
  
  const whiteMissing = [
    'a_unhide_white', 'a_antiabuse_white', 'a_limit_white',
    'a_rename_white', 'a_info_white', 'a_claim_white', 'a_extra_white'
  ];

  for (const name of whiteMissing) {
    const item = workerItems.find(e => e.name === name);
    if (!item) {
      console.error('Not found on worker:', name);
      continue;
    }
    const ext = item.animated ? 'gif' : 'png';
    const imgUrl = `https://cdn.discordapp.com/emojis/${item.id}.${ext}`;
    const res = await fetch(imgUrl);
    const ab = await res.arrayBuffer();
    const b64 = Buffer.from(ab).toString('base64');
    const dataUri = `data:image/${ext};base64,${b64}`;

    const created = await restMain.post(Routes.applicationEmojis(process.env.CLIENT_ID), {
      body: { name: item.name, image: dataUri }
    });
    console.log(`[UPLOADED WHITE] ${created.name} -> ${created.id}`);
    await new Promise(r => setTimeout(r, 600));
  }
}

uploadWhiteRemaining().catch(console.error);
