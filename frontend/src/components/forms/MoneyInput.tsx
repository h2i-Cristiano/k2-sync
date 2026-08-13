"use client"

import { Input } from "@/components/ui/input"

interface MoneyInputProps {
  id?: string
  value: string | number | null | undefined
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

function sanitize(raw: string): string {
  let v = raw.replace(/[^\d.,]/g, "")
  if (!v) return ""

  const firstSep = v.search(/[.,]/)
  if (firstSep !== -1) {
    const intPart = v.slice(0, firstSep).replace(/[.,]/g, "")
    const decPart = v.slice(firstSep + 1).replace(/[.,]/g, "").slice(0, 2)
    v = `${intPart || "0"}.${decPart}`
  } else {
    v = v.replace(/\./g, "")
  }

  // remove leading zeros ("050" -> "5"), but keep "0.xx"
  v = v.replace(/^0+(?=\d)/, "")
  return v
}

export function MoneyInput({ id, value, onChange, placeholder, className }: MoneyInputProps) {
  const current =
    value === null || value === undefined || value === ""
      ? ""
      : String(value).replace(",", ".")

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      value={current}
      onChange={(e) => onChange(sanitize(e.target.value))}
      placeholder={placeholder}
      className={className}
    />
  )
}