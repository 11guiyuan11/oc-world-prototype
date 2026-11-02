import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  type: ToastType
  message: string
}

let listeners: ((item: ToastItem) => void)[] = []
let seed = 0

export function toast(message: string, type: ToastType = 'success') {
  listeners.forEach((l) => l({ id: ++seed, type, message }))
}

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const listener = (item: ToastItem) => {
      setItems((prev) => [...prev, item])
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== item.id))
      }, 3200)
    }
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {items.map((item) => {
        const Icon = ICONS[item.type]
        return (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-card p-3 text-sm shadow-lg',
              item.type === 'success' && 'border-green-200',
              item.type === 'error' && 'border-red-200',
              item.type === 'info' && 'border-border',
            )}
          >
            <Icon
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                item.type === 'success' && 'text-green-500',
                item.type === 'error' && 'text-red-500',
                item.type === 'info' && 'text-primary',
              )}
            />
            <span className="flex-1">{item.message}</span>
            <button
              onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
              className="text-muted-foreground hover:text-foreground"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
