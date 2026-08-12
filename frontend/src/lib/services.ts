import { createClient } from "@/lib/supabase/client"

export interface ServiceDef {
  id: string
  name: string
  label: string
  color: string
  duration_minutes: number
  defaultDuration: number
  price: number
  defaultPrice: number
  commission_percent: number
  active: boolean
}

// Fallback services (used when DB is empty or as seed reference)
export const DEFAULT_SERVICES: Omit<ServiceDef, "id">[] = [
  { name: "Massoterapia", label: "Massoterapia", color: "#3B82F6", duration_minutes: 60, defaultDuration: 60, price: 180, defaultPrice: 180, commission_percent: 0, active: true },
  { name: "Estética Facial", label: "Estética Facial", color: "#EC4899", duration_minutes: 45, defaultDuration: 45, price: 200, defaultPrice: 200, commission_percent: 0, active: true },
  { name: "Estética Corporal", label: "Estética Corporal", color: "#8B5CF6", duration_minutes: 60, defaultDuration: 60, price: 250, defaultPrice: 250, commission_percent: 0, active: true },
  { name: "Fisioterapia", label: "Fisioterapia", color: "#10B981", duration_minutes: 50, defaultDuration: 50, price: 160, defaultPrice: 160, commission_percent: 0, active: true },
  { name: "Quiropraxia", label: "Quiropraxia", color: "#F97316", duration_minutes: 40, defaultDuration: 40, price: 170, defaultPrice: 170, commission_percent: 0, active: true },
  { name: "Acupuntura", label: "Acupuntura", color: "#EF4444", duration_minutes: 45, defaultDuration: 45, price: 150, defaultPrice: 150, commission_percent: 0, active: true },
  { name: "Spa / Bem-estar", label: "Spa / Bem-estar", color: "#B89A63", duration_minutes: 90, defaultDuration: 90, price: 350, defaultPrice: 350, commission_percent: 0, active: true },
  { name: "Dança", label: "Dança", color: "#06B6D4", duration_minutes: 60, defaultDuration: 60, price: 120, defaultPrice: 120, commission_percent: 0, active: true },
  { name: "Personal Training", label: "Personal Training", color: "#059669", duration_minutes: 60, defaultDuration: 60, price: 200, defaultPrice: 200, commission_percent: 0, active: true },
  { name: "Outro", label: "Outro", color: "#6B7280", duration_minutes: 60, defaultDuration: 60, price: 0, defaultPrice: 0, commission_percent: 0, active: true },
]

export async function fetchServices(): Promise<ServiceDef[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (error || !data || data.length === 0) {
      return DEFAULT_SERVICES.map((s, i) => ({ ...s, id: `default-${i}` }))
    }

    return data.map(s => ({
      ...s,
      label: s.name,
      defaultDuration: s.duration_minutes,
      defaultPrice: s.price,
    }))
  } catch {
    return DEFAULT_SERVICES.map((s, i) => ({ ...s, id: `default-${i}` }))
  }
}

export function getServiceById(services: ServiceDef[], id: string): ServiceDef | undefined {
  return services.find(s => s.id === id)
}

export function getServiceColor(services: ServiceDef[], id: string): string {
  return getServiceById(services, id)?.color ?? "#6B7280"
}
