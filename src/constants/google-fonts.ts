export const GOOGLE_FONTS = [
  { slug: "Poppins", label: "Poppins" },
  { slug: "Roboto", label: "Roboto" },
  { slug: "Inter", label: "Inter" },
  { slug: "Open Sans", label: "Open Sans" },
  { slug: "Lato", label: "Lato" },
  { slug: "Montserrat", label: "Montserrat" },
  { slug: "Nunito", label: "Nunito" },
  { slug: "Raleway", label: "Raleway" },
  { slug: "Playfair Display", label: "Playfair Display" },
  { slug: "Merriweather", label: "Merriweather" },
] as const;

export type GoogleFontSlug = (typeof GOOGLE_FONTS)[number]["slug"];

export function getGoogleFontsUrl(fonts: string[]): string {
  const unique = [...new Set(fonts.filter(Boolean))];
  if (unique.length === 0) return "";

  const families = unique
    .map(
      (font) =>
        `family=${encodeURIComponent(font).replace(/%20/g, "+")}:wght@400;500;600;700`,
    )
    .join("&");

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
