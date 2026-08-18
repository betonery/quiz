export const MAX_QUIZ_ASSET_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_QUIZ_AUDIO_FILE_SIZE = 15 * 1024 * 1024;

// SVG é intencionalmente omitido: pode conter <script>/handlers e, servido a
// partir de um bucket público, resultaria em XSS armazenado quando acessado
// diretamente pela URL pública do objeto.
export const QUIZ_ASSET_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const QUIZ_AUDIO_ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/webm",
  "audio/wav",
] as const;

export const MAX_QUIZ_ASSET_FILE_SIZE_LABEL = "5MB";
export const MAX_QUIZ_AUDIO_FILE_SIZE_LABEL = "15MB";

export const QUIZ_ASSET_SUBFOLDERS = [
  "logo",
  "options",
  "media",
  "audio",
  "carousel",
  "testimonials",
] as const;

export type QuizAssetSubfolder = (typeof QUIZ_ASSET_SUBFOLDERS)[number];

export type QuizAssetKind = "image" | "audio";
