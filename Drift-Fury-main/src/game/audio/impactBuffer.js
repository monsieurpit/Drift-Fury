export function createImpactBuffer(e) {
  const t = Math.floor(e.sampleRate * 0.22);
  const n = e.createBuffer(1, t, e.sampleRate);
  const r = n.getChannelData(0);
  let i = 0;
  for (let n = 0; n < t; n++) {
    i += 0.35 * (Math.random() * 2 - 1 - i);
    r[n] = i * Math.exp(-n / (e.sampleRate * 0.055));
  }
  return n;
}
