import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, GitFork, Plus, Search, Trash2, Users, X } from 'lucide-react'
import { load, remove, save, uid, upsert } from '../lib/storage'
import type { Character, Relation } from '../types'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { toast } from '../components/ui/toast'
import { cn } from '../lib/utils'

const DEFAULT_ATTRIBUTES = [
  { dimension: '冷静', value: 70 },
  { dimension: '观察', value: 70 },
  { dimension: '武力', value: 70 },
  { dimension: '社交', value: 70 },
  { dimension: '魅力', value: 70 },
]

export default function Characters() {
  const navigate = useNavigate()
  const characters = load<Character>('characters')
  const relations = load<Relation>('relations')

  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sort, setSort] = useState<'default' | 'name' | 'relations'>('default')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showNew, setShowNew] = useState(false)

  const allTags = useMemo(() => {
    const s = new Set<string>()
    characters.forEach((c) => c.personalityTags.forEach((t) => s.add(t)))
    return [...s]
  }, [characters])

  const relationCount = (id: string) =>
    relations.filter((r) => r.sourceId === id || r.targetId === id).length

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = characters.filter((c) => {
      const matchQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.identity.toLowerCase().includes(q) ||
        c.faction.toLowerCase().includes(q) ||
        c.alias.some((a) => a.toLowerCase().includes(q))
      const matchTag =
        selectedTags.length === 0 || selectedTags.some((t) => c.personalityTags.includes(t))
      return matchQ && matchTag
    })
    if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name, 'zh'))
    if (sort === 'relations') return [...list].sort((a, b) => relationCount(b.id) - relationCount(a.id))
    return list
  }, [characters, search, selectedTags, sort])

  const preview = previewId ? characters.find((c) => c.id === previewId) : null

  function toggleTag(t: string) {
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function deleteSelected() {
    const remainingRels = relations.filter(
      (r) => !selectedIds.includes(r.sourceId) && !selectedIds.includes(r.targetId),
    )
    save('relations', remainingRels)
    selectedIds.forEach((id) => remove('characters', id))
    setSelectedIds([])
    toast(`已删除 ${selectedIds.length} 个角色`, 'success')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* 顶部 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">角色库</h1>
          <p className="mt-1 text-sm text-muted-foreground">共 {characters.length} 个角色</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" />
          新建角色
        </Button>
      </div>

      {/* 工具栏 */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索姓名 / 身份 / 阵营 / 别名"
              className="pl-9"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none"
          >
            <option value="default">默认排序</option>
            <option value="name">按姓名</option>
            <option value="relations">按关系数</option>
          </select>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">性格标签：</span>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                  selectedTags.includes(t)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-secondary',
                )}
              >
                {t}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button onClick={() => setSelectedTags([])} className="text-xs text-primary hover:underline">
                清除
              </button>
            )}
          </div>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {characters.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-medium">还没有角色</p>
                <p className="mt-1 text-sm text-muted-foreground">创建第一个角色，开始你的世界观。</p>
                <Button className="mt-4" onClick={() => setShowNew(true)}>
                  <Plus className="h-4 w-4" />
                  新建角色
                </Button>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-medium">无搜索结果</p>
                <p className="mt-1 text-sm text-muted-foreground">试试调整搜索词或清除筛选。</p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setSelectedTags([])
                  }}
                >
                  清除筛选
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => (
                <Card
                  key={c.id}
                  className={cn(
                    'group relative transition-all hover:-translate-y-0.5 hover:shadow-md',
                    selectedIds.includes(c.id) && 'border-primary ring-1 ring-primary/20',
                  )}
                >
                  <CardContent className="p-4">
                    {/* 选择框 */}
                    <button
                      onClick={() => toggleSelect(c.id)}
                      className={cn(
                        'absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-md border transition-colors',
                        selectedIds.includes(c.id)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card hover:border-primary',
                      )}
                      aria-label="选择"
                    >
                      {selectedIds.includes(c.id) && <span className="text-xs">✓</span>}
                    </button>

                    <button
                      className="flex w-full flex-col items-center pt-4 text-left"
                      onClick={() => navigate(`/characters/${c.id}`)}
                    >
                      <span
                        className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold text-white"
                        style={{ backgroundColor: c.themeColor || '#94a3b8' }}
                      >
                        {c.name.slice(0, 1)}
                      </span>
                      <div className="mt-3 text-center">
                        <div className="text-base font-semibold">{c.name}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{c.identity}</div>
                      </div>
                    </button>

                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                      {c.personalityTags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <GitFork className="h-3.5 w-3.5" />
                        {relationCount(c.id)} 条关系
                      </span>
                      <button
                        onClick={() => setPreviewId(previewId === c.id ? null : c.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        预览
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 右侧快速预览 */}
        {preview && (
          <aside className="hidden w-80 shrink-0 xl:block">
            <Card className="sticky top-0">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold">快速预览</h3>
                  <button onClick={() => setPreviewId(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-semibold text-white"
                    style={{ backgroundColor: preview.themeColor || '#94a3b8' }}
                  >
                    {preview.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold">{preview.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{preview.identity}</div>
                  </div>
                </div>
                {preview.intro && <p className="mt-3 text-sm text-muted-foreground">{preview.intro}</p>}
                {preview.personalityTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {preview.personalityTags.map((t) => (
                      <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <Link to={`/characters/${preview.id}`} className="mt-4 block">
                  <Button variant="outline" className="w-full">
                    查看完整档案
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </aside>
        )}
      </div>

      {/* 批量操作栏 */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-card px-4 py-2.5 shadow-lg">
          <span className="text-sm">已选 {selectedIds.length} 项</span>
          <Button size="sm" variant="destructive" onClick={deleteSelected}>
            <Trash2 className="h-3.5 w-3.5" />
            删除
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
            取消
          </Button>
        </div>
      )}

      {showNew && <NewCharacterModal onClose={() => setShowNew(false)} />}
    </div>
  )
}

function NewCharacterModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    identity: '',
    faction: '',
    age: '',
    themeColor: '#6366f1',
    intro: '',
    tags: '',
    appearance: '',
  })
  const [error, setError] = useState('')

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSave() {
    if (!form.name.trim()) {
      setError('请填写角色姓名')
      return
    }
    const c: Character = {
      id: uid(),
      name: form.name.trim(),
      alias: [],
      identity: form.identity.trim(),
      age: form.age.trim(),
      faction: form.faction.trim(),
      avatar: '',
      themeColor: form.themeColor,
      intro: form.intro.trim(),
      longBio: '',
      personalityTags: form.tags
        .split(/[,，、]/)
        .map((t) => t.trim())
        .filter(Boolean),
      appearance: form.appearance.trim(),
      outfits: [],
      voiceUrl: null,
      gallery: [],
      attributes: DEFAULT_ATTRIBUTES,
      updatedAt: Date.now(),
    }
    upsert('characters', c)
    toast('角色创建成功', 'success')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">新建角色</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              姓名 <span className="text-red-500">*</span>
            </label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="角色姓名" autoFocus />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">身份</label>
              <Input value={form.identity} onChange={(e) => set('identity', e.target.value)} placeholder="例如：调查员" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">年龄</label>
              <Input value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="例如：24" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">所属阵营</label>
              <Input value={form.faction} onChange={(e) => set('faction', e.target.value)} placeholder="例如：调查局" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">主题色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.themeColor}
                  onChange={(e) => set('themeColor', e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-md border border-input bg-card"
                />
                <Input value={form.themeColor} onChange={(e) => set('themeColor', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">一句话简介</label>
            <Input value={form.intro} onChange={(e) => set('intro', e.target.value)} placeholder="用一句话介绍这个角色" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">性格标签</label>
            <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="用逗号分隔，例如：冷静, 观察敏锐" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">外貌描述</label>
            <Input value={form.appearance} onChange={(e) => set('appearance', e.target.value)} placeholder="发型、瞳色、衣着等" />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>创建角色</Button>
        </div>
      </div>
    </div>
  )
}
