export const colors = {
  primary: "#0F172A",
  secondary: "#3B82F6",
  tertiary: "#6366F1",
  neutral: "#94A3B8",
} as const;

export const typography = {
  fontFamily: "Poppins",
  headline: { size: "2.25rem", weight: 700, lineHeight: 1.2 },
  body: { size: "1rem", weight: 400, lineHeight: 1.6 },
  label: { size: "0.875rem", weight: 500, lineHeight: 1.4 },
} as const;

export const radius = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  full: "9999px",
} as const;
