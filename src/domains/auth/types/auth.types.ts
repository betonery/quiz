export type AuthActionResult =
  | { success: true; requiresEmailConfirmation?: boolean }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
