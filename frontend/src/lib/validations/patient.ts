import { z } from "zod"

export const patientSchema = z.object({
  full_name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(10, "Telefone inválido").optional().or(z.literal("")),
  cpf: z.string().optional().or(z.literal("")),
  rg: z.string().optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  gender: z.enum(["M", "F", "O"]).optional(),
  marital_status: z.string().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional()
  }).optional(),
  emergency_contact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional()
  }).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  medical_conditions: z.array(z.string()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export type PatientFormValues = z.infer<typeof patientSchema>
