export interface ServiceDef {
  id: string
  label: string
  color: string
  bgLight: string
  textDark: string
  defaultDuration: number
  defaultPrice: number
}

export const SERVICES: ServiceDef[] = [
  { id: "massoterapia", label: "Massoterapia", color: "#3B82F6", bgLight: "bg-blue-100", textDark: "text-blue-700", defaultDuration: 60, defaultPrice: 180 },
  { id: "estetica-facial", label: "Estética Facial", color: "#EC4899", bgLight: "bg-pink-100", textDark: "text-pink-700", defaultDuration: 45, defaultPrice: 200 },
  { id: "estetica-corp", label: "Estética Corporal", color: "#8B5CF6", bgLight: "bg-violet-100", textDark: "text-violet-700", defaultDuration: 60, defaultPrice: 250 },
  { id: "fisioterapia", label: "Fisioterapia", color: "#10B981", bgLight: "bg-emerald-100", textDark: "text-emerald-700", defaultDuration: 50, defaultPrice: 160 },
  { id: "quiropraxia", label: "Quiropraxia", color: "#F97316", bgLight: "bg-orange-100", textDark: "text-orange-700", defaultDuration: 40, defaultPrice: 170 },
  { id: "acupuntura", label: "Acupuntura", color: "#EF4444", bgLight: "bg-red-100", textDark: "text-red-700", defaultDuration: 45, defaultPrice: 150 },
  { id: "spa", label: "Spa / Bem-estar", color: "#B89A63", bgLight: "bg-amber-100", textDark: "text-amber-700", defaultDuration: 90, defaultPrice: 350 },
  { id: "danca", label: "Dança", color: "#06B6D4", bgLight: "bg-cyan-100", textDark: "text-cyan-700", defaultDuration: 60, defaultPrice: 120 },
  { id: "personal", label: "Personal Training", color: "#059669", bgLight: "bg-green-100", textDark: "text-green-700", defaultDuration: 60, defaultPrice: 200 },
  { id: "outro", label: "Outro", color: "#6B7280", bgLight: "bg-gray-100", textDark: "text-gray-700", defaultDuration: 60, defaultPrice: 0 },
]

export function getServiceById(id: string): ServiceDef | undefined {
  return SERVICES.find(s => s.id === id)
}

export function getServiceColor(id: string): string {
  return getServiceById(id)?.color ?? "#6B7280"
}
