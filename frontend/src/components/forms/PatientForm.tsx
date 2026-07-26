"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { patientSchema, PatientFormValues } from "@/lib/validations/patient"
import { createPatient, updatePatient } from "@/lib/actions/patient.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
      rg: "",
      birth_date: "",
      gender: undefined,
      marital_status: "",
      occupation: "",
      address: { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip_code: "" },
      emergency_contact: { name: "", phone: "", relationship: "" },
      notes: "",
    },
  })

  const { formState: { isSubmitting, errors } } = form

  async function onSubmit(data: PatientFormValues) {
    try {
      let result
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
    } catch {
      toast.error("Ocorreu um erro ao salvar o paciente.")
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Dados Pessoais */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dados Pessoais</h3>

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

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" placeholder="000.000.000-00" {...form.register("cpf")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rg">RG</Label>
            <Input id="rg" placeholder="00.000.000-0" {...form.register("rg")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input id="birth_date" type="date" {...form.register("birth_date")} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Genero</Label>
            <Select onValueChange={(val) => form.setValue("gender", val as "M" | "F" | "O")} defaultValue={form.watch("gender") ?? undefined}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="O">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="marital_status">Estado Civil</Label>
            <Input id="marital_status" placeholder="Solteiro, Casado..." {...form.register("marital_status")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="occupation">Profissao</Label>
            <Input id="occupation" placeholder="Ex: Engenheiro" {...form.register("occupation")} />
          </div>
        </div>
      </div>

      {/* Endereco */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Endereco</h3>

        <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
          <div className="space-y-2">
            <Label htmlFor="address.street">Rua</Label>
            <Input id="address.street" placeholder="Rua das Flores" {...form.register("address.street")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address.number">Numero</Label>
            <Input id="address.number" placeholder="123" {...form.register("address.number")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address.complement">Complemento</Label>
            <Input id="address.complement" placeholder="Apto 101" {...form.register("address.complement")} />
          </div>
        </div>

        <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
          <div className="space-y-2">
            <Label htmlFor="address.neighborhood">Bairro</Label>
            <Input id="address.neighborhood" placeholder="Centro" {...form.register("address.neighborhood")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address.city">Cidade</Label>
            <Input id="address.city" placeholder="Sao Paulo" {...form.register("address.city")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address.state">Estado</Label>
            <Input id="address.state" placeholder="SP" {...form.register("address.state")} />
          </div>
        </div>

        <div className="space-y-2 max-w-[200px]">
          <Label htmlFor="address.zip_code">CEP</Label>
          <Input id="address.zip_code" placeholder="00000-000" {...form.register("address.zip_code")} />
        </div>
      </div>

      {/* Contato de Emergencia */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contato de Emergencia</h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact.name">Nome</Label>
            <Input id="emergency_contact.name" placeholder="Nome do contato" {...form.register("emergency_contact.name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact.phone">Telefone</Label>
            <Input id="emergency_contact.phone" placeholder="(11) 99999-9999" {...form.register("emergency_contact.phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact.relationship">Parentesco</Label>
            <Input id="emergency_contact.relationship" placeholder="Esposo, Mae..." {...form.register("emergency_contact.relationship")} />
          </div>
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observacoes</Label>
        <textarea
          id="notes"
          placeholder="Notas sobre o paciente..."
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          {...form.register("notes")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : (initialData?.id ? "Atualizar Paciente" : "Salvar Paciente")}
      </Button>
    </form>
  )
}
