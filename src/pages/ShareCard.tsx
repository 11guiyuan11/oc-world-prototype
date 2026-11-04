import { useRef, useState } from 'react'
import { Copy, Download, Loader2, Sparkles } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { load, loadByWorld } from '../lib/storage'
import { generateShareCardPrompt } from '../lib/deepseek'
import type { Character, Relation, TimelineEvent } from '../types'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { toast } from '../components/ui/toast'
import { cn } from '../lib/utils'
import { exportNodeToPng } from '../lib/exportImage'

const QUOTES: Record<string, string> = {
  'char-lin': '「真相只藏在证据里。」',
  'char-shen': '「握紧力量，才能保护想保护的人。」',
  'char-you': '「只要齿轮还在转，就一定有办法！」',
}

const FIELD_OPTIONS = [
  { key: 'cover', label: '封面图' },
  { key: 'avatar', label: '头像' },
  { key: 'name', label: '姓名' },
  { key: 'tagline', label: '一句话气质' },
  { key: 'tags', label: '性格标签' },
  { key: 'outfits', label: '服装配色' },
  { key: 'quote', label: '代表台词' },
  { key: 'relations', label: '关键关系' },
  { key: 'events', label: '关键事件' },
  { key: 'qrcode', label: '二维码' },
] as const

function outfitSummary(character: Character): string {
  if (character.outfits.length > 0) {
    return character.outfits.map((o) => (o.tags.length ? o.tags.join('/') : o.note || '服装')).join('、')
  }
  return character.appearance || '暂无服装配色'
}

export default function ShareCard() {
  const characters = loadByWorld<Character>('characters')
  const relations = loadByWorld<Relation>('relations')
  const events = loadByWorld<TimelineEvent>('timeline')

  const [characterId, setCharacterId] = useState(characters[0]?.id ?? '')
  const [layout, setLayout] = useState<'long' | 'card'>('long')
  const [themeColor, setThemeColor] = useState(characters[0]?.themeColor ?? '#7c3aed')
  const [fields, setFields] = useState<Record<string, boolean>>({
    cover: true,
    avatar: true,
    name: true,
    tagline: true,
    tags: true,
    outfits: true,
    quote: true,
    relations: true,
    events: true,
    qrcode: true,
  })
  const [prompt, setPrompt] = useState('')
  const [generatingPrompt, setGeneratingPrompt] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const character = characters.find((c) => c.id === characterId) ?? characters[0]

  const charRelations = relations.filter((r) => r.sourceId === character?.id || r.targetId === character?.id)
  const charEvents = events
    .filter((e) => e.characterIds.includes(character?.id ?? ''))
    .sort((a, b) => a.calendarYear - b.calendarYear)

  function selectCharacter(id: string) {
    setCharacterId(id)
    const c = characters.find((x) => x.id === id)
    if (c) setThemeColor(c.themeColor)
  }

  function toggleField(key: string) {
    setFields((f) => ({ ...f, [key]: !f[key] }))
  }

  async function genPrompt() {
    if (!character) return
    setGeneratingPrompt(true)
    setPrompt('')
    try {
      const text = await generateShareCardPrompt(character)
      setPrompt(text)
    } finally {
      setGeneratingPrompt(false)
    }
  }

  function copyPrompt() {
    if (!prompt) return
    navigator.clipboard.writeText(prompt).then(
      () => toast('已复制提示词', 'success'),
      () => toast('复制失败', 'error'),
    )
  }

  async function exportImage() {
    if (!cardRef.current) return
    toast('正在导出…', 'info')
    try {
      await exportNodeToPng(cardRef.current, `${character.name}-展示卡.png`)
      toast('已导出 PNG', 'success')
    } catch {
      toast('导出失败', 'error')
    }
  }

  if (!character) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        还没有角色，先创建角色再生成展示卡
      </div>
    )
  }

  const avatar = (
    <span
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-semibold text-white ring-2 ring-white"
      style={{ backgroundColor: character.avatar ? undefined : themeColor }}
    >
      {character.avatar ? <img src={character.avatar} alt="" className="h-full w-full rounded-full object-cover" /> : character.name.slice(0, 1)}
    </span>
  )

  const tagChips = fields.tags && character.personalityTags.length > 0 && (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {character.personalityTags.map((t) => (
        <span key={t} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}>
          {t}
        </span>
      ))}
    </div>
  )

  const relationBlock = fields.relations && charRelations.length > 0 && (
    <div className="mt-4">
      <div className="text-xs font-semibold text-muted-foreground">关键关系</div>
      <div className="mt-1.5 space-y-1">
        {charRelations.slice(0, 4).map((r) => {
          const otherId = r.sourceId === character.id ? r.targetId : r.sourceId
          const other = characters.find((c) => c.id === otherId)
          return (
            <div key={r.id} className="flex items-center gap-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="font-medium">{other?.name ?? '?'}</span>
              <span className="text-muted-foreground">· {r.label || r.type}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  const eventBlock = fields.events && charEvents.length > 0 && (
    <div className="mt-4">
      <div className="text-xs font-semibold text-muted-foreground">关键事件</div>
      <div className="mt-1.5 space-y-1">
        {charEvents.slice(0, 3).map((e) => (
          <div key={e.id} className="text-xs">
            <span className="tabular-nums text-muted-foreground">{e.displayDate}</span>
            <span className="ml-1.5">{e.title}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const qrBlock = fields.qrcode && (
    <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary/40 p-3">
      <div>
        <div className="text-xs font-medium">扫码查看角色</div>
        <div className="text-[11px] text-muted-foreground">分享只读页</div>
      </div>
      <QRCodeSVG value={`${window.location.origin}/#/share/${character.id}`} size={52} />
    </div>
  )

  const quoteBlock = fields.quote && (
    <div className="mt-4 rounded-lg border-l-2 pl-3 text-sm italic" style={{ borderColor: themeColor }}>
      {QUOTES[character.id] ?? '「……（代表台词）」'}
    </div>
  )

  const outfitBlock = fields.outfits && (
    <div className="mt-3 text-xs text-muted-foreground">
      <span className="font-medium" style={{ color: themeColor }}>
        外观
      </span>
      {' · '}
      {outfitSummary(character)}
    </div>
  )

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4">
        <h1 className="text-sm font-semibold">OC 展示卡生成器</h1>
        <div className="flex items-center gap-2">
          <select
            value={characterId}
            onChange={(e) => selectCharacter(e.target.value)}
            className="h-8 rounded-md border border-input bg-card px-2 text-sm focus:outline-none"
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1 rounded-lg bg-secondary p-1">
            <button
              onClick={() => setLayout('long')}
              className={cn('rounded-md px-3 py-1 text-xs font-medium transition-colors', layout === 'long' ? 'bg-card shadow-sm' : 'text-muted-foreground')}
            >
              长图
            </button>
            <button
              onClick={() => setLayout('card')}
              className={cn('rounded-md px-3 py-1 text-xs font-medium transition-colors', layout === 'card' ? 'bg-card shadow-sm' : 'text-muted-foreground')}
            >
              网页名片
            </button>
          </div>
          <Button size="sm" onClick={exportImage}>
            <Download className="h-3.5 w-3.5" />
            导出图片
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 左：字段配置 */}
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border/60 p-4 lg:block">
          <div className="mb-3 text-sm font-semibold">字段配置</div>
          <div className="space-y-1.5">
            {FIELD_OPTIONS.map((f) => (
              <label key={f.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary/60">
                <input
                  type="checkbox"
                  checked={fields[f.key]}
                  onChange={() => toggleField(f.key)}
                  className="h-4 w-4 accent-primary"
                />
                {f.label}
              </label>
            ))}
          </div>

          <div className="mt-5 border-t border-border/60 pt-4">
            <div className="mb-2 text-sm font-semibold">主题色</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-input bg-card"
              />
              <span className="text-xs tabular-nums text-muted-foreground">{themeColor}</span>
            </div>
          </div>
        </aside>

        {/* 中：预览 */}
        <div className="flex min-w-0 flex-1 items-start justify-center overflow-y-auto p-8">
          <div
            ref={cardRef}
            className={cn(
              'overflow-hidden rounded-2xl border bg-card shadow-xl',
              layout === 'long' ? 'w-[380px]' : 'w-[600px]',
            )}
          >
            {fields.cover && (
              <div className="h-28 w-full" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}99)` }} />
            )}

            {layout === 'long' ? (
              <div className="p-6">
                <div className="flex items-center gap-4">
                  {fields.avatar && avatar}
                  <div className="min-w-0">
                    {fields.name && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl font-bold">{character.name}</span>
                        {character.alias.length > 0 && <span className="text-xs text-muted-foreground">{character.alias[0]}</span>}
                      </div>
                    )}
                    <div className="mt-0.5 text-xs text-muted-foreground">{character.identity}</div>
                    {fields.tagline && <div className="mt-1.5 text-sm text-muted-foreground">{character.intro}</div>}
                  </div>
                </div>

                {tagChips}
                {outfitBlock}
                {quoteBlock}
                {relationBlock}
                {eventBlock}
                {qrBlock}
              </div>
            ) : (
              <div className="flex">
                <div className="flex w-40 shrink-0 flex-col items-center justify-center gap-3 p-4" style={{ background: `${themeColor}14` }}>
                  {fields.avatar && avatar}
                  {fields.tags && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {character.personalityTags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 p-5">
                  {fields.name && <div className="text-lg font-bold">{character.name}</div>}
                  <div className="text-xs text-muted-foreground">{character.identity}</div>
                  {fields.tagline && <div className="mt-1.5 text-sm text-muted-foreground">{character.intro}</div>}
                  {outfitBlock}
                  {quoteBlock}
                  {relationBlock}
                  {eventBlock}
                  <div className="mt-3 flex items-end justify-between">
                    <div />
                    {qrBlock}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右：AI 气质提示词 */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border/60 p-4 xl:block">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            AI 核心气质提示词
          </div>
          <Button className="w-full" onClick={genPrompt} disabled={generatingPrompt}>
            {generatingPrompt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generatingPrompt ? '生成中…' : '生成提示词'}
          </Button>

          {prompt && (
            <Card className="mt-3">
              <CardContent className="p-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{prompt}</p>
                <Button size="sm" variant="outline" className="mt-3 w-full" onClick={copyPrompt}>
                  <Copy className="h-3.5 w-3.5" />
                  复制提示词
                </Button>
              </CardContent>
            </Card>
          )}

          {!prompt && !generatingPrompt && (
            <p className="mt-3 text-xs text-muted-foreground">生成一段发给画师的描述，包含关键词 + 气质 + 画面氛围。</p>
          )}
        </aside>
      </div>
    </div>
  )
}
