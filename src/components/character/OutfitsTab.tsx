import { useRef, useState, type ChangeEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Character, Outfit } from '../../types'
import { readFileAsDataURL, uid } from '../../lib/storage'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { toast } from '../ui/toast'

interface Props {
  character: Character
  onUpdate: (patch: Partial<Character>) => void
}

export default function OutfitsTab({ character, onUpdate }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({})

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    const additions: Outfit[] = []
    for (const f of files) {
      try {
        const data = await readFileAsDataURL(f)
        additions.push({ id: uid(), image: data, tags: [], note: '' })
      } catch {
        toast('图片读取失败', 'error')
      }
    }
    if (additions.length > 0) onUpdate({ outfits: [...character.outfits, ...additions] })
  }

  function updateOutfit(id: string, patch: Partial<Outfit>) {
    onUpdate({ outfits: character.outfits.map((o) => (o.id === id ? { ...o, ...patch } : o)) })
  }

  function removeOutfit(id: string) {
    onUpdate({ outfits: character.outfits.filter((o) => o.id !== id) })
  }

  function commitTags(id: string) {
    const raw = tagInputs[id] ?? ''
    updateOutfit(id, {
      tags: raw
        .split(/[,，、]/)
        .map((t) => t.trim())
        .filter(Boolean),
    })
  }

  return (
    <div className="space-y-4">
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />

      {character.outfits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm font-medium">还没有服装设定</p>
          <p className="mt-1 text-xs text-muted-foreground">上传多套服装，标注配色与场合。</p>
          <Button className="mt-4" onClick={() => fileRef.current?.click()}>
            <Plus className="h-4 w-4" />
            上传服装
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {character.outfits.map((o) => (
            <div key={o.id} className="group relative overflow-hidden rounded-lg border bg-card">
              <img src={o.image} alt={o.note} className="aspect-[4/3] w-full object-cover" />
              <button
                onClick={() => removeOutfit(o.id)}
                className="absolute right-2 top-2 rounded-md bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                aria-label="删除服装"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="space-y-2 p-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">标签（逗号分隔）</label>
                  <Input
                    value={tagInputs[o.id] ?? o.tags.join('、')}
                    onChange={(e) => setTagInputs((m) => ({ ...m, [o.id]: e.target.value }))}
                    onBlur={() => commitTags(o.id)}
                    placeholder="例如：日常、正装"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">备注</label>
                  <Input
                    value={o.note}
                    onChange={(e) => updateOutfit(o.id, { note: e.target.value })}
                    placeholder="配色、场合说明"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[160px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:bg-secondary/50"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs">继续上传</span>
          </button>
        </div>
      )}
    </div>
  )
}
