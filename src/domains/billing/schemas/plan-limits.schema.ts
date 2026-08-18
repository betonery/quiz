import { z } from "zod";

export const planLimitsSchema = z.object({
  max_quizzes: z.number().int(),
  max_team_members: z.number().int(),
  max_custom_domains: z.number().int(),
});

export const planIdSchema = z.enum(["starter", "pro"]);
