"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
import { ChevronLeft, ChevronRight } from "lucide-react"

function formatLocalDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
}

const HOUR_SLOTS = Array.from({ length: 17 }, (_, i) => i + 7)

interface AppointmentFormProps {
  patients: { id: string; full_name: string; phone?: string }[]
  initialData?: any
  onSuccess?: () => void
  onCancel?: () => void
}

const selectClass = (hasError?: boolean) =>
  `flex w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${hasError ? "border-destructive" : ""}`

const optionClass = "text-foreground bg-background"

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
  const watchPatientId = useWatch({ control: form.control, name: "patient_id" })
  const watchStatus = useWatch({ control: form.control, name: "status" })
  const watchScheduledAt = useWatch({ control: form.control, name: "scheduled_at" }) as string

  const scheduledDate = watchScheduledAt?.slice(0, 10) || ""
  const scheduledTime = watchScheduledAt?.slice(11, 16) || ""

  const initialSelected = scheduledDate ? new Date(scheduledDate) : new Date()
  const [calYear, setCalYear] = useState(initialSelected.getFullYear())
  const [calMonth, setCalMonth] = useState(initialSelected.getMonth())

  const selectedDateObj = scheduledDate ? new Date(scheduledDate) : null
  const calDays = getDaysInMonth(calYear, calMonth)
  const calFirstDay = getFirstDayOfMonth(calYear, calMonth)

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
    else setCalMonth(calMonth - 1)
  }

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
    else setCalMonth(calMonth + 1)
  }

  const selectDay = (day: number) => {
    const pad = (n: number) => String(n).padStart(2, "0")
    const date = `${calYear}-${pad(calMonth + 1)}-${pad(day)}`
    form.setValue("scheduled_at", `${date}T${scheduledTime || "09:00"}`)
  }

  const selectHour = (hour: number) => {
    const pad = (n: number) => String(n).padStart(2, "0")
    const time = `${pad(hour)}:00`
    const date = scheduledDate || (() => {
      const d = new Date()
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    })()
    form.setValue("scheduled_at", `${date}T${time}`)
  }

  const commissionAmount = useMemo(
    () => Number(watchTotalCost) * (Number(watchCommissionPercent) / 100),
    [watchTotalCost, watchCommissionPercent]
  )

  const selectedService = useMemo(() => services.find(s => s.id === watchServiceType), [services, watchServiceType])

  const onSubmit = useCallback(async (data: AppointmentCreateFormValues) => {
    setSaving(true)
    const { commission_percent: _cp, commission_amount: _ca, ...dataWithoutCommission } = data as any
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
    onSuccess?.()
  }, [initialData, chargeDeposit, depositAmount, onSuccess])

  const handleServiceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
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
  }, [services, initialData, form])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
      {/* Patient */}
      <div className="space-y-2">
        <Label htmlFor="patient_id">Paciente *</Label>
        <select
          id="patient_id"
          value={watchPatientId || ""}
          onChange={(e) => form.setValue("patient_id", e.target.value)}
          className={selectClass(!!form.formState.errors.patient_id)}
        >
          <option value="" className={optionClass}>Selecione o paciente</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id} className={optionClass}>{p.full_name}</option>
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
          value={watchServiceType || ""}
          onChange={handleServiceChange}
          className={selectClass(!!form.formState.errors.service_type)}
        >
          <option value="" className={optionClass}>Selecione o serviço</option>
          {services.map((svc) => (
            <option key={svc.id} value={svc.id} className={optionClass}>{svc.name} ({svc.duration_minutes}min)</option>
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

      {/* Date + Time + Duration */}
      <div className="space-y-2">
        <Label>Data e Hora *</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/60 bg-card p-3">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold">{MONTHS[calMonth]} {calYear}</p>
              <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0 mb-1">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-0.5">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0">
              {Array.from({ length: calFirstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: calDays }).map((_, i) => {
                const day = i + 1
                const date = new Date(calYear, calMonth, day)
                const isSelected = selectedDateObj && isSameDay(date, selectedDateObj)
                const isToday = isSameDay(date, new Date())
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => selectDay(day)}
                    className={`h-9 w-full flex items-center justify-center text-sm rounded-lg transition-all duration-150 ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : isToday
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted/60"
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Escolha o horário</p>
            <div className="grid grid-cols-5 gap-1.5">
              {HOUR_SLOTS.map((hour) => {
                const time = `${String(hour).padStart(2, "0")}:00`
                const active = scheduledTime === time
                return (
                  <button
                    type="button"
                    key={hour}
                    onClick={() => selectHour(hour)}
                    className={`h-9 rounded-lg text-xs font-medium border transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "border-border/60 text-foreground hover:bg-muted/60"
                    }`}
                  >
                    {time}
                  </button>
                )
              })}
            </div>
            {selectedDateObj && (
              <p className="mt-3 text-xs font-semibold text-foreground">
                {selectedDateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} às {scheduledTime || "—"}
              </p>
            )}
          </div>
        </div>
        {form.formState.errors.scheduled_at && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.scheduled_at.message}</p>
        )}
      </div>

      {/* Duration */}
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

      {/* Status + Home Visit */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={watchStatus || "scheduled"}
            onChange={(e) => form.setValue("status", e.target.value as AppointmentCreateFormValues["status"])}
            className={selectClass()}
          >
            <option value="scheduled" className={optionClass}>Agendado</option>
            <option value="confirmed" className={optionClass}>Confirmado</option>
            <option value="completed" className={optionClass}>Concluído</option>
            <option value="cancelled" className={optionClass}>Cancelado</option>
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