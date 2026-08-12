"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { recordCreateSchema, RecordCreateFormValues } from "@/lib/validations/record"
import { createRecord, updateRecord } from "@/lib/actions/record.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface RecordFormProps {
  patients: { id: string; full_name: string }[]
  initialData?: RecordCreateFormValues & { id?: string }
  onSuccess?: () => void
  onCancel?: () => void
}

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
          <Label>Paciente *</Label>
          <Select onValueChange={(val) => { if (val) form.setValue("patient_id", val) }} defaultValue={patientId}>
            <SelectTrigger className={errors.patient_id ? "border-destructive" : ""}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.patient_id && <p className="text-sm text-red-500">{errors.patient_id.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="session_number">Sessão Nº</Label>
          <Input id="session_number" type="number" {...form.register("session_number")} />
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
