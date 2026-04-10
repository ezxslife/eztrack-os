export interface OpaqueColor {
  b: number;
  g: number;
  r: number;
}

export interface AlphaColor extends OpaqueColor {
  a: number;
}

function clampChannel(value: number) {
  return Math.min(255, Math.max(0, value));
}

export function parseColor(input: string): AlphaColor {
  const color = input.trim();

  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((channel) => `${channel}${channel}`)
            .join("")
        : hex;

    if (normalized.length !== 6) {
      throw new Error(`Unsupported hex color: ${input}`);
    }

    return {
      a: 1,
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }

  const rgbMatch = color.match(/^rgba?\(([^)]+)\)$/i);
  if (!rgbMatch) {
    throw new Error(`Unsupported color format: ${input}`);
  }

  const [r, g, b, a] = rgbMatch[1]
    .split(",")
    .map((part) => part.trim());

  return {
    a: a === undefined ? 1 : Number.parseFloat(a),
    r: clampChannel(Number.parseFloat(r)),
    g: clampChannel(Number.parseFloat(g)),
    b: clampChannel(Number.parseFloat(b)),
  };
}

export function compositeColor(
  foreground: AlphaColor | string,
  background: AlphaColor | string
): OpaqueColor {
  const fg = typeof foreground === "string" ? parseColor(foreground) : foreground;
  const bg = typeof background === "string" ? parseColor(background) : background;

  if (bg.a !== 1) {
    throw new Error("Background colors must be opaque before compositing.");
  }

  const alpha = fg.a;

  return {
    r: clampChannel(Math.round(fg.r * alpha + bg.r * (1 - alpha))),
    g: clampChannel(Math.round(fg.g * alpha + bg.g * (1 - alpha))),
    b: clampChannel(Math.round(fg.b * alpha + bg.b * (1 - alpha))),
  };
}

function relativeLuminance(color: OpaqueColor | string) {
  const opaque =
    typeof color === "string"
      ? compositeColor(parseColor(color), { a: 1, r: 255, g: 255, b: 255 })
      : color;

  const toLinear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * toLinear(opaque.r) +
    0.7152 * toLinear(opaque.g) +
    0.0722 * toLinear(opaque.b)
  );
}

export function getContrastRatio(
  foreground: OpaqueColor | string,
  background: OpaqueColor | string
) {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background)
  );
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background)
  );

  return (lighter + 0.05) / (darker + 0.05);
}
