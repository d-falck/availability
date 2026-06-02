/**
 * Runs once when the server boots. Generates an initial snapshot and then
 * refreshes on a timer (REGEN_INTERVAL_MIN, default 10) so availability tracks
 * your calendar without any external cron. This is the periodic-sync engine; a
 * Google push webhook could later call the same generate() for instant updates.
 *
 * The node-only import lives inside the NEXT_RUNTIME === "nodejs" guard so it's
 * stripped from the edge bundle at build time.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { generate } = await import("@/lib/generate/run");
    const tick = () =>
      generate().catch((err) => console.error("[regen] failed:", err?.message ?? err));

    await tick();
    const minutes = Number(process.env.REGEN_INTERVAL_MIN ?? 10);
    setInterval(tick, Math.max(1, minutes) * 60 * 1000);
    console.log(`[regen] refreshing availability every ${minutes} min`);
  }
}
