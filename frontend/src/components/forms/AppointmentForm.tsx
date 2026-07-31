"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { appointmentSchema, AppointmentFormValues } from "@/lib/validations/appointment"
import { createAppointment, updateAppointment } from "@/lib/actions/appointment.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { SERVICES, getServiceById } from "@/lib/services"

interface AppointmentFormProps {
  patients: { id: string; full_name: string }[]
  initialData?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function AppointmentForm({ patients, initialData, onSuccess, onCancel }: AppointmentFormProps) {
  const [saving, setSaving] = useState(false)

  const defaultDate = initialData?.scheduled_at
    ? new Date(initialData.scheduled_at).toISOString().slice(0, 16)
    : (() => {
        const d = new Date()
        d.setHours(d.getHours() + 1, 0, 0, 0)
        return d.toISOString().slice(0, 16)
      })()

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema) as any,
    defaultValues: {
      patient_id: initialData?.patient_id || "",
      service_type: (initialData?.service_type || "outro") as AppointmentFormValues["service_type"],
      scheduled_at: defaultDate,
      duration_minutes: initialData?.duration_minutes || 60,
      status: (initialData?.status || "scheduled") as AppointmentFormValues["status"],
      notes: initialData?.notes || "",
      is_home_visit: initialData?.is_home_visit || false,
      travel_cost: initialData?.travel_cost || 0,
      total_cost: initialData?.total_cost || 0,
    },
  })

  const watchServiceType = form.watch("service_type")
  const watchIsHomeVisit = form.watch("is_home_visit")

  async function onSubmit(data: AppointmentFormValues) {
    setSaving(true)
    try {
      const formattedData = {
        ...data,
        scheduled_at: new Date(data.scheduled_at).toISOString(),
      }

      if (initialData?.id) {
        await updateAppointment(initialData.id, formattedData)
        toast.success("Agendamento atualizado com sucesso!")
      } else {
        await createAppointment(formattedData)
        toast.success("Agendamento criado com sucesso!")
      }
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar agendamento")
    } finally {
      setSaving(false)
    }
  }

  const handleServiceChange = (value: string | null) => {
    if (!value) return
    const svc = getServiceById(value)
    if (svc) {
      form.setValue("service_type", value as AppointmentFormValues["service_type"])
      form.setValue("duration_minutes", svc.defaultDuration)
      if (!initialData?.total_cost && svc.defaultPrice > 0) {
        form.setValue("total_cost", svc.defaultPrice)
      }
    }
  }

  const selectedService = getServiceById(watchServiceType)

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
      {/* Patient */}
      <div className="space-y-2">
        <Label htmlFor="patient_id">Paciente *</Label>
        <Select onValueChange={(val) => { if (val) form.setValue("patient_id", val) }} defaultValue={String(form.watch("patient_id") ?? "")}>
          <SelectTrigger id="patient_id" className={`w-full h-12 rounded-xl ${form.formState.errors.patient_id ? "border-destructive" : ""}`}>
            <SelectValue placeholder="Selecione o paciente" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.patient_id && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.patient_id.message}</p>
        )}
      </div>

      {/* Service Type */}
      <div className="space-y-2">
        <Label htmlFor="service_type">Tipo de Serviço *</Label>
        <Select onValueChange={handleServiceChange} defaultValue={String(form.watch("service_type") ?? "outro")}>
          <SelectTrigger id="service_type" className={`w-full h-12 rounded-xl ${form.formState.errors.service_type ? "border-destructive" : ""}`}>
            <SelectValue placeholder="Selecione o serviço" />
          </SelectTrigger>
          <SelectContent>
            {SERVICES.map((svc) => (
              <SelectItem key={svc.id} value={svc.id}>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: svc.color }} />
                  <span>{svc.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{svc.defaultDuration}min</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedService && (
          <div className="flex items-center gap-2 mt-1">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedService.color }} />
            <span className="text-xs text-muted-foreground">
              {selectedService.defaultDuration}min · R$ {selectedService.defaultPrice.toFixed(0)}
            </span>
          </div>
        )}
        {form.formState.errors.service_type && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.service_type.message}</p>
        )}
      </div>

      {/* Date + Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduled_at">Data e Hora *</Label>
          <Input
            id="scheduled_at"
            type="datetime-local"
            {...form.register("scheduled_at")}
            className={form.formState.errors.scheduled_at ? "border-destructive" : ""}
          />
          {form.formState.errors.scheduled_at && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.scheduled_at.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duração (min) *</Label>
          <Input
            id="duration_minutes"
            type="number"
            {...form.register("duration_minutes")}
            className={form.formState.errors.duration_minutes ? "border-destructive" : ""}
          />
          {form.formState.errors.duration_minutes && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.duration_minutes.message}</p>
          )}
        </div>
      </div>

      {/* Status + Home Visit */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={(val) => { if (val) form.setValue("status", val as AppointmentFormValues["status"]) }} defaultValue={String(form.watch("status") ?? "scheduled")}>
            <SelectTrigger id="status" className="w-full h-12 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="no_show">Não Compareceu</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-8">
          <Switch
            id="is_home_visit"
            checked={watchIsHomeVisit}
            onCheckedChange={(checked) => form.setValue("is_home_visit", checked)}
          />
          <Label htmlFor="is_home_visit">Atendimento Domiciliar</Label>
        </div>
      </div>

      {/* Costs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="total_cost">Valor Total (R$)</Label>
          <Input
            id="total_cost"
            type="number"
            step="0.01"
            {...form.register("total_cost")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="travel_cost">Taxa de Deslocamento (R$)</Label>
          <Input
            id="travel_cost"
            type="number"
            step="0.01"
            {...form.register("travel_cost")}
            disabled={!watchIsHomeVisit}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações Adicionais</Label>
        <Textarea
          id="notes"
          placeholder="Anotações para o agendamento..."
          {...form.register("notes")}
          className="resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : (initialData?.id ? "Atualizar Agendamento" : "Salvar Agendamento")}
        </Button>
      </div>
    </form>
  )
}
