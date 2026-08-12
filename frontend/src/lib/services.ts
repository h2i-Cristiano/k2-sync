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
  { name: "Massagem relaxante", label: "Massagem relaxante", color: "#3B82F6", duration_minutes: 60, defaultDuration: 60, price: 140, defaultPrice: 140, commission_percent: 0, active: true },
  { name: "Drenagem", label: "Drenagem", color: "#10B981", duration_minutes: 60, defaultDuration: 60, price: 160, defaultPrice: 160, commission_percent: 0, active: true },
  { name: "Depilação", label: "Depilação", color: "#EC4899", duration_minutes: 60, defaultDuration: 60, price: 130, defaultPrice: 130, commission_percent: 0, active: true },
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
