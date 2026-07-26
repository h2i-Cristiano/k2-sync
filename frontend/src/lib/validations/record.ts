import { z } from "zod"

export const recordSchema = z.object({
  patient_id: z.string().uuid("Selecione um paciente"),
  session_number: z.coerce.number().min(1, "Numero da sessao obrigatorio").optional(),
  chief_complaint: z.string().optional(),
  assessment: z.string().optional(),
  treatment_plan: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["draft", "completed", "approved"]).default("draft"),
})

export type RecordFormValues = z.infer<typeof recordSchema>
