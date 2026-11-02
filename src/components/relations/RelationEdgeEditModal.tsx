import { useState } from 'react'
import { X } from 'lucide-react'
import type { LineStyle, Relation } from '../../types'
import { Button } from '../ui/button'
import { Input, Textarea } from '../ui/input'
import { toast } from '../ui/toast'
import { cn } from '../../lib/utils'

interface Props {
  relation: Relation
  onClose: () => void
  onSave: (updated: Relation) => void
}

const TYPE_PRESETS = ['师徒', '敌对', '契约', '亲情', '搭档']

const LINE_STYLES: { value: LineStyle; label: string; dash?: string }[] = [
  { value: 'solid', label: '实线' },
  { value: 'dashed', label: '虚线', dash: '6 4' },
  { value: 'dotted', label: '点线', dash: '2 4' },
]

export default function RelationEdgeEditModal({ relation, onClose, onSave }: Props) {
  const [label, setLabel] = useState(relation.label)
  const [type, setType] = useState(relation.type)
  const [color, setColor] = useState(relation.color)
  const [lineStyle, setLineStyle] = useState<LineStyle>(relation.lineStyle)
  const [note, setNote] = useState(relation.note)

  function handleSave() {
    if (!label.trim()) {
      toast('请填写关系名', 'error')
      return
    }
    onSave({ ...relation, label: label.trim(), type: type.trim(), color, lineStyle, note })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">编辑关系</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">关系名</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例如：宿敌" autoFocus />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">关系类型</label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {TYPE_PRESETS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                    type === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-secondary',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="自定义类型" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">连线颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-input bg-card"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">线型</label>
            <div className="flex gap-2">
              {LINE_STYLES.map((ls) => (
                <button
                  key={ls.value}
                  type="button"
                  onClick={() => setLineStyle(ls.value)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors',
                    lineStyle === ls.value ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary',
                  )}
                >
                  <svg width="48" height="12">
                    <line
                      x1="2"
                      y1="6"
                      x2="46"
                      y2="6"
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray={ls.dash}
                    />
                  </svg>
                  <span className="text-xs">{ls.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">备注</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="补充这条关系的背景说明"
              className="min-h-[80px]"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </div>
    </div>
  )
}
