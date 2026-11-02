import { useRef, useState, type ChangeEvent } from 'react'
import { Upload, X } from 'lucide-react'
import type { Character, MapNode, TimelineEvent } from '../types'
import { readFileAsDataURL, uid } from '../lib/storage'
import { Button } from './ui/button'
import { Input, Textarea } from './ui/input'
import { toast } from './ui/toast'
import { cn } from '../lib/utils'

interface Props {
  calendarName: string
  characters: Character[]
  mapNodes: MapNode[]
  event: TimelineEvent | null
  onClose: () => void
  onSave: (event: TimelineEvent) => void
}

export default function TimelineEventModal({
  calendarName,
  characters,
  mapNodes,
  event,
  onClose,
  onSave,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [year, setYear] = useState(event ? String(event.calendarYear) : '')
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [characterIds, setCharacterIds] = useState<string[]>(event?.characterIds ?? [])
  const [mapNodeId, setMapNodeId] = useState<string>(event?.mapNodeId ?? '')
  const [image, setImage] = useState(event?.image ?? '')
  const [error, setError] = useState('')

  function toggleCharacter(id: string) {
    setCharacterIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function onImage(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      setImage(await readFileAsDataURL(f))
    } catch {
      toast('图片读取失败', 'error')
    }
  }

  function handleSave() {
    if (!title.trim()) {
      setError('请填写事件标题')
      return
    }
    const y = Number(year)
    if (!year.trim() || Number.isNaN(y)) {
      setError('请填写有效的纪年')
      return
    }
    const ev: TimelineEvent = {
      id: event?.id ?? uid(),
      calendarYear: y,
      displayDate: `${calendarName} ${y} 年`,
      title: title.trim(),
      description,
      characterIds,
      mapNodeId: mapNodeId || null,
      image,
      updatedAt: Date.now(),
    }
    onSave(ev)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{event ? '编辑事件' : '新增事件'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                纪年 <span className="text-red-500">*</span>
              </label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} type="number" placeholder={`${calendarName} 年份`} autoFocus />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">显示日期</label>
              <Input value={year ? `${calendarName} ${year} 年` : ''} readOnly placeholder="自动生成" className="bg-secondary/40" />
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}

          <div>
            <label className="mb-1.5 block text-sm font-medium">标题</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：雾港大火灾" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">描述</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="事件经过、影响等" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">关联角色</label>
            <div className="flex flex-wrap gap-1.5">
              {characters.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCharacter(c.id)}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                    characterIds.includes(c.id)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-secondary',
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">关联地图节点</label>
            <select
              value={mapNodeId}
              onChange={(e) => setMapNodeId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none"
            >
              <option value="">不关联</option>
              {mapNodes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}（{m.level}）
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">配图</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImage} />
            {image ? (
              <div className="relative h-32 overflow-hidden rounded-lg border">
                <img src={image} alt="配图" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="absolute right-2 top-2 rounded-md bg-black/50 p-1 text-white hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:bg-secondary/50"
              >
                <Upload className="h-5 w-5" />
                <span className="text-xs">点击上传配图</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>{event ? '保存' : '创建事件'}</Button>
        </div>
      </div>
    </div>
  )
}
