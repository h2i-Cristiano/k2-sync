"use client"

import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { AnamneseForm } from "@/components/forms/AnamneseForm"

export default function AnamnesePage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-slide-up-fade">
      <PageHeader
        title="Anamnese Digital"
        description="Preencha o formulário para registrar o histórico clínico."
        back
        onBack={() => router.back()}
      />

      <AnamneseForm
        patientId={patientId}
        onSuccess={() => router.push(`/patients/${patientId}`)}
        onCancel={() => router.back()}
      />
    </div>
  )
}