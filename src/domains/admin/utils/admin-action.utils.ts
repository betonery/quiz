import type { z } from "zod";
import type { AdminActionResult } from "@/domains/admin/types/admin.types";

/** Converte um erro do Zod no formato de retorno das actions do painel. */
export function invalidResult(error: z.ZodError): AdminActionResult {
  return {
    success: false,
    error: "Verifique os campos informados",
    fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
  };
}

export function failure(message: string): AdminActionResult {
  return { success: false, error: message };
}
