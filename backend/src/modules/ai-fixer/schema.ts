import { z } from 'zod';

export const GeminiFixSchema = z.object({
  issue_id: z.string(),
  selector: z.string().min(1),
  fix_type: z.enum(['alt_text','aria_label','aria_role','contrast','heading_order','label','tabindex','lang','other']),
  fix_value: z.string(),
  explanation: z.string(),
});

export const GeminiFixArraySchema = z.array(GeminiFixSchema);
export type GeminiFix = z.infer<typeof GeminiFixSchema>;
