// Simplified toast hook for the app
import * as React from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastListeners = new Set<(t: ToasterToast) => void>()

export function toast(props: Omit<ToasterToast, "id">) {
  const id = genId()
  const t = { ...props, id }
  toastListeners.forEach((listener) => listener(t))
  return {
    id,
    dismiss: () => {},
    update: () => {},
  }
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([])

  React.useEffect(() => {
    const listener = (t: ToasterToast) => {
      setToasts((prev) => [t, ...prev].slice(0, TOAST_LIMIT))
      setTimeout(() => {
        setToasts((prev) => prev.filter((pt) => pt.id !== t.id))
      }, 3000)
    }
    toastListeners.add(listener)
    return () => {
      toastListeners.delete(listener)
    }
  }, [])

  return {
    toasts,
    toast,
    dismiss: () => setToasts([]),
  }
}
