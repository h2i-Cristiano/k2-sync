import { z } from "zod"

export const patientSchema = z.object({
  full_name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(10, "Telefone obrigatório (mínimo 10 dígitos)"),
  cpf: z.string().min(11, "CPF obrigatório (mínimo 11 dígitos)"),
  rg: z.string().optional().or(z.literal("")),
  birth_date: z.string().min(1, "Data de nascimento é obrigatória"),
  gender: z.enum(["M", "F", "O"], { message: "Gênero é obrigatório" }),
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
