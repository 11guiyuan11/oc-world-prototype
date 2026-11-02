import { Check } from 'lucide-react'
import { cn } from '../lib/utils'

interface ProgressRingProps {
  progress: number // 0 ~ 1
  size?: number
  stroke?: number
  color?: string
  className?: string
}

export default function ProgressRing({
  progress,
  size = 52,
  stroke = 5,
  color = '#7c3aed',
  className,
}: ProgressRingProps) {
  const p = Math.max(0, Math.min(1, progress))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - p)
  const done = p >= 1

  return (
    <div
      className={cn('relative inline-flex shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={done ? '#22c55e' : color}
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {done ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <span className="text-xs font-semibold tabular-nums">{Math.round(p * 100)}%</span>
        )}
      </div>
    </div>
  )
}
