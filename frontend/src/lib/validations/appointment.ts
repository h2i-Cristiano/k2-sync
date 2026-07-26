import { z } from "zod"

export const appointmentSchema = z.object({
  patient_id: z.string().uuid("Selecione um paciente válido"),
  professional_id: z.string().uuid().optional(),
  service_type: z.string().min(2, "Informe o tipo de serviço"),
  scheduled_at: z.string(), // expected ISO string
  duration_minutes: z.coerce.number().min(5).default(60),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).default('scheduled'),
  notes: z.string().optional(),
  is_home_visit: z.boolean().default(false),
  travel_cost: z.coerce.number().optional(),
  total_cost: z.coerce.number().optional(),
})

export type AppointmentFormValues = z.infer<typeof appointmentSchema>
