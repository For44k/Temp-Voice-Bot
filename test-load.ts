import { FastVoiceSession, VoiceMemoryStore } from "./src/modules/voice/cache/voice.store";
import { GuildMemoryStore } from "./src/modules/voice/cache/guild.store";
import { PreferencesStore } from "./src/modules/user/cache/preferences.store";
import { PanelBuilder } from "./src/core/interactions/panel.builder";

import { initDatabase } from "./src/database/connection";

async function runLoadTest(totalRequests = 1000, concurrency = 100) {
  await initDatabase();
  await PreferencesStore.preload();

  console.log(`\n======================================================`);
  console.log(`🚀 Starting Voice Channel Scalability Test`);
  console.log(`📊 Total Operations: ${totalRequests} Simulated Users`);
  console.log(`⚡ Concurrency Batch Size: ${concurrency} simultaneous users`);
  console.log(`======================================================\n`);

  const mockGuildId = "123456789012345678";
  
  GuildMemoryStore["store"].set(mockGuildId, {
    guildId: mockGuildId,
    generatorId: "gen_123",
    categoryId: "cat_123",
    defaultLimit: 0,
    theme: "purple"
  } as any);

  let completed = 0;
  let success = 0;
  let failed = 0;
  const latencies: number[] = [];

  const startTime = performance.now();
  const initialMem = process.memoryUsage().heapUsed / 1024 / 1024;

  async function simulateSingleRoomCreation(userId: string) {
    const t0 = performance.now();
    try {
      const prefs = await PreferencesStore.get(mockGuildId, userId);
      const channelId = `vc_${userId}`;

      const session: FastVoiceSession = {
        channelId,
        guildId: mockGuildId,
        ownerId: userId,
        originalOwnerId: userId,
        coOwners: new Set(prefs.trusted),
        whitelist: new Set(prefs.whitelist),
        isLocked: false,
        isTextLocked: false,
        isHidden: false
      };

      VoiceMemoryStore.set(session);

      const panel = await PanelBuilder.createPanel(mockGuildId, userId, false);
      if (!panel || !panel.components) throw new Error("Panel generation failed");

      const retrieved = VoiceMemoryStore.get(channelId);
      if (!retrieved || retrieved.ownerId !== userId) throw new Error("Memory Store consistency error");

      success++;
    } catch {
      failed++;
    } finally {
      const elapsed = performance.now() - t0;
      latencies.push(elapsed);
      completed++;
    }
  }

  for (let i = 0; i < totalRequests; i += concurrency) {
    const chunk = Array.from({ length: Math.min(concurrency, totalRequests - i) }, (_, idx) => {
      const uid = `user_${i + idx + 1}`;
      return simulateSingleRoomCreation(uid);
    });
    await Promise.all(chunk);
  }

  const totalTimeMs = performance.now() - startTime;
  const finalMem = process.memoryUsage().heapUsed / 1024 / 1024;

  latencies.sort((a, b) => a - b);
  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3);
  const p50 = latencies[Math.floor(latencies.length * 0.5)].toFixed(3);
  const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(3);
  const p99 = latencies[Math.floor(latencies.length * 0.99)].toFixed(3);
  const rps = ((completed / totalTimeMs) * 1000).toFixed(0);

  console.log(`\n================== TEST RESULTS ==================`);
  console.log(`✅ Total Completed: ${completed}/${totalRequests}`);
  console.log(`📈 Success Rate:    ${((success / completed) * 100).toFixed(2)}%`);
  console.log(`⏱️ Total Time:      ${(totalTimeMs / 1000).toFixed(3)}s`);
  console.log(`⚡ Throughput:      ${rps} ops/second`);
  console.log(`--------------------------------------------------`);
  console.log(`📊 Latency Metrics:`);
  console.log(`   - Average: ${avgLatency} ms`);
  console.log(`   - Median (p50): ${p50} ms`);
  console.log(`   - 95th percentile (p95): ${p95} ms`);
  console.log(`   - 99th percentile (p99): ${p99} ms`);
  console.log(`--------------------------------------------------`);
  console.log(`🧠 Memory Usage:`);
  console.log(`   - Initial Heap: ${initialMem.toFixed(2)} MB`);
  console.log(`   - Final Heap:   ${finalMem.toFixed(2)} MB (+${(finalMem - initialMem).toFixed(2)} MB)`);
  console.log(`==================================================\n`);

  process.exit(0);
}

runLoadTest(1000, 50).catch(console.error);
