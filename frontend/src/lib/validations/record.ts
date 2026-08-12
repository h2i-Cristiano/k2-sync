import { z } from "zod"

export const recordCreateSchema = z.object({
  patient_id: z.string().uuid("Selecione um paciente"),
  session_number: z.coerce.number().min(1, "Numero da sessão obrigatório").optional(),
  chief_complaint: z.string().optional(),
  assessment: z.string().optional(),
  treatment_plan: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["draft", "completed"]).default("draft"),
})

export const recordUpdateSchema = z.object({
  patient_id: z.string().uuid("Selecione um paciente").optional(),
  session_number: z.coerce.number().min(1, "Numero da sessão obrigatório").optional(),
  chief_complaint: z.string().optional(),
  assessment: z.string().optional(),
  treatment_plan: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["draft", "completed"]).optional(),
})

export type RecordCreateFormValues = z.infer<typeof recordCreateSchema>
export type RecordUpdateFormValues = z.infer<typeof recordUpdateSchema>