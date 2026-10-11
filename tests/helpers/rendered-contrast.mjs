/** Test helper: conservative computed-style evidence, never universal UX approval. */
function rgb(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d+(?:\.\d+)?))?\s*\)$/);
  if (!match) return null;
  const channels = match.slice(1, 4).map(Number);
  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  if (channels.some((n) => !Number.isFinite(n) || n < 0 || n > 255) ||
      !Number.isFinite(alpha) || alpha < 0 || alpha > 1) return null;
  return { channels, alpha };
}
const over = (front, back) => front.channels.map((n, i) =>
  n * front.alpha + back[i] * (1 - front.alpha));
const luminance = (channels) => channels.map((n) => {
  const s = n / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}).reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);

export function evaluateComputedContrast(sample) {
  const unknown = { status: "UNVERIFIED", ratio: null, minimumRatio: null };
  if (!sample || !Array.isArray(sample.backgrounds) || !Number.isFinite(sample.fontSizePx) ||
      sample.fontSizePx <= 0 || !Number.isFinite(sample.fontWeight)) return unknown;
  if (sample.disabled === true) return { ...unknown, status: "EXEMPT" };
  if (sample.backgrounds.some((layer) => Number(layer.opacity) !== 1 ||
    (layer.filter !== undefined && layer.filter !== "none") ||
    (layer.backdropFilter !== undefined && layer.backdropFilter !== "none") ||
    (layer.mixBlendMode !== undefined && layer.mixBlendMode !== "normal") ||
    (layer.textFillColor !== undefined && layer.textFillColor !== layer.inkColor))) return unknown;
  const foreground = rgb(sample.foreground);
  if (!foreground) return unknown;
  const layers = [];
  let opaque = false;
  for (const layer of sample.backgrounds) {
    if (layer.image !== "none" || Number(layer.opacity) !== 1) return unknown;
    const color = rgb(layer.color);
    if (!color) return unknown;
    layers.push(color);
    if (color.alpha === 1) { opaque = true; break; }
  }
  // Unknown canvas/media pixels cannot silently become white or PASS.
  if (!opaque) return unknown;
  let background = layers.pop().channels;
  for (const layer of layers.reverse()) background = over(layer, background);
  const ink = over(foreground, background);
  const a = luminance(ink), b = luminance(background);
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const minimumRatio = sample.kind === "meaningful-non-text" || sample.fontSizePx >= 24 ||
    (sample.fontWeight >= 700 && sample.fontSizePx >= 56 / 3) ? 3 : 4.5;
  return { status: ratio >= minimumRatio ? "PASS" : "FAIL", ratio, minimumRatio };
}

/** Browser-evaluated DOM observer; all styles are final computed values. */
export function collectComputedContrast(element) {
  const style = getComputedStyle(element);
  const backgrounds = [];
  for (let node = element; node; node = node.parentElement) {
    const s = getComputedStyle(node);
    backgrounds.push({ color: s.backgroundColor, image: s.backgroundImage, opacity: s.opacity,
      filter: s.filter, backdropFilter: s.backdropFilter, mixBlendMode: s.mixBlendMode,
      textFillColor: s.webkitTextFillColor, inkColor: s.color });
  }
  return { foreground: style.color, backgrounds,
    fontSizePx: Number.parseFloat(style.fontSize), fontWeight: Number.parseFloat(style.fontWeight),
    disabled: element.matches("button:disabled,input:disabled,select:disabled,textarea:disabled") };
}
