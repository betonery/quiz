export const INPUT_TEXT_MAX_LENGTH = 200;
export const INPUT_NUMBER_MAX_LENGTH = 15;
export const INPUT_PHONE_DIGITS = 11;

export function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatPhoneMask(digits: string): string {
  const d = digits.slice(0, INPUT_PHONE_DIGITS);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
}

export function applyPhoneInput(raw: string): {
  display: string;
  value: string;
} {
  const digits = stripNonDigits(raw).slice(0, INPUT_PHONE_DIGITS);
  return { display: formatPhoneMask(digits), value: digits };
}
