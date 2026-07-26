"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Calendar, ChevronLeft, ChevronRight, Clock, User, MapPin, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AppointmentForm } from "@/components/forms/AppointmentForm"
import { cn } from "@/lib/utils"

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 ring-1 ring-blue-700/10",
  confirmed: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-700/10",
  in_progress: "bg-amber-100 text-amber-700 ring-1 ring-amber-700/10",
  completed: "bg-slate-100 text-slate-700 ring-1 ring-slate-700/10",
  cancelled: "bg-rose-100 text-rose-700 ring-1 ring-rose-700/10",
  no_show: "bg-purple-100 text-purple-700 ring-1 ring-purple-700/10",
}

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu",
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const supabase = createClient()

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    const startOfDay = new Date(selectedDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from("appointments")
      .select("*, patients(full_name, phone)")
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString())
      .order("scheduled_at", { ascending: true })

    setAppointments(data || [])
    setLoading(false)
  }, [supabase, selectedDate])

  const fetchPatients = useCallback(async () => {
    const { data } = await supabase.from("patients").select("id, full_name").order("full_name")
    setPatients(data || [])
  }, [supabase])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const changeDay = (offset: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + offset)
    setSelectedDate(newDate)
  }

  const setToday = () => {
    setSelectedDate(new Date())
  }

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const isToday = (d: Date) => {
    const today = new Date()
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus compromissos e pacientes.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditingAppointment(null) }}>
          <DialogTrigger render={<Button className="shadow-sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
            </DialogHeader>
            <AppointmentForm 
              patients={patients}
              initialData={editingAppointment}
              onSuccess={() => {
                setIsOpen(false)
                setEditingAppointment(null)
                fetchAppointments()
              }} 
              onCancel={() => { setIsOpen(false); setEditingAppointment(null) }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Navigator */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-card p-4 rounded-2xl border shadow-sm gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <Button variant="outline" size="icon" onClick={() => changeDay(-1)} className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={setToday}
            className={cn("font-medium", isToday(selectedDate) && "text-primary bg-primary/10")}
          >
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => changeDay(1)} className="rounded-full">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="text-center sm:text-right">
          <p className="text-lg font-semibold capitalize text-foreground">{formatDate(selectedDate)}</p>
          <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-end gap-1.5 mt-0.5">
            <Calendar className="h-3.5 w-3.5" />
            {appointments.length} agendamento(s)
          </p>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p>Carregando agenda...</p>
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed flex flex-col items-center justify-center shadow-sm">
          <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Dia Livre</h3>
          <p className="text-muted-foreground mb-6">Nenhum agendamento marcado para esta data.</p>
          <Button variant="outline" onClick={() => setIsOpen(true)}>
            Agendar Agora
          </Button>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {appointments.map((apt) => {
            const timeString = new Date(apt.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            return (
              <div key={apt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Timeline dot */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                  <Clock className="h-4 w-4 text-primary-foreground" />
                </div>
                
                <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] shadow-sm hover:shadow-md transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm group-hover:bg-card">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">{timeString}</span>
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{apt.duration_minutes}min</span>
                        </div>
                        <p className="font-semibold text-lg flex items-center gap-1.5">
                          {apt.patients?.full_name || "Paciente Removido"}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${statusColors[apt.status] || ""}`}>
                        {statusLabels[apt.status] || apt.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground pt-3 border-t">
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4 shrink-0" />
                        <span className="truncate">{apt.service_type}</span>
                      </div>
                      {apt.is_home_visit && (
                        <div className="flex items-center gap-1.5 text-amber-600">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="truncate font-medium">Domiciliar</span>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => { setEditingAppointment(apt); setIsOpen(true) }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Editar
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
