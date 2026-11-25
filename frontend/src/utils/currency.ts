const inrFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  if (safe < 0) {
    return `-₹${inrFormatter.format(Math.abs(safe))}`;
  }
  return `₹${inrFormatter.format(safe)}`;
}

function trimDecimal(num: number): string {
  const fixed = num.toFixed(1);
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
}

export function formatINRCompact(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const sign = safe < 0 ? '-' : '';
  const abs = Math.abs(safe);

  if (abs >= 10_000_000) {
    return `${sign}₹${trimDecimal(abs / 10_000_000)}Cr`;
  }
  if (abs >= 100_000) {
    return `${sign}₹${trimDecimal(abs / 100_000)}L`;
  }
  if (abs >= 1_000) {
    return `${sign}₹${trimDecimal(abs / 1_000)}K`;
  }
  return `${sign}₹${Math.round(abs)}`;
}

export function parseINRInput(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d.]/g, '');
  if (!cleaned) return 0;
  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

export function formatINRInputDisplay(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '';
  return inrFormatter.format(Math.round(amount));
}
