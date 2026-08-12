"use client"

import { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { appointmentCreateSchema, AppointmentCreateFormValues } from "@/lib/validations/appointment"
import { createAppointment, updateAppointment } from "@/lib/actions/appointment.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { fetchServices, ServiceDef } from "@/lib/services"

function formatLocalDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface AppointmentFormProps {
  patients: { id: string; full_name: string; phone?: string }[]
  initialData?: any
  onSuccess?: (result?: { depositEntryId?: string | null; depositAmount?: number; patientPhone?: string; patientName?: string; serviceName?: string }) => void
  onCancel?: () => void
}

export function AppointmentForm({ patients, initialData, onSuccess, onCancel }: AppointmentFormProps) {
  const [saving, setSaving] = useState(false)
  const [services, setServices] = useState<ServiceDef[]>([])
  const [chargeDeposit, setChargeDeposit] = useState(false)
  const [depositAmount, setDepositAmount] = useState<number>(0)

  useEffect(() => {
    fetchServices().then(setServices)
  }, [])

  const defaultDate = initialData?.scheduled_at
    ? formatLocalDatetime(new Date(initialData.scheduled_at))
    : (() => {
        const d = new Date()
        d.setHours(d.getHours() + 1, 0, 0, 0)
        return formatLocalDatetime(d)
      })()

  const form = useForm<AppointmentCreateFormValues>({
    resolver: zodResolver(appointmentCreateSchema) as any,
    defaultValues: {
      patient_id: initialData?.patient_id || "",
      service_type: initialData?.service_type || "",
      scheduled_at: defaultDate,
      duration_minutes: initialData?.duration_minutes || 60,
      status: (initialData?.status || "scheduled") as AppointmentCreateFormValues["status"],
      notes: initialData?.notes || "",
      is_home_visit: initialData?.is_home_visit || false,
      travel_cost: initialData?.travel_cost || 0,
      total_cost: initialData?.total_cost || 0,
      commission_percent: initialData?.commission_percent || 0,
    },
  })

  const watchServiceType = useWatch({ control: form.control, name: "service_type" })
  const watchIsHomeVisit = useWatch({ control: form.control, name: "is_home_visit" })
  const watchTotalCost = useWatch({ control: form.control, name: "total_cost" }) || 0
  const watchCommissionPercent = useWatch({ control: form.control, name: "commission_percent" }) || 0
  const commissionAmount = Number(watchTotalCost) * (Number(watchCommissionPercent) / 100)

  async function onSubmit(data: AppointmentCreateFormValues) {
    setSaving(true)
    const { commission_amount: _ignored, ...dataWithoutCommission } = data as any
    const formattedData = {
      ...dataWithoutCommission,
      scheduled_at: new Date(data.scheduled_at).toISOString(),
    }

    let result
    if (initialData?.id) {
      result = await updateAppointment(initialData.id, formattedData)
    } else {
      result = await createAppointment({
        ...formattedData,
        depositAmount: chargeDeposit && depositAmount > 0 ? depositAmount : undefined,
      })
    }

    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(initialData?.id ? "Agendamento atualizado!" : "Agendamento criado!")

    const r = result as any
    if (chargeDeposit && depositAmount > 0 && r.depositEntryId) {
      const patient = patients.find(p => p.id === form.getValues("patient_id"))
      const svc = services.find(s => s.id === form.getValues("service_type"))
      onSuccess?.({
        depositEntryId: r.depositEntryId,
        depositAmount,
        patientPhone: patient?.phone,
        patientName: patient?.full_name,
        serviceName: svc?.name,
      })
    } else {
      onSuccess?.()
    }
  }

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (!value) return
    const svc = services.find(s => s.id === value)
    if (svc) {
      form.setValue("service_type", value)
      form.setValue("duration_minutes", svc.duration_minutes)
      if (!initialData?.total_cost && svc.price > 0) {
        form.setValue("total_cost", svc.price)
      }
      if (svc.commission_percent > 0) {
        form.setValue("commission_percent", svc.commission_percent)
      }
    }
  }

  const selectedService = services.find(s => s.id === watchServiceType)

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
      {/* Patient */}
      <div className="space-y-2">
        <Label htmlFor="patient_id">Paciente *</Label>
        <select
          id="patient_id"
          value={form.watch("patient_id") || ""}
          onChange={(e) => form.setValue("patient_id", e.target.value)}
          className={`flex w-full h-12 rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${form.formState.errors.patient_id ? "border-destructive" : ""}`}
        >
          <option value="">Selecione o paciente</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
        {form.formState.errors.patient_id && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.patient_id.message}</p>
        )}
      </div>

      {/* Service Type */}
      <div className="space-y-2">
        <Label htmlFor="service_type">Tipo de Serviço *</Label>
        <select
          id="service_type"
          value={form.watch("service_type") || ""}
          onChange={handleServiceChange}
          className={`flex w-full h-12 rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${form.formState.errors.service_type ? "border-destructive" : ""}`}
        >
          <option value="">Selecione o serviço</option>
          {services.map((svc) => (
            <option key={svc.id} value={svc.id}>{svc.name} ({svc.duration_minutes}min)</option>
          ))}
        </select>
        {selectedService && (
          <div className="flex items-center gap-2 mt-1">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedService.color }} />
            <span className="text-xs text-muted-foreground">
              {selectedService.duration_minutes}min – R$ {selectedService.price.toFixed(0)}
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
          <select
            id="status"
            value={form.watch("status") || "scheduled"}
            onChange={(e) => form.setValue("status", e.target.value as AppointmentCreateFormValues["status"])}
            className="flex w-full h-12 rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="scheduled">Agendado</option>
            <option value="confirmed">Confirmado</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>
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

      {/* Costs + Commission */}
      <div className="grid grid-cols-3 gap-4">
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
          <Label htmlFor="commission_percent">Comissão (%)</Label>
          <Input
            id="commission_percent"
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...form.register("commission_percent")}
          />
        </div>
        <div className="space-y-2">
          <Label>Valor Comissão (R$)</Label>
          <Input
            value={commissionAmount.toFixed(2)}
            readOnly
            className="bg-muted"
          />
        </div>
      </div>

      {/* Travel Cost (conditional) */}
      {watchIsHomeVisit && (
        <div className="space-y-2">
          <Label htmlFor="travel_cost">Taxa de Deslocamento (R$)</Label>
          <Input
            id="travel_cost"
            type="number"
            step="0.01"
            {...form.register("travel_cost")}
          />
        </div>
      )}

      {/* Deposit (only on create) */}
      {!initialData?.id && (
        <div className="space-y-3 p-3 rounded-xl border border-border/60 bg-muted/30">
          <div className="flex items-center space-x-2">
            <Switch
              id="charge_deposit"
              checked={chargeDeposit}
              onCheckedChange={setChargeDeposit}
            />
            <Label htmlFor="charge_deposit" className="text-sm font-medium">Cobrar entrada</Label>
          </div>
          {chargeDeposit && (
            <div className="space-y-1">
              <Label htmlFor="deposit_amount" className="text-xs">Valor da entrada (R$) *</Label>
              <Input
                id="deposit_amount"
                type="number"
                step="0.01"
                min="0.01"
                value={depositAmount || ""}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                placeholder="Digite o valor"
                className="h-10 rounded-lg"
              />
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
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
          {saving ? "Salvando..." : (initialData?.id ? "Atualizar" : "Salvar")}
        </Button>
      </div>
    </form>
  )
}
