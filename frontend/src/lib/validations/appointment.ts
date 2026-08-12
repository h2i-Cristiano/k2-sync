import { z } from "zod"

const serviceTypeEnum = z.enum([
  "massoterapia",
  "estetica-facial",
  "estetica-corp",
  "fisioterapia",
  "quiropraxia",
  "acupuntura",
  "spa",
  "danca",
  "personal",
  "outro",
])

export const appointmentCreateSchema = z.object({
  patient_id: z.string().uuid("Selecione um paciente válido"),
  service_type: serviceTypeEnum,
  scheduled_at: z.string().min(1, "Data e hora são obrigatórios"),
  duration_minutes: z.coerce.number().min(5).default(60),
  status: z.enum(['scheduled', 'confirmed', 'in_progress']).default('scheduled'),
  notes: z.string().optional(),
  is_home_visit: z.boolean().default(false),
  travel_cost: z.coerce.number().min(0).optional(),
  total_cost: z.coerce.number().min(0).optional(),
})

export const appointmentUpdateSchema = z.object({
  patient_id: z.string().uuid("Selecione um paciente válido").optional(),
  service_type: serviceTypeEnum.optional(),
  scheduled_at: z.string().min(1, "Data e hora são obrigatórios").optional(),
  duration_minutes: z.coerce.number().min(5).optional(),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().optional(),
  is_home_visit: z.boolean().optional(),
  travel_cost: z.coerce.number().min(0).optional(),
  total_cost: z.coerce.number().min(0).optional(),
})

export type AppointmentCreateFormValues = z.infer<typeof appointmentCreateSchema>
export type AppointmentUpdateFormValues = z.infer<typeof appointmentUpdateSchema>