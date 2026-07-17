import { useToast } from "./use-toast"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-right-8 ${
            t.variant === 'destructive' 
              ? 'bg-destructive/10 border-destructive/20 text-destructive' 
              : 'bg-card border-white/10 text-foreground'
          }`}
        >
          {t.variant === 'destructive' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0 text-primary" />}
          <div>
            {t.title && <div className="font-semibold text-sm">{t.title}</div>}
            {t.description && <div className="text-xs opacity-80 mt-1">{t.description}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
