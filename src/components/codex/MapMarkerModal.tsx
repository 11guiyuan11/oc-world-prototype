import { useState } from 'react'
import { X } from 'lucide-react'
import type { Character, CodexEntry, MapMarker, MapNode, TimelineEvent } from '../../types'
import { uid } from '../../lib/storage'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { toast } from '../ui/toast'

interface Props {
  position: { x: number; y: number }
  children: MapNode[]
  codex: CodexEntry[]
  characters: Character[]
  events: TimelineEvent[]
  onClose: () => void
  onSave: (marker: MapMarker) => void
}

export default function MapMarkerModal({
  position,
  children,
  codex,
  characters,
  events,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#7c3aed')
  const [codexId, setCodexId] = useState('')
  const [characterId, setCharacterId] = useState('')
  const [eventId, setEventId] = useState('')
  const [mapNodeId, setMapNodeId] = useState('')
  const [error, setError] = useState('')

  function handleSave() {
    if (!name.trim()) {
      setError('请填写标记名称')
      return
    }
    onSave({
      id: uid(),
      x: position.x,
      y: position.y,
      name: name.trim(),
      color,
      codexId: codexId || null,
      characterId: characterId || null,
      eventId: eventId || null,
      mapNodeId: mapNodeId || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">添加标记点</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium">
                名称 <span className="text-red-500">*</span>
              </label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：雾港调查局" autoFocus />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">颜色</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-input bg-card"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">关联图鉴</label>
            <select
              value={codexId}
              onChange={(e) => setCodexId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none"
            >
              <option value="">不关联</option>
              {codex.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}（{c.category}）
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">关联角色</label>
            <select
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none"
            >
              <option value="">不关联</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">关联事件</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none"
            >
              <option value="">不关联</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          {children.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">下一级地图（用于下钻）</label>
              <select
                value={mapNodeId}
                onChange={(e) => setMapNodeId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none"
              >
                <option value="">不关联</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>添加标记</Button>
        </div>
      </div>
    </div>
  )
}
