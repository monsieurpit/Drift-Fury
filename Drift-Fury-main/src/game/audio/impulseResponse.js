export function createImpulseResponse(context) {
  const length = Math.floor(context.sampleRate * 0.22);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let noise = 0;
  for (let n = 0; n < length; n++) {
    noise += 0.35 * (Math.random() * 2 - 1 - noise);
    data[n] = noise * Math.exp(-n / (context.sampleRate * 0.055));
  }
  return buffer;
}
