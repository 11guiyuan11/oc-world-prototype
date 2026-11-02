import { useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import type { Character, GalleryImage } from '../../types'
import { readFileAsDataURL, uid } from '../../lib/storage'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { toast } from '../ui/toast'
import { cn } from '../../lib/utils'

interface Props {
  character: Character
  onUpdate: (patch: Partial<Character>) => void
}

const BUDGET_BYTES = 5 * 1024 * 1024 // 约 5MB 预算

function bytesOf(gallery: GalleryImage[]) {
  return Math.round(gallery.reduce((s, g) => s + g.image.length * 0.75, 0))
}

export default function GalleryTab({ character, onUpdate }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [caption, setCaption] = useState('')

  const used = bytesOf(character.gallery)
  const pct = Math.min(used / BUDGET_BYTES, 1)

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    const additions: GalleryImage[] = []
    for (const f of files) {
      try {
        const data = await readFileAsDataURL(f)
        additions.push({ id: uid(), image: data, caption: '', group: '默认' })
      } catch {
        toast('图片读取失败', 'error')
      }
    }
    if (additions.length === 0) return
    const next = [...character.gallery, ...additions]
    if (bytesOf(next) > BUDGET_BYTES * 0.85) {
      toast('图片较多，注意 localStorage 容量上限（约 5MB）', 'info')
    }
    onUpdate({ gallery: next })
  }

  function removeImage(id: string) {
    onUpdate({ gallery: character.gallery.filter((g) => g.id !== id) })
  }

  function startCaption(g: GalleryImage) {
    setEditingId(g.id)
    setCaption(g.caption)
  }

  function saveCaption() {
    if (!editingId) return
    onUpdate({
      gallery: character.gallery.map((g) => (g.id === editingId ? { ...g, caption } : g)),
    })
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      {/* 容量提示 */}
      <div className="rounded-lg bg-secondary/50 p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>本地存储占用（估算）</span>
          <span>
            {Math.round(used / 1024)} KB / 约 {Math.round(BUDGET_BYTES / 1024 / 1024)} MB
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className={cn('h-full rounded-full transition-all', pct > 0.85 ? 'bg-red-500' : pct > 0.6 ? 'bg-amber-500' : 'bg-primary')}
            style={{ width: `${Math.round(pct * 100)}%` }}
          />
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />

      {character.gallery.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <ImagePlus className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">还没有相册图片</p>
          <p className="mt-1 text-xs text-muted-foreground">上传立绘、场景图或表情包，FileReader 会转成 base64 存入本地。</p>
          <Button className="mt-4" onClick={() => fileRef.current?.click()}>
            上传图片
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {character.gallery.map((g) => (
            <div key={g.id} className="group relative overflow-hidden rounded-lg border bg-card">
              <img src={g.image} alt={g.caption} className="aspect-square w-full object-cover" />
              <button
                onClick={() => removeImage(g.id)}
                className="absolute right-2 top-2 rounded-md bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                aria-label="删除图片"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="p-2">
                {editingId === g.id ? (
                  <Input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    onBlur={saveCaption}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveCaption()
                    }}
                    autoFocus
                    className="h-7 px-2 text-xs"
                    placeholder="输入图注"
                  />
                ) : (
                  <button
                    onClick={() => startCaption(g)}
                    className={cn('w-full truncate text-left text-xs', g.caption ? 'text-foreground' : 'text-muted-foreground/50')}
                  >
                    {g.caption || '点击添加图注'}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:bg-secondary/50"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">继续上传</span>
          </button>
        </div>
      )}
    </div>
  )
}
