const { REST, Routes } = require("discord.js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const SOURCE_TOKEN = process.env.DISCORD_TOKEN;
const SOURCE_CLIENT_ID = process.env.CLIENT_ID;

const TARGET_TOKEN = process.argv[2] || process.env.TARGET_BOT_TOKEN || "";

if (!TARGET_TOKEN) {
  console.log("\n=======================================================");
  console.log("Usage: node emojies.uploader.js <NEW_BOT_TOKEN>");
  console.log("Or set TARGET_BOT_TOKEN in your .env file");
  console.log("=======================================================\n");
  process.exit(1);
}

const restSource = new REST({ version: "10" }).setToken(SOURCE_TOKEN);
const restTarget = new REST({ version: "10" }).setToken(TARGET_TOKEN);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchImageAsDataUri(emojiId, isAnimated) {
  const ext = isAnimated ? "gif" : "png";
  const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}?size=128&quality=lossless`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download emoji image (${res.status} ${res.statusText})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const mime = isAnimated ? "image/gif" : "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function startUploader() {
  console.log("\n=======================================================");
  console.log("             DISCORD APPLICATION EMOJIS CLONER        ");
  console.log("=======================================================\n");

  const targetApp = await restTarget.get(Routes.oauth2CurrentApplication()).catch(async () => {
    const user = await restTarget.get(Routes.user("@me")).catch(() => null);
    return user ? { id: user.id, name: user.username } : null;
  });

  if (!targetApp || !targetApp.id) {
    console.error("[ERROR] Invalid target bot token! Could not fetch application ID.");
    process.exit(1);
  }

  const targetAppId = targetApp.id;
  console.log(`[INFO] Target Bot: ${targetApp.name || "Bot"} (App ID: ${targetAppId})`);

  console.log(`[INFO] Fetching emojis from source bot (${SOURCE_CLIENT_ID})...`);
  const sourceRes = await restSource.get(Routes.applicationEmojis(SOURCE_CLIENT_ID)).catch((err) => {
    console.error("[ERROR] Failed to fetch source emojis:", err.message);
    process.exit(1);
  });

  const sourceEmojis = sourceRes.items || sourceRes || [];
  console.log(`[INFO] Found ${sourceEmojis.length} application emojis on source bot.\n`);

  console.log(`[INFO] Fetching existing emojis on target bot...`);
  const targetRes = await restTarget.get(Routes.applicationEmojis(targetAppId)).catch(() => ({ items: [] }));
  const targetEmojis = targetRes.items || targetRes || [];
  const existingTargetNames = new Set(targetEmojis.map((e) => e.name));
  console.log(`[INFO] Target bot already has ${targetEmojis.length} application emojis.\n`);

  let uploadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < sourceEmojis.length; i++) {
    const emoji = sourceEmojis[i];
    const prefix = `[${i + 1}/${sourceEmojis.length}]`;

    if (existingTargetNames.has(emoji.name)) {
      console.log(`${prefix} [SKIP] Emoji "${emoji.name}" already exists on target bot.`);
      skippedCount++;
      continue;
    }

    try {
      console.log(`${prefix} [DOWNLOADING] ${emoji.name} (${emoji.animated ? "GIF" : "PNG"})...`);
      const dataUri = await fetchImageAsDataUri(emoji.id, emoji.animated);

      console.log(`${prefix} [UPLOADING] ${emoji.name} to target bot...`);
      const newEmoji = await restTarget.post(Routes.applicationEmojis(targetAppId), {
        body: {
          name: emoji.name,
          image: dataUri
        }
      });

      console.log(`${prefix} [SUCCESS] Uploaded <${newEmoji.animated ? "a" : ""}:${newEmoji.name}:${newEmoji.id}>`);
      uploadedCount++;
      await sleep(1500);
    } catch (err) {
      console.error(`${prefix} [FAILED] Could not upload ${emoji.name}: ${err.message}`);
      failedCount++;
      await sleep(3000);
    }
  }

  console.log("\n=======================================================");
  console.log("                 UPLOAD SUMMARY                        ");
  console.log("=======================================================");
  console.log(`Total Source Emojis : ${sourceEmojis.length}`);
  console.log(`Successfully Uploaded: ${uploadedCount}`);
  console.log(`Skipped (Already Had): ${skippedCount}`);
  console.log(`Failed               : ${failedCount}`);
  console.log("=======================================================\n");
}

startUploader().catch(console.error);
