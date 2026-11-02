import { useMemo, useRef, useState, type PointerEvent } from 'react'
import type { Character, Relation } from '../../types'
import { load } from '../../lib/storage'

const NODE_W = 180
const NODE_H = 72

// 确定性伪随机 Z 轴偏移（不随重渲染变化）
function zOffset(index: number) {
  return Math.round(Math.sin((index + 1) * 2.399963229728653) * 130)
}

export default function Relations3D() {
  const characters = useMemo(() => load<Character>('characters'), [])
  const relations = useMemo(() => load<Relation>('relations'), [])

  const [rotation, setRotation] = useState({ x: -20, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  const n = characters.length
  const radius = Math.max(200, 36 * n)

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number; z: number }>()
    characters.forEach((c, i) => {
      const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2
      map.set(c.id, {
        x: Math.round(radius * Math.cos(angle)),
        y: Math.round(radius * Math.sin(angle)),
        z: zOffset(i),
      })
    })
    return map
  }, [characters, n, radius])

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    dragging.current = true
    setIsDragging(true)
    last.current = { x: e.clientX, y: e.clientY }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return
    const dx = e.clientX - last.current.x
    const dy = e.clientY - last.current.y
    last.current = { x: e.clientX, y: e.clientY }
    setRotation((prev) => ({
      x: Math.max(-80, Math.min(80, prev.x - dy * 0.5)),
      y: prev.y + dx * 0.5,
    }))
  }

  function endDrag() {
    dragging.current = false
    setIsDragging(false)
  }

  if (characters.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        还没有角色，先创建角色再查看 3D 关系
      </div>
    )
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        perspective: '1000px',
        background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #e6ebf2 100%)',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        animation: 'relations-3d-in 0.35s ease-out',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <div
        className="absolute inset-0"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* 连线：2D 投影降级，仅保留颜色，营造空间骨架 */}
        {relations.map((r) => {
          const a = positions.get(r.sourceId)
          const b = positions.get(r.targetId)
          if (!a || !b) return null
          const dx = b.x - a.x
          const dy = b.y - a.y
          const length = Math.sqrt(dx * dx + dy * dy)
          const angle = Math.atan2(dy, dx)
          return (
            <div
              key={r.id}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: length,
                height: 2,
                background: r.color,
                opacity: 0.4,
                transform: `translate(${a.x}px, ${a.y}px) rotate(${angle}rad)`,
                transformOrigin: '0 50%',
              }}
            />
          )
        })}

        {/* 节点：环形分布 + translateZ 深度 */}
        {characters.map((c) => {
          const p = positions.get(c.id)
          if (!p) return null
          return (
            <div
              key={c.id}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate3d(${p.x - NODE_W / 2}px, ${p.y - NODE_H / 2}px, ${p.z}px)`,
              }}
            >
              <div className="flex w-[180px] items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-[0_10px_40px_rgba(15,23,42,0.18)]">
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
              </div>
            </div>
          )
        })}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white">
        拖拽旋转视角 · {characters.length} 个角色
      </div>
    </div>
  )
}
