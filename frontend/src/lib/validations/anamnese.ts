import { z } from "zod"

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/

export const anamneseCreateSchema = z.object({
  patient_id: z.string().uuid("Paciente é obrigatório"),
  form_type: z.enum(['massage', 'facial', 'body', 'general', 'dental', 'salon']),
  data: z.record(z.string(), z.any()).default({}),
  status: z.enum(['draft', 'completed']).default('draft'),
})

export const anamneseUpdateSchema = z.object({
  patient_id: z.string().uuid("Paciente é obrigatório").optional(),
  form_type: z.enum(['massage', 'facial', 'body', 'general', 'dental', 'salon']).optional(),
  data: z.record(z.string(), z.any()).optional(),
  status: z.enum(['draft', 'completed']).optional(),
})

export type AnamneseCreateFormValues = z.infer<typeof anamneseCreateSchema>
export type AnamneseUpdateFormValues = z.infer<typeof anamneseUpdateSchema>

export const anamneseDataSchema = z.object({
  chief_complaint: z.string().optional(),
  pain_location: z.string().optional(),
  pain_intensity: z.string().optional(),
  pain_frequency: z.string().optional(),
  pain_duration: z.string().optional(),
  previous_treatments: z.string().optional(),

  allergies: z.string().optional(),
  medications: z.string().optional(),
  medical_conditions: z.string().optional(),
  previous_surgeries: z.string().optional(),
  pregnant: z.string().optional(),
  pregnancy_weeks: z.string().optional(),

  smokes: z.string().optional(),
  drinks: z.string().optional(),
  exercise_frequency: z.string().optional(),
  sleep_quality: z.string().optional(),
  stress_level: z.string().optional(),
  diet: z.string().optional(),

  expectations: z.string().optional(),

  consent_name: z.string().min(3, "Nome completo obrigatório"),
  consent_cpf: z.string().regex(cpfRegex, "CPF inválido (ex: 123.456.789-00)"),
  consent_signature_image: z.string().min(1, "Assinatura é obrigatória"),
  consent_signature_typed_name: z.string().optional(),
  consent_signature_timestamp: z.string().min(1, "Data da assinatura é obrigatória"),
  consent_photo: z.string().optional(),
  consent_photo_timestamp: z.string().optional(),
  consent_lgpd_accepted: z.boolean().refine(val => val === true, "Você deve aceitar os termos LGPD"),
  consent_marketing_accepted: z.boolean(),
})

export type AnamneseDataValues = z.infer<typeof anamneseDataSchema>