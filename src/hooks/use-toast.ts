import * as React from "react"
import { toast as sonnerToast } from "@/components/ui/sonner"

// Compatibility shim: map shadcn use-toast API to Sonner
// - Supports object-style: toast({ title, description, variant })
// - Supports string-style: toast("Message", { description })
// - Exposes toast.success/error/info and dismiss

type ToastInput =
  | string
  | {
      title?: React.ReactNode
      description?: React.ReactNode
      variant?: "default" | "destructive"
      // Allow extra fields without breaking callers
      [key: string]: any
    }

function shimToast(input: ToastInput, options?: any) {
  if (typeof input === "string") {
    return sonnerToast(input as string, options)
  }

  const { title, description, variant } = input || {}
  const message = (title as any) ?? (description as any) ?? ("Notification" as any)

  if (variant === "destructive") {
    return (sonnerToast as any).error?.(message, { description }) ?? sonnerToast(message, { description })
  }
  return sonnerToast(message, { description })
}

// Attach common helpers for direct calls like toast.success(...)
;(shimToast as any).success = (msg: string, opts?: any) => (sonnerToast as any).success?.(msg, opts) ?? sonnerToast(msg, opts)
;(shimToast as any).error = (msg: string, opts?: any) => (sonnerToast as any).error?.(msg, opts) ?? sonnerToast(msg, opts)
;(shimToast as any).info = (msg: string, opts?: any) => (sonnerToast as any).info?.(msg, opts) ?? sonnerToast(msg, opts)
;(shimToast as any).warning = (msg: string, opts?: any) => (sonnerToast as any).warning?.(msg, opts) ?? sonnerToast(msg, opts)
;(shimToast as any).dismiss = (id?: string) => (sonnerToast as any).dismiss?.(id)

export function useToast() {
  return {
    toasts: [],
    toast: shimToast as any,
    dismiss: (id?: string) => (sonnerToast as any).dismiss?.(id),
  }
}

export const toast = shimToast as any

