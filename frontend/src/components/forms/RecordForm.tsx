"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { recordCreateSchema, RecordCreateFormValues } from "@/lib/validations/record"
import { createRecord, updateRecord } from "@/lib/actions/record.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface RecordFormProps {
  patients: { id: string; full_name: string }[]
  initialData?: RecordCreateFormValues & { id?: string }
  onSuccess?: () => void
  onCancel?: () => void
}

const selectClass = (hasError?: boolean) =>
  `flex w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${hasError ? "border-destructive" : ""}`

const optionClass = "text-foreground bg-background"

export function RecordForm({ patients, initialData, onSuccess, onCancel }: RecordFormProps) {
  const form = useForm({
    resolver: zodResolver(recordCreateSchema) as any,
    defaultValues: initialData || {
      patient_id: "",
      session_number: 1,
      chief_complaint: "",
      assessment: "",
      treatment_plan: "",
      notes: "",
      status: "draft" as const,
    },
  })

  const { formState: { isSubmitting, errors } } = form

  async function onSubmit(data: RecordCreateFormValues) {
    let result
    if (initialData?.id) {
      result = await updateRecord(initialData.id, data)
    } else {
      result = await createRecord(data)
    }

    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(initialData?.id ? "Prontuário atualizado!" : "Prontuário criado com sucesso!")
    form.reset()
    onSuccess?.()
  }

  const patientId = String(useWatch({ control: form.control, name: "patient_id" }) ?? "")

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patient_id">Paciente *</Label>
          <select
            id="patient_id"
            value={patientId}
            onChange={(e) => form.setValue("patient_id", e.target.value)}
            className={selectClass(!!errors.patient_id)}
          >
            <option value="" className={optionClass}>Selecione o paciente</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id} className={optionClass}>{p.full_name}</option>
            ))}
          </select>
          {errors.patient_id && <p className="text-sm font-medium text-destructive">{errors.patient_id.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="session_number">Sessão Nº</Label>
          <Input id="session_number" type="number" className="h-12 rounded-xl" {...form.register("session_number")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="chief_complaint">Queixa Principal</Label>
        <Textarea id="chief_complaint" placeholder="Motivo da consulta..." {...form.register("chief_complaint")} className="resize-none" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="assessment">Avaliação Clínica</Label>
        <Textarea id="assessment" placeholder="Observações, diagnóstico..." {...form.register("assessment")} className="resize-none" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatment_plan">Plano de Tratamento</Label>
        <Textarea id="treatment_plan" placeholder="Procedimentos, orientações..." {...form.register("treatment_plan")} className="resize-none" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" placeholder="Notas adicionais..." {...form.register("notes")} className="resize-none" />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : (initialData?.id ? "Atualizar" : "Salvar Prontuário")}
        </Button>
      </div>
    </form>
  )
}