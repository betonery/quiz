import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "E-mail é obrigatório")
  .email("E-mail inválido");
