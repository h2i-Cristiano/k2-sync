"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { createAnamnese } from "@/lib/actions/anamnese.actions"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const anamneseDataSchema = z.object({
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  occupation: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  
  allergies: z.string().optional(),
  medications: z.string().optional(),
  medical_conditions: z.string().optional(),
  previous_surgeries: z.string().optional(),
  pregnant: z.string().optional(),
  pregnancy_weeks: z.string().optional(),

  smokes: z.string().optional(),
  drinks: z.string().optional(),
  exercise_frequency: z.string().optional(),
  sleep_quality: z.string().optional(),
  stress_level: z.string().optional(),
  diet: z.string().optional(),

  chief_complaint: z.string().optional(),
  pain_location: z.string().optional(),
  pain_intensity: z.string().optional(),
  pain_frequency: z.string().optional(),
  pain_duration: z.string().optional(),
  previous_treatments: z.string().optional(),

  expectations: z.string().optional(),
  consent_treatment: z.boolean().refine(val => val === true, "Você deve consentir com o tratamento"),
  consent_data: z.boolean().refine(val => val === true, "Você deve autorizar o uso de dados"),
})

const steps = [
  "Identificação",
  "Saúde",
  "Hábitos",
  "Queixa Principal",
  "Expectativas",
]

type AnamneseDataValues = z.infer<typeof anamneseDataSchema>

interface AnamneseFormProps {
  patientId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function AnamneseForm({ patientId, onSuccess, onCancel }: AnamneseFormProps) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const form = useForm<AnamneseDataValues>({
    resolver: zodResolver(anamneseDataSchema),
    defaultValues: {
      birth_date: "",
      gender: "",
      marital_status: "",
      occupation: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      allergies: "",
      medications: "",
      medical_conditions: "",
      previous_surgeries: "",
      pregnant: "",
      pregnancy_weeks: "",
      smokes: "",
      drinks: "",
      exercise_frequency: "",
      sleep_quality: "",
      stress_level: "",
      diet: "",
      chief_complaint: "",
      pain_location: "",
      pain_intensity: "",
      pain_frequency: "",
      pain_duration: "",
      previous_treatments: "",
      expectations: "",
      consent_treatment: false,
      consent_data: false,
    },
  })

  async function onSubmit(data: AnamneseDataValues) {
    setSaving(true)
    try {
      await createAnamnese({
        patient_id: patientId,
        form_type: "general",
        data: data,
        status: "completed",
      })
      toast.success("Anamnese salva com sucesso!")
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar anamnese")
    } finally {
      setSaving(false)
    }
  }

  const nextStep = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate: any[] = []
    if (step === 0) fieldsToValidate = ["birth_date", "gender", "marital_status", "occupation", "emergency_contact_name", "emergency_contact_phone"]
    if (step === 1) fieldsToValidate = ["allergies", "medications", "medical_conditions", "previous_surgeries", "pregnant", "pregnancy_weeks"]
    if (step === 2) fieldsToValidate = ["smokes", "drinks", "exercise_frequency", "sleep_quality", "stress_level", "diet"]
    if (step === 3) fieldsToValidate = ["chief_complaint", "pain_location", "pain_intensity", "pain_frequency", "pain_duration", "previous_treatments"]
    
    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) setStep(s => Math.min(steps.length - 1, s + 1))
  }

  const prevStep = () => setStep(s => Math.max(0, s - 1))

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Passo {step + 1} de {steps.length}: <span className="text-foreground">{steps[step]}</span>
        </p>
      </div>

      <div className="min-h-[400px]">
        {/* Step 1 - Identificação */}
        {step === 0 && (
          <Card className="border-none shadow-sm bg-card animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle>Dados de Identificação</CardTitle>
              <CardDescription>Informações básicas para compor o histórico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input type="date" {...form.register("birth_date")} />
                </div>
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <Select onValueChange={(val: any) => form.setValue("gender", val)} defaultValue={form.getValues("gender") ?? undefined}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="O">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado Civil</Label>
                  <Input placeholder="Solteiro, Casado..." {...form.register("marital_status")} />
                </div>
                <div className="space-y-2">
                  <Label>Profissão</Label>
                  <Input placeholder="Enfermeiro, Engenheiro..." {...form.register("occupation")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contato de Emergência</Label>
                  <Input placeholder="Nome" {...form.register("emergency_contact_name")} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone de Emergência</Label>
                  <Input placeholder="(11) 99999-9999" {...form.register("emergency_contact_phone")} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 - Saúde */}
        {step === 1 && (
          <Card className="border-none shadow-sm bg-card animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle>Histórico de Saúde</CardTitle>
              <CardDescription>Alergias, condições crônicas e histórico médico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Alergias conhecidas</Label>
                <Input placeholder="Lactose, Dipirona, Nenhuma..." {...form.register("allergies")} />
              </div>
              <div className="space-y-2">
                <Label>Medicações em uso contínuo</Label>
                <Input placeholder="Losartana, Metformina..." {...form.register("medications")} />
              </div>
              <div className="space-y-2">
                <Label>Doenças diagnosticadas</Label>
                <Input placeholder="Diabetes, Hipertensão..." {...form.register("medical_conditions")} />
              </div>
              <div className="space-y-2">
                <Label>Cirurgias anteriores</Label>
                <Input placeholder="Apendicite, Cesárea..." {...form.register("previous_surgeries")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Está grávida?</Label>
                  <Select onValueChange={(val: any) => form.setValue("pregnant", val)} defaultValue={form.getValues("pregnant")}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Não</SelectItem>
                      <SelectItem value="yes">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.watch("pregnant") === "yes" && (
                  <div className="space-y-2 animate-in fade-in">
                    <Label>Semanas de gestação</Label>
                    <Input type="number" placeholder="Ex: 20" {...form.register("pregnancy_weeks")} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 - Hábitos */}
        {step === 2 && (
          <Card className="border-none shadow-sm bg-card animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle>Hábitos e Estilo de Vida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fuma?</Label>
                  <Select onValueChange={(val: any) => form.setValue("smokes", val)} defaultValue={form.getValues("smokes")}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Não</SelectItem>
                      <SelectItem value="yes">Sim</SelectItem>
                      <SelectItem value="quit">Ex-fumante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Consome álcool?</Label>
                  <Select onValueChange={(val: any) => form.setValue("drinks", val)} defaultValue={form.getValues("drinks")}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Não</SelectItem>
                      <SelectItem value="social">Socialmente</SelectItem>
                      <SelectItem value="regular">Regularmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Frequência de exercícios físicos</Label>
                <Select onValueChange={(val: any) => form.setValue("exercise_frequency", val)} defaultValue={form.getValues("exercise_frequency")}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nunca</SelectItem>
                    <SelectItem value="rarely">Raramente</SelectItem>
                    <SelectItem value="sometimes">Às vezes</SelectItem>
                    <SelectItem value="regular">Regularmente</SelectItem>
                    <SelectItem value="daily">Diariamente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Qualidade do sono</Label>
                <Select onValueChange={(val: any) => form.setValue("sleep_quality", val)} defaultValue={form.getValues("sleep_quality")}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Ótima</SelectItem>
                    <SelectItem value="good">Boa</SelectItem>
                    <SelectItem value="fair">Regular</SelectItem>
                    <SelectItem value="poor">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nível de estresse</Label>
                <Select onValueChange={(val: any) => form.setValue("stress_level", val)} defaultValue={form.getValues("stress_level")}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="moderate">Moderado</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="very_high">Muito Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alimentação</Label>
                <Input placeholder="Balanceada, Carnívora, Vegetariana..." {...form.register("diet")} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4 - Queixa Principal */}
        {step === 3 && (
          <Card className="border-none shadow-sm bg-card animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle>Queixa Principal</CardTitle>
              <CardDescription>Motivo principal da consulta atual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Motivo da consulta</Label>
                <Input placeholder="Descreva o motivo principal..." {...form.register("chief_complaint")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Localização da dor (se houver)</Label>
                  <Input placeholder="Coluna, Ombro, Joelho..." {...form.register("pain_location")} />
                </div>
                <div className="space-y-2">
                  <Label>Intensidade da dor (1-10)</Label>
                  <Input type="number" min="1" max="10" placeholder="5" {...form.register("pain_intensity")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequência da dor</Label>
                  <Select onValueChange={(val: any) => form.setValue("pain_frequency", val)} defaultValue={form.getValues("pain_frequency")}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="constant">Constante</SelectItem>
                      <SelectItem value="frequent">Frequente</SelectItem>
                      <SelectItem value="occasional">Ocasional</SelectItem>
                      <SelectItem value="rare">Rara</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duração do problema</Label>
                  <Input placeholder="3 meses, 2 anos..." {...form.register("pain_duration")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tratamentos anteriores realizados</Label>
                <Input placeholder="Fisioterapia, Acupuntura..." {...form.register("previous_treatments")} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5 - Expectativas */}
        {step === 4 && (
          <Card className="border-none shadow-sm bg-card animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle>Expectativas e Consentimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>O que você espera do tratamento?</Label>
                <Textarea 
                  placeholder="Redução da dor, Melhora da mobilidade..." 
                  className="min-h-[100px] resize-none"
                  {...form.register("expectations")} 
                />
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Consentimento de Tratamento</Label>
                    <p className="text-sm text-muted-foreground">Consinto com o tratamento proposto pelo profissional.</p>
                  </div>
                  <Switch 
                    checked={form.watch("consent_treatment")} 
                    onCheckedChange={(checked) => form.setValue("consent_treatment", checked, { shouldValidate: true })} 
                  />
                </div>
                {form.formState.errors.consent_treatment && (
                  <p className="text-sm font-medium text-destructive mt-1 px-1">{form.formState.errors.consent_treatment.message}</p>
                )}

                <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Privacidade e LGPD</Label>
                    <p className="text-sm text-muted-foreground">Autorizo o uso dos meus dados conforme a LGPD.</p>
                  </div>
                  <Switch 
                    checked={form.watch("consent_data")} 
                    onCheckedChange={(checked) => form.setValue("consent_data", checked, { shouldValidate: true })} 
                  />
                </div>
                {form.formState.errors.consent_data && (
                  <p className="text-sm font-medium text-destructive mt-1 px-1">{form.formState.errors.consent_data.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-between border-t pt-4">
        {step === 0 ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={prevStep}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        )}

        {step < steps.length - 1 ? (
          <Button type="button" onClick={nextStep}>
            Próximo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar Anamnese"}
            {!saving && <Check className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </div>
    </form>
  )
}
