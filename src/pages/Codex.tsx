import { useMemo, useState } from 'react'
import { Plus, Search, Trash2, X } from 'lucide-react'
import { load, loadByWorld, remove, uid, upsert, getCurrentWorldId } from '../lib/storage'
import type { CodexCategory, CodexEntry } from '../types'
import { Button } from '../components/ui/button'
import { Input, Textarea } from '../components/ui/input'
import { toast } from '../components/ui/toast'
import { cn } from '../lib/utils'
import MapPanel from '../components/codex/MapPanel'

const CATEGORIES: CodexCategory[] = ['角色', '地点', '组织', '物品', '种族', '术语']
const TABS: (CodexCategory | 'all')[] = ['all', ...CATEGORIES]

export default function Codex() {
  const [entries, setEntries] = useState<CodexEntry[]>(() => loadByWorld<CodexEntry>('codex'))
  const [category, setCategory] = useState<CodexCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(() => loadByWorld<CodexEntry>('codex')[0]?.id ?? null)
  const [tagInput, setTagInput] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((e) => {
      const matchCat = category === 'all' || e.category === category
      const matchQ =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      return matchCat && matchQ
    })
  }, [entries, category, search])

  const selected = entries.find((e) => e.id === selectedId) ?? null

  function saveEntry(patch: Partial<CodexEntry>) {
    if (!selected) return
    const next = { ...selected, ...patch }
    upsert('codex', next)
    setEntries((prev) => prev.map((e) => (e.id === next.id ? next : e)))
  }

  function handleNew() {
    const cat: CodexCategory = category === 'all' ? '地点' : category
    const entry: CodexEntry = { id: uid(), worldId: getCurrentWorldId(), category: cat, title: '', content: '', tags: [] }
    upsert('codex', entry)
    setEntries((prev) => [entry, ...prev])
    setSelectedId(entry.id)
    setCategory('all')
  }

  function handleDelete(id: string) {
    remove('codex', id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
    if (selectedId === id) setSelectedId(null)
    toast('已删除', 'success')
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && selected && !selected.tags.includes(t)) saveEntry({ tags: [...selected.tags, t] })
    setTagInput('')
  }

  function removeTag(t: string) {
    if (selected) saveEntry({ tags: selected.tags.filter((x) => x !== t) })
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-4">
        <h1 className="text-sm font-semibold">图鉴与地图</h1>
        <Button size="sm" onClick={handleNew}>
          <Plus className="h-4 w-4" />
          新增图鉴
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 左：分类 Tab + 搜索 + 列表 */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-border/60">
          <div className="border-b border-border/60 p-3">
            <div className="flex gap-1 overflow-x-auto pb-2">
              {TABS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    category === c
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground',
                  )}
                >
                  {c === 'all' ? '全部' : c}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索图鉴"
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">暂无条目</p>
            ) : (
              <div className="space-y-1">
                {filtered.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left transition-colors',
                      selectedId === e.id ? 'bg-accent' : 'hover:bg-secondary/60',
                    )}
                  >
                    <div className="truncate text-sm font-medium">{e.title || '未命名条目'}</div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {e.category}
                      </span>
                      {e.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[11px] text-muted-foreground">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* 中：详情 + 内联编辑 */}
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          {selected ? (
            <div key={selected.id} className="mx-auto max-w-2xl space-y-4">
              <div className="flex items-center justify-between">
                <select
                  value={selected.category}
                  onChange={(e) => saveEntry({ category: e.target.value as CodexCategory })}
                  className="h-8 rounded-md border border-input bg-card px-2 text-sm focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(selected.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  删除
                </Button>
              </div>

              <Input
                value={selected.title}
                onChange={(e) => saveEntry({ title: e.target.value })}
                placeholder="条目标题"
                className="text-xl font-semibold"
                autoFocus={!selected.title}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium">正文</label>
                <Textarea
                  value={selected.content}
                  onChange={(e) => saveEntry({ content: e.target.value })}
                  placeholder="详细设定内容…"
                  className="min-h-[220px]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">标签</label>
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs"
                    >
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
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">选择一个图鉴条目，或点击「新增图鉴」</p>
            </div>
          )}
        </main>

        {/* 右：多层级地图 */}
        <aside className="hidden w-[420px] shrink-0 flex-col border-l border-border/60 xl:flex">
          <MapPanel />
        </aside>
      </div>
    </div>
  )
}
