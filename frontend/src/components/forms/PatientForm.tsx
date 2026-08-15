"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { patientSchema, PatientFormValues } from "@/lib/validations/patient"
import { createPatient, updatePatient } from "@/lib/actions/patient.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { isValidCPF } from "@/lib/cpf"
import { CheckCircle, AlertCircle } from "lucide-react"

interface PatientFormProps {
  initialData?: PatientFormValues & { id?: string }
  onSuccess?: (patientId?: string) => void
}

async function fetchCEP(cep: string) {
  const cleaned = cep.replace(/\D/g, "")
  if (cleaned.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
    const data = await res.json()
    if (data.erro) return null
    return {
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    }
  } catch {
    return null
  }
}

export function PatientForm({ initialData, onSuccess }: PatientFormProps) {
  const [cepLoading, setCepLoading] = useState(false)
  const [cpfValid, setCpfValid] = useState<"idle" | "valid" | "invalid">("idle")
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: initialData || {
      full_name: "",
      email: "",
      phone: "",
      cpf: "",
      birth_date: "",
      gender: undefined,
      marital_status: "",
      occupation: "",
      address: { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip_code: "" },
      emergency_contact: { name: "", phone: "", relationship: "" },
      notes: "",
    },
  })

  const watchGender = useWatch({ control: form.control, name: "gender" })

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

      const newId = (result as any)?.data?.id
      toast.success(initialData?.id ? "Paciente atualizado!" : "Paciente criado com sucesso!")
      form.reset()
      onSuccess?.(newId)
    } catch {
      toast.error("Ocorreu um erro ao salvar o paciente.")
    }
  }

  async function handleCEPLookup() {
    const cep = form.getValues("address.zip_code") || ""
    const cleaned = cep.replace(/\D/g, "")
    if (cleaned.length < 8) return

    setCepLoading(true)
    const address = await fetchCEP(cleaned)
    setCepLoading(false)

    if (address) {
      form.setValue("address.street", address.street)
      form.setValue("address.neighborhood", address.neighborhood)
      form.setValue("address.city", address.city)
      form.setValue("address.state", address.state)
      toast.success("Endereço preenchido via CEP")
    } else {
      toast.error("CEP não encontrado")
    }
  }

  function handleCPFValidation() {
    const cpf = form.getValues("cpf") || ""
    const cleaned = cpf.replace(/\D/g, "")

    if (cleaned.length !== 11) {
      setCpfValid("idle")
      return
    }

    setCpfValid(isValidCPF(cpf) ? "valid" : "invalid")
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dados Pessoais</h3>

        <div className="space-y-2">
          <Label htmlFor="full_name">Nome Completo *</Label>
          <Input id="full_name" placeholder="Nome do paciente" {...form.register("full_name")} />
          {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              maxLength={14}
              {...form.register("cpf")}
              onBlur={handleCPFValidation}
            />
            {errors.cpf && <p className="text-sm text-red-500">{errors.cpf.message}</p>}
            {cpfValid === "valid" && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> CPF válido
              </p>
            )}
            {cpfValid === "invalid" && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> CPF com dígitos verificadores inválidos
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input id="email" type="email" placeholder="email@teste.com" {...form.register("email")} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input id="phone" placeholder="(11) 99999-9999" {...form.register("phone")} />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento *</Label>
            <Input id="birth_date" type="date" {...form.register("birth_date")} />
            {errors.birth_date && <p className="text-sm text-red-500">{errors.birth_date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Genero *</Label>
            <Select onValueChange={(val) => { if (val) form.setValue("gender", val as "M" | "F" | "O") }} defaultValue={watchGender ?? undefined}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="O">Outro</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="marital_status">Estado Civil</Label>
            <Input id="marital_status" placeholder="Solteiro, Casado..." {...form.register("marital_status")} />
          </div>
        </div>

        <div className="space-y-2 max-w-[200px]">
          <Label htmlFor="occupation">Profissao</Label>
          <Input id="occupation" placeholder="Ex: Engenheiro" {...form.register("occupation")} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Endereco</h3>

        <div className="space-y-2 max-w-[200px]">
          <Label htmlFor="address.zip_code">CEP</Label>
          <div className="flex gap-2">
            <Input
              id="address.zip_code"
              placeholder="00000-000"
              maxLength={8}
              {...form.register("address.zip_code", {
                onBlur: handleCEPLookup,
              })}
            />
            <Button type="button" variant="outline" size="sm" onClick={handleCEPLookup} disabled={cepLoading}>
              {cepLoading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </div>

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
      </div>

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
            <Input id="emergency_contact.relationship" placeholder="Esposo, Mãe..." {...form.register("emergency_contact.relationship")} />
          </div>
        </div>
      </div>

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
