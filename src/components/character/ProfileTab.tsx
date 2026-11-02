import { useState } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import type { Character } from '../../types'
import { Button } from '../ui/button'
import { Input, Textarea } from '../ui/input'

interface Props {
  character: Character
  onUpdate: (patch: Partial<Character>) => void
}

export default function ProfileTab({ character, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [draft, setDraft] = useState({
    intro: '',
    longBio: '',
    appearance: '',
    identity: '',
    faction: '',
    age: '',
    alias: '',
  })

  function startEdit() {
    setDraft({
      intro: character.intro,
      longBio: character.longBio,
      appearance: character.appearance,
      identity: character.identity,
      faction: character.faction,
      age: character.age,
      alias: character.alias.join('、'),
    })
    setEditing(true)
  }

  function save() {
    onUpdate({
      intro: draft.intro,
      longBio: draft.longBio,
      appearance: draft.appearance,
      identity: draft.identity,
      faction: draft.faction,
      age: draft.age,
      alias: draft.alias
        .split(/[、,，]/)
        .map((s) => s.trim())
        .filter(Boolean),
    })
    setEditing(false)
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !character.personalityTags.includes(t)) {
      onUpdate({ personalityTags: [...character.personalityTags, t] })
    }
    setTagInput('')
  }

  function removeTag(t: string) {
    onUpdate({ personalityTags: character.personalityTags.filter((x) => x !== t) })
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">身份</label>
          <Input value={draft.identity} onChange={(e) => setDraft((d) => ({ ...d, identity: e.target.value }))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">阵营</label>
            <Input value={draft.faction} onChange={(e) => setDraft((d) => ({ ...d, faction: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">年龄</label>
            <Input value={draft.age} onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">别名（用顿号或逗号分隔）</label>
          <Input value={draft.alias} onChange={(e) => setDraft((d) => ({ ...d, alias: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">一句话简介</label>
          <Textarea value={draft.intro} onChange={(e) => setDraft((d) => ({ ...d, intro: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">长文设定</label>
          <Textarea
            value={draft.longBio}
            onChange={(e) => setDraft((d) => ({ ...d, longBio: e.target.value }))}
            className="min-h-[140px]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">外貌描述</label>
          <Textarea value={draft.appearance} onChange={(e) => setDraft((d) => ({ ...d, appearance: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)}>
            取消
          </Button>
          <Button onClick={save}>保存</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">人物档案</h3>
        <Button variant="outline" size="sm" onClick={startEdit}>
          <Pencil className="h-3.5 w-3.5" />
          编辑
        </Button>
      </div>

      <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <InfoRow label="身份" value={character.identity} />
        <InfoRow label="阵营" value={character.faction} />
        <InfoRow label="年龄" value={character.age} />
        <InfoRow label="别名" value={character.alias.join('、')} />
      </div>

      {character.intro && (
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">简介</div>
          <p className="text-sm leading-relaxed">{character.intro}</p>
        </div>
      )}

      {character.appearance && (
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">外貌</div>
          <p className="text-sm leading-relaxed">{character.appearance}</p>
        </div>
      )}

      <div>
        <div className="mb-1 text-xs font-medium text-muted-foreground">长文设定</div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {character.longBio || '暂无长文设定，点击右上角「编辑」补充。'}
        </p>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium text-muted-foreground">性格标签</div>
        <div className="flex flex-wrap gap-1.5">
          {character.personalityTags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs">
              {t}
              <button onClick={() => removeTag(t)} className="text-muted-foreground hover:text-foreground" aria-label={`移除 ${t}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder="添加标签"
              className="h-7 w-28 px-2 text-xs"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addTag} aria-label="添加标签">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span>{value || '—'}</span>
    </div>
  )
}
