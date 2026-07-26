"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { patientSchema, PatientFormValues } from "@/lib/validations/patient"
import { createPatient, updatePatient } from "@/lib/actions/patient.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface PatientFormProps {
  initialData?: PatientFormValues & { id?: string }
  onSuccess?: () => void
}

export function PatientForm({ initialData, onSuccess }: PatientFormProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: initialData || {
      full_name: "",
      email: "",
      phone: "",
      cpf: "",
    },
  })

  const { formState: { isSubmitting, errors } } = form

  async function onSubmit(data: PatientFormValues) {
    try {
      let result;
      if (initialData?.id) {
        result = await updatePatient(initialData.id, data)
      } else {
        result = await createPatient(data)
      }

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success(initialData?.id ? "Paciente atualizado!" : "Paciente criado com sucesso!")
      form.reset()
      onSuccess?.()
    } catch (error) {
      toast.error("Ocorreu um erro ao salvar o paciente.")
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome Completo *</Label>
        <Input id="full_name" placeholder="Nome do paciente" {...form.register("full_name")} />
        {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="email@teste.com" {...form.register("email")} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" placeholder="(11) 99999-9999" {...form.register("phone")} />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpf">CPF</Label>
        <Input id="cpf" placeholder="000.000.000-00" {...form.register("cpf")} />
        {errors.cpf && <p className="text-sm text-red-500">{errors.cpf.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : (initialData?.id ? "Atualizar Paciente" : "Salvar Paciente")}
      </Button>
    </form>
  )
}
