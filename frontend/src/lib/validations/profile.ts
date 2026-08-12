import { z } from "zod"

export const updateProfileSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(200),
  phone: z.string().min(10, "Telefone obrigatório (mínimo 10 dígitos)").max(20),
})

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>

export const updatePasswordSchema = z.string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(128)

export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>