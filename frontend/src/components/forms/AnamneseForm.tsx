"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { anamneseDataSchema, AnamneseDataValues } from "@/lib/validations/anamnese"
import { createAnamnese } from "@/lib/actions/anamnese.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Check, Camera, Shield } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { SignaturePad } from "@/components/ui/signature-pad"
import { Separator } from "@/components/ui/separator"

const steps = [
  "Queixa Principal",
  "Saúde",
  "Hábitos",
  "Expectativas",
  "Consentimento LGPD",
]

const LGPD_TERMS = `TERMO DE CONSENTIMENTO E PRIVACIDADE – LEI GERAL DE PROTEÇÃO DE DADOS (LGPD)

1. IDENTIFICAÇÃO DO RESPONSÁVEL
Studio Kamke, por Michele Kamke, inscrita no CNPJ sob o n [XX.XXX.XXX/XXXX-XX], doravante denominada "Estúdio", e responsável pelo tratamento dos seus dados pessoais, em conformidade com a Lei n 13.709/2018 (LGPD).

2. FINALIDADE DO TRATAMENTO
Os dados pessoais e dados sensíveis de saúde coletados neste formulário de anamnese serão utilizados exclusivamente para:
– Prestação de serviços de saúde, estética e bem-estar;
– Elaboração de plano de tratamento personalizado;
– Acompanhamento e evolução do tratamento;
– Cumprimento de obrigações legais e regulatoriais.

3. DADOS COLETADOS
Podemos coletar os seguintes dados:
– Dados pessoais: nome, CPF, telefone, e-mail, endereço, data de nascimento, estado civil, profissão;
– Dados de saúde: alergias, medicações, condições médicas, cirurgias anteriores, hábitos de vida, queixa principal;
– Dados sensíveis: condições de saúde específicas, gestação;
– Imagem: fotografias e vídeos capturados durante os serviços, quando autorizados.

4. BASE LEGAL
O tratamento dos seus dados é realizado com base no seu consentimento (Art. 7º, I e Art. 11, I da LGPD), de forma livre, informada e inequívoca.

5. DIREITOS DO TITULAR
Nos termos da LGPD, você tem direito a:
– Acesso aos seus dados pessoais armazenados;
– Correção de dados incompletos ou desatualizados;
– Anonimização, bloqueio ou eliminação de dados desnecessários;
– Portabilidade dos dados a outro fornecedor;
– Eliminação dos dados tratados com consentimento;
– Informação sobre compartilhamento de dados;
– Revogação do consentimento a qualquer momento.

6. RETENÇÃO DOS DADOS
Os seus dados serão mantidos pelo período necessário para cumprir as finalidades para as quais foram coletados, ou pelo prazo determinado pela legislação aplicável, o que ocorrer primeiro.

7. COMPARTILHAMENTO DE DADOS
Seus dados poderão ser compartilhados apenas com:
– Profissionais de saúde diretamente envolvidos no seu tratamento;
– Laboratórios e convênios, quando necessário para a prestação do serviço;
– Autoridades competentes, quando exigido por lei.

8. SEGURANÇA DOS DADOS
Adotamos medidas técnicas e administrativas aptas a proteger os seus dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou qualquer forma de tratamento inadequado ou ilícito.

9. COOKIES E RASTREAMENTO
Este formulário não utiliza cookies ou ferramentas de rastreamento para coleta de dados.

10. CONTATO PARA EXERCÍCIO DE DIREITOS
Para exercer qualquer um dos direitos acima, entre em contato:
– E-mail: contato@studiokamke.com.br
– Telefone: (XX) 98884-5326
– Responsável: Michele Kamke

11. ALTERAÇÕES DESTA POLÍTICA
Esta política pode ser atualizada a qualquer momento. Recomendamos a consulta periódica.

Ao assinar este documento, você declara que leu, compreendeu e consentiu com o tratamento dos seus dados pessoais conforme descrito acima.`

const MARKETING_TERMS = `TERMO DE CONSENTIMENTO PARA USO DE IMAGEM E DEPOIMENTOS

1. CONTROLADOR DOS DADOS
Studio Kamke, por Michele Kamke, telefone: (XX) 98884-5326.

2. FINALIDADE ESPECÍFICA
Autorizo o uso da minha imagem (fotografias e/ou vídeos) e do meu depoimento (escrito ou gravado) para as seguintes finalidades:
– Publicação em site oficial (studiokamke.com.br);
– Publicação em redes sociais (Instagram, Facebook, TikTok e afins);
– Materiais de marketing impressos (cartazes, folders, banners);
– Anúncios pagos em plataformas digitais;
– Apresentações e eventos promovidos pelo Estúdio.

3. DADOS PESSOAIS ENVOLVIDOS
– Imagem fotográfica e/ou vídeo que contenham minha imagem e/ou voz;
– Nome completo;
– Depoimento (texto ou áudio/vídeo).

4. CANAIS DE DIVULGAÇÃO
Os dados acima poderão ser utilizados nos seguintes canais: site oficial, redes sociais oficiais do Estúdio, materiais impressos e anúncios digitais promovidos pelo Estúdio.

5. PRAZO DE UTILIZAÇÃO
O consentimento é válido pelo prazo de 2 (dois) anos, podendo ser renovado mediante novo consentimento expresso.

6. DIREITO DE REVOGAÇÃO
A qualquer momento, você poderá solicitar a remoção da sua imagem e/ou depoimento de qualquer canal, bastando entrar em contato com o Estúdio. A revogação não afetará o tratamento realizado anteriormente.

7. COMPARTILHAMENTO
Os dados de imagem e depoimento não serão compartilhados com terceiros, exceto quando necessário para a veiculação nos canais de divulgação acima listados.

8. SEGURANÇA
Adotamos medidas para proteger sua imagem e dados contra uso indevido por terceiros não autorizados.

9. CONTATO
Studio Kamke – Por Michele Kamke
Telefone: (XX) 98884-5326
E-mail: contato@studiokamke.com.br`

interface AnamneseFormProps {
  patientId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function AnamneseForm({ patientId, onSuccess, onCancel }: AnamneseFormProps) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [signatureData, setSignatureData] = useState<{ signatureImage: string; typedName?: string; timestamp: string } | null>(null)
  const [photoData, setPhotoData] = useState<{ image: string; timestamp: string } | null>(null)
  const [photoStream, setPhotoStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showCamera, setShowCamera] = useState(false)

  const form = useForm<AnamneseDataValues>({
    resolver: zodResolver(anamneseDataSchema),
    defaultValues: {
      chief_complaint: "",
      pain_location: "",
      pain_intensity: "",
      pain_frequency: "",
      pain_duration: "",
      previous_treatments: "",
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
      expectations: "",
      consent_name: "",
      consent_cpf: "",
      consent_signature_image: "",
      consent_signature_typed_name: "",
      consent_signature_timestamp: "",
      consent_photo: "",
      consent_photo_timestamp: "",
      consent_lgpd_accepted: false,
      consent_marketing_accepted: false,
    },
  })

  useEffect(() => {
    return () => {
      if (photoStream) {
        photoStream.getTracks().forEach(t => t.stop())
      }
    }
  }, [photoStream])

  async function onSubmit(data: AnamneseDataValues) {
    setSaving(true)
    const submissionData = {
      ...data,
      consent_signature_image: signatureData?.signatureImage || "",
      consent_signature_typed_name: signatureData?.typedName || "",
      consent_signature_timestamp: signatureData?.timestamp || "",
      consent_photo: photoData?.image || "",
      consent_photo_timestamp: photoData?.timestamp || "",
    }
    const result = await createAnamnese({
      patient_id: patientId,
      form_type: "general",
      data: submissionData,
      status: "completed",
    })
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Anamnese salva com sucesso!")
    onSuccess?.()
  }

  const nextStep = async () => {
    let fieldsToValidate: any[] = []
    if (step === 0) fieldsToValidate = ["chief_complaint", "pain_location", "pain_intensity", "pain_frequency", "pain_duration", "previous_treatments"]
    if (step === 1) fieldsToValidate = ["allergies", "medications", "medical_conditions", "previous_surgeries", "pregnant", "pregnancy_weeks"]
    if (step === 2) fieldsToValidate = ["smokes", "drinks", "exercise_frequency", "sleep_quality", "stress_level", "diet"]
    if (step === 3) fieldsToValidate = ["expectations"]
    if (step === 4) {
      fieldsToValidate = ["consent_name", "consent_cpf", "consent_lgpd_accepted"]
      const isValid = await form.trigger(fieldsToValidate)
      if (!signatureData) {
        toast.error("Assine o documento para continuar")
        return
      }
      if (isValid) {
        setStep(s => Math.min(steps.length - 1, s + 1))
      }
      return
    }

    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) setStep(s => Math.min(steps.length - 1, s + 1))
  }

  const prevStep = () => setStep(s => Math.max(0, s - 1))

  const handlePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 240 },
      })
      setPhotoStream(stream)
      setShowCamera(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      toast.error("Não foi possível acessar a câmera")
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement("canvas")
    canvas.width = 320
    canvas.height = 240
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(videoRef.current, 0, 0, 320, 240)

    const now = new Date()
    const stamp = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR")

    ctx.fillStyle = "rgba(0,0,0,0.6)"
    ctx.fillRect(0, 200, 320, 40)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 14px monospace"
    ctx.fillText(stamp, 10, 225)

    const image = canvas.toDataURL("image/jpeg", 0.8)
    setPhotoData({ image, timestamp: now.toISOString() })
    setShowCamera(false)
    photoStream?.getTracks().forEach(t => t.stop())
    setPhotoStream(null)
  }

  const cancelCamera = () => {
    setShowCamera(false)
    photoStream?.getTracks().forEach(t => t.stop())
    setPhotoStream(null)
  }

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
        {/* Step 0 - Queixa Principal */}
        {step === 0 && (
          <Card className="border-none shadow-sm bg-card animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle>Queixa Principal</CardTitle>
              <CardDescription>Motivo principal da consulta atual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Motivo da consulta *</Label>
                <Input placeholder="Descreva o motivo principal..." {...form.register("chief_complaint")} />
                {form.formState.errors.chief_complaint && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.chief_complaint.message}</p>
                )}
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
                  <Select onValueChange={(val: string | null) => { if (val) form.setValue("pain_frequency", val) }} defaultValue={form.getValues("pain_frequency") ?? undefined}>
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

        {/* Step 1 - Saúde */}
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
                  <Select onValueChange={(val: string | null) => { if (val) form.setValue("pregnant", val) }} defaultValue={form.getValues("pregnant") ?? undefined}>
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

        {/* Step 2 - Hábitos */}
        {step === 2 && (
          <Card className="border-none shadow-sm bg-card animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle>Hábitos e Estilo de Vida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fuma?</Label>
                  <Select onValueChange={(val: string | null) => { if (val) form.setValue("smokes", val) }} defaultValue={form.getValues("smokes") ?? undefined}>
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
                  <Select onValueChange={(val: string | null) => { if (val) form.setValue("drinks", val) }} defaultValue={form.getValues("drinks") ?? undefined}>
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
                <Select onValueChange={(val: string | null) => { if (val) form.setValue("exercise_frequency", val) }} defaultValue={form.getValues("exercise_frequency") ?? undefined}>
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
                <Select onValueChange={(val: string | null) => { if (val) form.setValue("sleep_quality", val) }} defaultValue={form.getValues("sleep_quality") ?? undefined}>
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
                <Select onValueChange={(val: string | null) => { if (val) form.setValue("stress_level", val) }} defaultValue={form.getValues("stress_level") ?? undefined}>
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

        {/* Step 3 - Expectativas */}
        {step === 3 && (
          <Card className="border-none shadow-sm bg-card animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle>Expectativas do Tratamento</CardTitle>
              <CardDescription>O que você espera alcançar com o tratamento?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Descreva suas expectativas</Label>
                <Textarea
                  placeholder="Redução da dor, Melhora da mobilidade, Bem-estar geral..."
                  className="min-h-[150px] resize-none"
                  {...form.register("expectations")}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4 - Consentimento LGPD */}
        {step === 4 && (
          <Card className="border-none shadow-sm bg-card animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Consentimento e Privacidade (LGPD)
              </CardTitle>
              <CardDescription>Leia os termos, assine e tire uma foto para validação.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* LGPD Terms */}
              <div className="rounded-xl border bg-muted/20 p-1">
                <div className="max-h-[200px] overflow-y-auto rounded-lg bg-white p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap dark:bg-white/[0.03]">
                  {LGPD_TERMS}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="consent_lgpd_read"
                  checked={form.watch("consent_lgpd_accepted")}
                  onCheckedChange={(checked) => form.setValue("consent_lgpd_accepted", checked, { shouldValidate: true })}
                />
                <Label htmlFor="consent_lgpd_read" className="text-sm font-medium">
                  Li e compreendo os termos acima
                </Label>
              </div>
              {form.formState.errors.consent_lgpd_accepted && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.consent_lgpd_accepted.message}</p>
              )}

              <Separator />

              {/* Marketing Consent */}
              <div className="rounded-xl border bg-muted/20 p-1">
                <div className="max-h-[150px] overflow-y-auto rounded-lg bg-white p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap dark:bg-white/[0.03]">
                  {MARKETING_TERMS}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="consent_marketing"
                  checked={form.watch("consent_marketing_accepted") ?? false}
                  onCheckedChange={(checked) => form.setValue("consent_marketing_accepted", checked, { shouldValidate: true })}
                />
                <Label htmlFor="consent_marketing" className="text-sm">
                  Autorizo o uso da minha imagem (fotos, vídeos) e depoimentos para finalidades de marketing e publicidade (opcional)
                </Label>
              </div>

              <Separator />

              {/* Signature Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Assinatura Digital</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      placeholder="Como deseja assinar"
                      {...form.register("consent_name")}
                      className={form.formState.errors.consent_name ? "border-destructive" : ""}
                    />
                    {form.formState.errors.consent_name && (
                      <p className="text-sm font-medium text-destructive">{form.formState.errors.consent_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>CPF *</Label>
                    <Input
                      placeholder="000.000.000-00"
                      maxLength={14}
                      {...form.register("consent_cpf")}
                      className={form.formState.errors.consent_cpf ? "border-destructive" : ""}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "")
                        if (v.length > 11) v = v.slice(0, 11)
                        if (v.length > 9) v = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9)}`
                        else if (v.length > 6) v = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`
                        else if (v.length > 3) v = `${v.slice(0,3)}.${v.slice(3)}`
                        form.setValue("consent_cpf", v)
                      }}
                    />
                    {form.formState.errors.consent_cpf && (
                      <p className="text-sm font-medium text-destructive">{form.formState.errors.consent_cpf.message}</p>
                    )}
                  </div>
                </div>

                {/* Signature Pad */}
                <div className="space-y-2">
                  <Label>Assinatura *</Label>
                  <SignaturePad
                    onSignature={(data) => setSignatureData(data)}
                  />
                  {signatureData && (
                    <p className="text-xs text-muted-foreground">
                      Assinatura capturada em {new Date(signatureData.timestamp).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Photo Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Foto com Carimbo de Data/Hora</h4>

                {!showCamera && !photoData && (
                  <Button type="button" variant="outline" onClick={handlePhoto} className="rounded-xl">
                    <Camera className="mr-2 h-4 w-4" />
                    Tirar Foto
                  </Button>
                )}

                {showCamera && (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border">
                      <video ref={videoRef} className="w-full h-auto max-h-[240px] object-cover" autoPlay playsInline muted />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={capturePhoto} className="rounded-xl flex-1">
                        Capturar
                      </Button>
                      <Button type="button" variant="outline" onClick={cancelCamera} className="rounded-xl">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {photoData && (
                  <div className="space-y-2">
                    <div className="relative inline-block rounded-xl overflow-hidden border">
                      <img src={photoData.image} alt="Foto capturada" className="max-h-[240px]" />
                    </div>
                    <div className="flex gap-2">
                      <p className="text-xs text-muted-foreground">
                        Foto capturada em {new Date(photoData.timestamp).toLocaleString("pt-BR")}
                      </p>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setPhotoData(null)} className="text-destructive">
                        Retirar Foto
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Signature Date */}
              <div className="rounded-xl bg-muted/30 p-3 text-sm text-muted-foreground">
                <strong>Data da Assinatura:</strong>{" "}
                {signatureData
                  ? new Date(signatureData.timestamp).toLocaleString("pt-BR")
                  : "Aguardando assinatura..."}
              </div>

              {/* Final Consent */}
              <div className="flex items-center space-x-2 rounded-xl border bg-muted/20 p-4">
                <Switch
                  id="consent_final"
                  checked={!!signatureData && form.watch("consent_lgpd_accepted")}
                  disabled
                />
                <Label htmlFor="consent_final" className="text-sm">
                  Declaro que li, compreendo e aceito os termos de consentimento livre e esclarecido.
                </Label>
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
          <Button type="submit" disabled={saving || !signatureData || !form.watch("consent_lgpd_accepted")}>
            {saving ? "Salvando..." : "Salvar Anamnese"}
            {!saving && <Check className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </div>
    </form>
  )
}
