import { useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle, ArrowDown, Copy, Info, Loader2, ShieldCheck, Sparkles, X } from 'lucide-react'
import { load, loadByWorld } from '../lib/storage'
import { buildWorldContext, checkConsistency, streamCharacterDialog } from '../lib/deepseek'
import type { Character, CodexEntry, ConsistencyIssue, Relation, TimelineEvent } from '../types'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Textarea } from '../components/ui/input'
import { toast } from '../components/ui/toast'

const SCENES = ['日常', '冲突', '求助', '告白', '战斗前']

const LEVEL_META = {
  严重: { icon: AlertCircle, badge: 'border-red-200 bg-red-50 text-red-600', border: 'border-red-200' },
  提醒: { icon: AlertTriangle, badge: 'border-amber-200 bg-amber-50 text-amber-600', border: 'border-amber-200' },
  建议: { icon: Info, badge: 'border-blue-200 bg-blue-50 text-blue-600', border: 'border-blue-200' },
} as const

function splitLine(line: string) {
  const idx = line.includes('：') ? line.indexOf('：') : line.indexOf(':')
  if (idx < 0) return { speaker: '', text: line.trim() }
  return { speaker: line.slice(0, idx).trim(), text: line.slice(idx + 1).trim() }
}

function matchCitations(text: string, characters: Character[]): string[] {
  const cites: string[] = []
  for (const c of characters) {
    for (const tag of c.personalityTags) {
      if (text.includes(tag)) cites.push(`${c.name}·性格·${tag}`)
    }
    if (c.faction && text.includes(c.faction)) cites.push(`${c.name}·阵营`)
  }
  for (const c of characters) {
    if (text.includes(c.name)) cites.push(`角色·${c.name}`)
  }
  return [...new Set(cites)]
}

export default function Consistency() {
  const characters = loadByWorld<Character>('characters')
  const relations = loadByWorld<Relation>('relations')
  const events = loadByWorld<TimelineEvent>('timeline')
  const codex = loadByWorld<CodexEntry>('codex')
  const worldContext = useMemo(() => buildWorldContext(), [])

  const [characterId, setCharacterId] = useState(characters[0]?.id ?? '')
  const [scene, setScene] = useState('日常')
  const [dialogText, setDialogText] = useState('')
  const [generating, setGenerating] = useState(false)

  const [checkText, setCheckText] = useState('')
  const [checking, setChecking] = useState(false)
  const [checked, setChecked] = useState(false)
  const [issues, setIssues] = useState<ConsistencyIssue[]>([])
  const [viewSource, setViewSource] = useState<{ title: string; content: string } | null>(null)

  const lines = useMemo(() => {
    return dialogText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const { speaker, text } = splitLine(line)
        return { speaker, text, citations: matchCitations(text, characters) }
      })
      .slice(0, 6)
  }, [dialogText, characters])

  const dialogPlainText = lines.map((l) => `${l.speaker}：${l.text}`).join('\n')

  async function generate() {
    if (!characterId) {
      toast('请选择角色', 'error')
      return
    }
    setGenerating(true)
    setDialogText('')
    await streamCharacterDialog(
      characterId,
      scene,
      worldContext,
      (delta) => setDialogText((prev) => prev + delta),
      () => setGenerating(false),
      () => {
        toast('AI 调用失败，已切换演示模式', 'info')
        setGenerating(false)
      },
    )
  }

  function copyDialog() {
    if (!dialogPlainText) return
    navigator.clipboard.writeText(dialogPlainText).then(
      () => toast('已复制对话', 'success'),
      () => toast('复制失败', 'error'),
    )
  }

  function fillFromDialog() {
    if (!dialogPlainText) {
      toast('请先生成对话', 'error')
      return
    }
    setCheckText(dialogPlainText)
    toast('已填入左侧对话', 'success')
  }

  async function runCheck() {
    const text = checkText.trim()
    if (!text) {
      toast('请先输入或提取待检查文本', 'error')
      return
    }
    setChecking(true)
    setChecked(false)
    setIssues([])
    try {
      const result = await checkConsistency(text, worldContext)
      setIssues(result)
      setChecked(true)
    } finally {
      setChecking(false)
    }
  }

  function citationFor(issue: ConsistencyIssue): string {
    const label = { character: '档案', timeline: '时间轴', relation: '关系图', codex: '图鉴' }[issue.sourceType]
    let name = issue.sourceId
    if (issue.sourceType === 'character') name = characters.find((c) => c.id === issue.sourceId)?.name ?? issue.sourceId
    if (issue.sourceType === 'timeline') name = events.find((e) => e.id === issue.sourceId)?.title ?? issue.sourceId
    if (issue.sourceType === 'relation') name = relations.find((r) => r.id === issue.sourceId)?.label ?? issue.sourceId
    if (issue.sourceType === 'codex') name = codex.find((e) => e.id === issue.sourceId)?.title ?? issue.sourceId
    return `${name} · ${label}`
  }

  function openSource(issue: ConsistencyIssue) {
    let resolved: { title: string; content: string } | null = null
    if (issue.sourceType === 'character') {
      const c = characters.find((x) => x.id === issue.sourceId)
      if (c) {
        resolved = {
          title: `${c.name} · 角色档案`,
          content: `身份：${c.identity}\n阵营：${c.faction}\n年龄：${c.age}\n性格：${c.personalityTags.join('、')}\n外貌：${c.appearance}\n\n${c.longBio}`,
        }
      }
    } else if (issue.sourceType === 'timeline') {
      const e = events.find((x) => x.id === issue.sourceId)
      if (e) resolved = { title: `${e.title} · 时间轴`, content: `${e.displayDate}\n${e.description}` }
    } else if (issue.sourceType === 'relation') {
      const r = relations.find((x) => x.id === issue.sourceId)
      if (r) resolved = { title: `${r.label} · 关系`, content: `类型：${r.type}\n${r.note}` }
    } else if (issue.sourceType === 'codex') {
      const e = codex.find((x) => x.id === issue.sourceId)
      if (e) resolved = { title: `${e.title} · 图鉴`, content: e.content }
    }
    if (!resolved) {
      toast('未找到关联设定', 'info')
      return
    }
    setViewSource(resolved)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-4">
        <h1 className="text-sm font-semibold">设定一致性检查与对话预览</h1>
        {dialogPlainText && (
          <Button size="sm" variant="outline" onClick={copyDialog}>
            <Copy className="h-3.5 w-3.5" />
            复制对话
          </Button>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 左：角色对话预览 */}
        <div className="min-w-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">选择角色</label>
                    <select
                      value={characterId}
                      onChange={(e) => setCharacterId(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none"
                    >
                      {characters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">预设场景</label>
                    <select
                      value={scene}
                      onChange={(e) => setScene(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none"
                    >
                      {SCENES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button className="w-full" onClick={generate} disabled={generating}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? 'AI 生成中…' : '生成对话预览'}
                </Button>
              </CardContent>
            </Card>

            <div className="mt-5 space-y-4">
              {lines.map((line, i) => {
                const c = characters.find((x) => x.name === line.speaker)
                const color = c?.themeColor ?? '#94a3b8'
                return (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: color }}
                      >
                        {line.speaker.slice(0, 1) || '?'}
                      </span>
                      <span className="text-sm font-medium">{line.speaker || '旁白'}</span>
                    </div>
                    <div className="ml-9">
                      <div className="inline-block rounded-2xl rounded-tl-sm border bg-card px-3 py-2 text-sm shadow-sm">
                        {line.text}
                      </div>
                      {line.citations.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {line.citations.map((cit) => (
                            <span
                              key={cit}
                              className="inline-flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground"
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              引用自 {cit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {generating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在生成对话…
                </div>
              )}

              {!generating && dialogText === '' && (
                <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
                  选择角色与场景，点击「生成对话预览」
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右：设定一致性检查 */}
        <aside className="flex w-[420px] shrink-0 flex-col border-l border-border/60">
          <div className="border-b border-border/60 px-4 py-3 text-sm font-medium">设定一致性检查</div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <Textarea
              value={checkText}
              onChange={(e) => setCheckText(e.target.value)}
              placeholder="粘贴同人文或自己写的草稿，检查是否存在设定冲突…"
              className="min-h-[140px]"
            />

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fillFromDialog}>
                <ArrowDown className="h-3.5 w-3.5" />
                提取左侧对话
              </Button>
              <Button size="sm" className="flex-1" onClick={runCheck} disabled={checking}>
                {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                {checking ? '检查中…' : '开始检查'}
              </Button>
            </div>

            {checking && (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在对照角色档案 / 时间轴 / 关系图检查…
              </div>
            )}

            {!checking && checked && issues.length === 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                未发现明显设定冲突。
              </div>
            )}

            {!checking && checked && issues.length > 0 && (
              <div className="space-y-3">
                {issues.map((issue) => {
                  const meta = LEVEL_META[issue.level]
                  const Icon = meta.icon
                  return (
                    <div key={issue.id} className={`rounded-lg border ${meta.border} bg-card p-3`}>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}>
                        <Icon className="h-3 w-3" />
                        {issue.level}
                      </span>
                      <p className="mt-2 text-sm">{issue.message}</p>
                      {issue.suggestion && <p className="mt-1 text-xs text-muted-foreground">建议：{issue.suggestion}</p>}
                      <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
                        <span className="text-[11px] text-muted-foreground">引用自：{citationFor(issue)}</span>
                        <button onClick={() => openSource(issue)} className="text-xs font-medium text-primary hover:underline">
                          查看原设定
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {!checking && !checked && (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                粘贴文本或提取左侧对话后，点击「开始检查」
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 查看原设定弹窗 */}
      {viewSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewSource(null)} />
          <div className="relative w-full max-w-md rounded-xl border bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{viewSource.title}</h3>
              <button onClick={() => setViewSource(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{viewSource.content}</p>
          </div>
        </div>
      )}
    </div>
  )
}
