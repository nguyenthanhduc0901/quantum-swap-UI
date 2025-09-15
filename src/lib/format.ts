export function formatAmountFromBigInt(value: bigint, decimals: number, maximumFractionDigits = 6): string {
  try {
    const base = 10n ** BigInt(decimals);
    const whole = value / base;
    const frac = value % base;
    const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
    const out = fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
    const num = Number(out);
    if (!Number.isFinite(num)) return out; // fallback
    return num.toLocaleString(undefined, { maximumFractionDigits });
  } catch {
    return value.toString();
  }
}

export function formatNumber(n?: number, maximumFractionDigits = 6): string {
  if (n == null || Number.isNaN(n)) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits });
}

export function shortAddress(addr?: string): string {
  if (!addr) return "...";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function toBasisPoints(percent: number): bigint {
  // percent like 0.5 → 50 bps
  return BigInt(Math.floor(percent * 100));
}

