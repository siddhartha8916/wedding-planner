export async function simulateLatency(ms?: number): Promise<void> {
  if (ms === 0) return;
  const duration = ms ?? 150 + Math.floor(Math.random() * 90);
  if (duration <= 0) return;
  await new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });
}
