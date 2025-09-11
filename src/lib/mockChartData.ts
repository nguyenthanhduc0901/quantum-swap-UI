export type LinePoint = { time: number; value: number };

export function generateMockLineData(points = 180, base = 2000): LinePoint[] {
  const data: LinePoint[] = [];
  let v = base;
  let t = Math.floor(Date.now() / 1000) - points * 60;
  for (let i = 0; i < points; i++) {
    const drift = (Math.random() - 0.5) * 10; // small minute drift
    const shock = Math.random() < 0.02 ? (Math.random() - 0.5) * 60 : 0; // rare shock
    v = Math.max(1, v + drift + shock);
    t += 60;
    data.push({ time: t, value: Number(v.toFixed(2)) });
  }
  return data;
}


