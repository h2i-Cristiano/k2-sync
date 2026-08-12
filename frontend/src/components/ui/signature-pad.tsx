"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eraser, Pen, Type } from "lucide-react"
import { cn } from "@/lib/utils"

interface SignatureData {
  signatureImage: string
  typedName?: string
  timestamp: string
}

interface SignaturePadProps {
  onSignature: (data: SignatureData) => void
  className?: string
}

export function SignaturePad({ onSignature, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<"draw" | "type">("draw")
  const [typedName, setTypedName] = useState("")
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(2, 2)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  useEffect(() => {
    if (mode === "draw") {
      setTimeout(initCanvas, 50)
    }
  }, [mode, initCanvas])

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    setIsDrawing(true)
    lastPoint.current = getPos(e)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx || !lastPoint.current) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPoint.current = pos
    setHasSignature(true)
  }

  const handlePointerUp = () => {
    setIsDrawing(false)
    lastPoint.current = null
  }

  const clearCanvas = () => {
    initCanvas()
    setHasSignature(false)
    setTypedName("")
  }

  const captureSignature = () => {
    const timestamp = new Date().toISOString()
    if (mode === "draw" && canvasRef.current) {
      const image = canvasRef.current.toDataURL("image/jpeg", 0.8)
      if (hasSignature) {
        onSignature({ signatureImage: image, timestamp })
      }
    } else if (mode === "type" && typedName.trim()) {
      const canvas = document.createElement("canvas")
      canvas.width = 400
      canvas.height = 100
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, 400, 100)
      ctx.fillStyle = "#1a1a1a"
      ctx.font = "italic 32px 'Georgia', serif"
      ctx.textBaseline = "middle"
      ctx.fillText(typedName, 20, 50)
      const image = canvas.toDataURL("image/jpeg", 0.8)
      onSignature({ signatureImage: image, typedName, timestamp })
    }
  }

  useEffect(() => {
    captureSignature()
  }, [hasSignature, typedName])

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("draw")}
          className="rounded-xl"
        >
          <Pen className="mr-1.5 h-3.5 w-3.5" />
          Desenhar
        </Button>
        <Button
          type="button"
          variant={mode === "type" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("type")}
          className="rounded-xl"
        >
          <Type className="mr-1.5 h-3.5 w-3.5" />
          Digitar Nome
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearCanvas}
          className="rounded-xl ml-auto"
        >
          <Eraser className="mr-1.5 h-3.5 w-3.5" />
          Limpar
        </Button>
      </div>

      {/* Canvas / Input */}
      {mode === "draw" ? (
        <div className="relative rounded-xl border-2 border-dashed border-border bg-white overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-[120px] cursor-crosshair touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-sm text-muted-foreground/50">Assine aqui com o dedo ou estilo</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Digite seu nome completo"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            className="rounded-xl h-12 text-lg"
          />
          {typedName && (
            <div className="rounded-xl border bg-white p-4">
              <p className="text-2xl italic text-foreground/80" style={{ fontFamily: "Georgia, serif" }}>
                {typedName}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Signature Line */}
      <div className="border-b border-foreground/30" />
    </div>
  )
}
