import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'

export default function SaveStatus() {
  const location = useLocation()
  const [state, setState] = useState<'saving' | 'saved'>('saved')

  useEffect(() => {
    setState('saving')
    const t = setTimeout(() => setState('saved'), 600)
    return () => clearTimeout(t)
  }, [location.pathname])

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {state === 'saving' ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>保存中…</span>
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5 text-green-600" />
          <span>已保存</span>
        </>
      )}
    </div>
  )
}
