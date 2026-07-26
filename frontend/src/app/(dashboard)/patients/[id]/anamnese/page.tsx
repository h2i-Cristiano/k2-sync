"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { AnamneseForm } from "@/components/forms/AnamneseForm"

export default function AnamnesePage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anamnese Digital</h1>
          <p className="text-muted-foreground text-sm mt-1">Preencha o formulário para registrar o histórico clínico.</p>
        </div>
      </div>

      <AnamneseForm 
        patientId={patientId} 
        onSuccess={() => router.push(`/patients/${patientId}`)} 
        onCancel={() => router.back()} 
      />
    </div>
  )
}
