import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import type { MapNode } from '../../types'
import Marker from './Marker'

const CONTENT_W = 800
const CONTENT_H = 500
const MIN_SCALE = 0.2
const MAX_SCALE = 4

interface Props {
  node: MapNode
  onAddMarker: (pos: { x: number; y: number }) => void
  onSelectMarker: (id: string) => void
}

export default function MapCanvas({ node, onAddMarker, onSelectMarker }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ scale: 1, tx: 0, ty: 0 })
  const drag = useRef({ active: false, moved: false, startX: 0, startY: 0, tx: 0, ty: 0 })

  function fitTransform() {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return { scale: 1, tx: 0, ty: 0 }
    const scale = Math.min(rect.width / CONTENT_W, rect.height / CONTENT_H, 1)
    return {
      scale,
      tx: (rect.width - CONTENT_W * scale) / 2,
      ty: (rect.height - CONTENT_H * scale) / 2,
    }
  }

  useLayoutEffect(() => {
    setTransform(fitTransform())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 非被动 wheel 事件实现缩放
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.15 : 0.85
      setTransform((prev) => {
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor))
        const k = scale / prev.scale
        return { scale, tx: cx - (cx - prev.tx) * k, ty: cy - (cy - prev.ty) * k }
      })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    drag.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      tx: transform.tx,
      ty: transform.ty,
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.startX
    const dy = e.clientY - drag.current.startY
    if (!drag.current.moved && Math.hypot(dx, dy) > 4) drag.current.moved = true
    if (drag.current.moved) {
      setTransform((prev) => ({ ...prev, tx: drag.current.tx + dx, ty: drag.current.ty + dy }))
    }
  }

  function onPointerUp() {
    drag.current.active = false
  }

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    if (drag.current.moved) return
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    // 反算：视口坐标 → 底图本体坐标 → 百分比
    const contentX = (cx - transform.tx) / transform.scale
    const contentY = (cy - transform.ty) / transform.scale
    const x = contentX / CONTENT_W
    const y = contentY / CONTENT_H
    if (x < 0 || x > 1 || y < 0 || y > 1) return
    onAddMarker({ x, y })
  }

  function zoomBy(factor: number) {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = rect.width / 2
    const cy = rect.height / 2
    setTransform((prev) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor))
      const k = scale / prev.scale
      return { scale, tx: cx - (cx - prev.tx) * k, ty: cy - (cy - prev.ty) * k }
    })
  }

  function reset() {
    setTransform(fitTransform())
  }

  return (
    <div
      ref={viewportRef}
      className="relative h-[400px] w-full cursor-grab touch-none select-none overflow-hidden rounded-lg border border-border/60 bg-secondary/30 active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClick={handleClick}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: CONTENT_W,
          height: CONTENT_H,
          transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {node.image ? (
          <img src={node.image} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        ) : (
          <div
            className="absolute inset-0 bg-white"
            style={{
              backgroundImage:
                'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        )}

        {node.markers.map((m) => (
          <Marker key={m.id} marker={m} onClick={() => onSelectMarker(m.id)} />
        ))}

        {node.markers.length === 0 && !node.image && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            点击空白处添加标记点
          </div>
        )}
      </div>

      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            zoomBy(1.2)
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-card shadow-sm hover:bg-secondary"
          aria-label="放大"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            zoomBy(1 / 1.2)
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-card shadow-sm hover:bg-secondary"
          aria-label="缩小"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            reset()
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-card shadow-sm hover:bg-secondary"
          aria-label="重置视图"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
