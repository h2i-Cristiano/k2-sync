import { z } from "zod"

export const anamneseSchema = z.object({
  patient_id: z.string().uuid("Paciente é obrigatório"),
  professional_id: z.string().uuid().optional(),
  form_type: z.enum(['massage', 'facial', 'body', 'general', 'dental', 'salon']),
  data: z.record(z.any()).default({}), // Armazena as respostas dinâmicas
  status: z.enum(['draft', 'completed', 'signed']).default('draft'),
})

export type AnamneseFormValues = z.infer<typeof anamneseSchema>
