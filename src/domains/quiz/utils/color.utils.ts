const HEX_SHORT = /^#([0-9a-fA-F]{3})$/;
const HEX_FULL = /^#([0-9a-fA-F]{6})$/;

export function normalizeHexColor(input: string): string | null {
  const trimmed = input.trim();

  const shortMatch = trimmed.match(HEX_SHORT);
  if (shortMatch) {
    const [, hex] = shortMatch;
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
  }

  const fullMatch = trimmed.match(HEX_FULL);
  if (fullMatch) {
    return trimmed.toLowerCase();
  }

  return null;
}

export function isValidHexColor(input: string): boolean {
  return normalizeHexColor(input) !== null;
}

export function toColorInputValue(hex: string): string {
  const normalized = normalizeHexColor(hex);
  return normalized ?? "#000000";
}

export function formatHexDisplay(hex: string): string {
  return toColorInputValue(hex);
}
