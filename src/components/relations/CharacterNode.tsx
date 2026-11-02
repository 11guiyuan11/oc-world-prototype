import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { Character } from '../../types'

function CharacterNode({ data }: NodeProps) {
  const c = (data as { character: Character }).character
  return (
    <div className="flex w-[180px] items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-md">
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      {c.avatar ? (
        <img src={c.avatar} alt={c.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white"
          style={{ backgroundColor: c.themeColor || '#94a3b8' }}
        >
          {c.name.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{c.name}</div>
        <div className="truncate text-xs text-muted-foreground">{c.identity}</div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}

export default memo(CharacterNode)
