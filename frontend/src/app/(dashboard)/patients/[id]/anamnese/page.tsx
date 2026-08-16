"use client"

import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { AnamneseForm } from "@/components/forms/AnamneseForm"
import { AnamneseDataValues } from "@/lib/validations/anamnese"
import { useEffect, useState } from "react"
import { getAnamneseById } from "@/lib/actions/anamnese.actions"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnamnesePage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string
  const [anamnese, setAnamnese] = useState<{ id: string; data: AnamneseDataValues } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnamnese() {
      const result = await getAnamneseById(patientId)
      if (result.data) {
        setAnamnese({ id: result.data.id, data: result.data.data })
      }
      setLoading(false)
    }
    loadAnamnese()
  }, [patientId])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 animate-slide-up-fade">
        <PageHeader title="Anamnese Digital" description="Carregando..." back onBack={() => router.back()} />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-slide-up-fade">
      <PageHeader
        title="Anamnese Digital"
        description={anamnese ? "Histórico clínico registrado." : "Preencha o formulário para registrar o histórico clínico."}
        back
        onBack={() => router.back()}
      />

      <AnamneseForm
        patientId={patientId}
        anamneseId={anamnese?.id}
        initialData={anamnese?.data}
        onSuccess={() => {}}
        onCancel={() => router.back()}
      />
    </div>
  )
}