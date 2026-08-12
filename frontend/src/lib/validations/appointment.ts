import { z } from "zod"

export const appointmentCreateSchema = z.object({
  patient_id: z.string().uuid("Selecione um paciente válido"),
  service_type: z.string().min(1, "Selecione um serviço"),
  scheduled_at: z.string().min(1, "Data e hora são obrigatórios"),
  duration_minutes: z.coerce.number().min(5).default(60),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']).default('scheduled'),
  notes: z.string().optional(),
  is_home_visit: z.boolean().default(false),
  travel_cost: z.coerce.number().min(0).optional(),
  total_cost: z.coerce.number().min(0).optional(),
  commission_percent: z.coerce.number().min(0).max(100).optional(),
  commission_amount: z.coerce.number().min(0).optional(),
})

export const appointmentUpdateSchema = z.object({
  patient_id: z.string().uuid("Selecione um paciente válido").optional(),
  service_type: z.string().optional(),
  scheduled_at: z.string().min(1, "Data e hora são obrigatórios").optional(),
  duration_minutes: z.coerce.number().min(5).optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().optional(),
  is_home_visit: z.boolean().optional(),
  travel_cost: z.coerce.number().min(0).optional(),
  total_cost: z.coerce.number().min(0).optional(),
  commission_percent: z.coerce.number().min(0).max(100).optional(),
  commission_amount: z.coerce.number().min(0).optional(),
})

export type AppointmentCreateFormValues = z.infer<typeof appointmentCreateSchema>
export type AppointmentUpdateFormValues = z.infer<typeof appointmentUpdateSchema>
