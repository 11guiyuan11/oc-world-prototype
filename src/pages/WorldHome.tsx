import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Clock,
  GitFork,
  Loader2,
  Map as MapIcon,
  Pencil,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { load, upsert } from '../lib/storage'
import { streamChat } from '../lib/deepseek'
import type { Character, MapNode, Relation, ShareCard, TimelineEvent, World } from '../types'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Textarea } from '../components/ui/input'
import { toast } from '../components/ui/toast'
import { cn } from '../lib/utils'

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

function timeAgo(ts?: number) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const h = Math.floor(diff / 3600_000)
  if (h < 1) return '刚刚'
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

function StatCard({
  label,
  value,
  icon: Icon,
  to,
  color,
}: {
  label: string
  value: number
  icon: LucideIcon
  to: string
  color: string
}) {
  const n = useCountUp(value)
  return (
    <Link to={to}>
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums">{n}</div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function WorldHome() {
  const { id } = useParams()
  const worlds = load<World>('worlds')
  const characters = load<Character>('characters')
  const relations = load<Relation>('relations')
  const timeline = load<TimelineEvent>('timeline')
  const mapNodes = load<MapNode>('mapNodes')
  const shareCards = load<ShareCard>('shareCards')

  const world = worlds.find((w) => w.id === id) ?? worlds[0]

  const [editing, setEditing] = useState(false)
  const [descDraft, setDescDraft] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState('')

  if (!world) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">尚未创建世界观</h1>
        <p className="mt-2 text-muted-foreground">先创建一个世界观，再开始你的创作。</p>
        <Link to="/onboarding/world" className="mt-5 inline-block">
          <Button>新建世界观</Button>
        </Link>
      </div>
    )
  }

  const stats = [
    { label: '角色', value: characters.length, icon: Users, to: '/characters', color: '#6366f1' },
    { label: '关系', value: relations.length, icon: GitFork, to: '/relations', color: '#ec4899' },
    { label: '事件', value: timeline.length, icon: Clock, to: '/timeline', color: '#f59e0b' },
    { label: '地图节点', value: mapNodes.length, icon: MapIcon, to: '/codex', color: '#10b981' },
  ]

  const todos: { text: string; to: string }[] = []
  if (characters.length === 0) todos.push({ text: '创建第一个角色', to: '/characters' })
  else if (characters.length < 3) todos.push({ text: `再添加 ${3 - characters.length} 个角色`, to: '/characters' })
  if (relations.length === 0) todos.push({ text: '绘制第一条关系线', to: '/relations' })
  else if (relations.length < 5) todos.push({ text: '完善人物关系网', to: '/relations' })
  if (timeline.length === 0) todos.push({ text: '添加第一个时间轴事件', to: '/timeline' })
  if (mapNodes.length < 3) todos.push({ text: '扩展地图层级', to: '/codex' })
  if (shareCards.length === 0) todos.push({ text: '生成第一张展示卡', to: '/share-card' })

  const recent = useMemo(() => {
    const items = [
      ...characters.map((c) => ({
        key: c.id,
        kind: 'character' as const,
        title: c.name,
        sub: c.identity,
        updatedAt: c.updatedAt ?? 0,
        to: `/characters/${c.id}`,
        color: c.themeColor,
      })),
      ...timeline.map((e) => ({
        key: e.id,
        kind: 'event' as const,
        title: e.title,
        sub: e.displayDate,
        updatedAt: e.updatedAt ?? 0,
        to: '/timeline',
        color: '',
      })),
    ]
    return items.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)
  }, [characters, timeline])

  const coverIsImage = world.cover?.startsWith('data:')
  const coverBg = coverIsImage
    ? undefined
    : world.cover?.startsWith('linear-gradient')
      ? world.cover
      : 'linear-gradient(135deg, #1e293b 0%, #4c1d95 100%)'

  function startEdit() {
    setDescDraft(world.description)
    setEditing(true)
  }

  function saveDesc() {
    upsert('worlds', { ...world, description: descDraft })
    setEditing(false)
    toast('简介已保存', 'success')
  }

  async function generateSummary() {
    setShowSummary(true)
    setSummarizing(true)
    setSummary('')
    await streamChat(
      [
        {
          role: 'system',
          content: '你是世界观摘要生成器。请用 3-5 句话概括这个世界观的核心设定、主要势力与主线冲突。用中文。',
        },
        {
          role: 'user',
          content: `世界观：${world.name}\n简介：${world.tagline}\n描述：${world.description}\n角色：${characters
            .map((c) => `${c.name}(${c.identity})`)
            .join('、')}`,
        },
      ],
      (delta) => setSummary((s) => s + delta),
      () => setSummarizing(false),
      () => {
        toast('AI 调用失败，已切换演示模式', 'info')
        setSummarizing(false)
      },
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {/* 封面区 */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60">
        {coverIsImage ? (
          <img src={world.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: coverBg }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

        <div className="relative p-6 text-white sm:p-9">
          <p className="text-xs font-medium uppercase tracking-widest text-white/70">
            {world.calendarName} · {world.era}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{world.name}</h1>
          <p className="mt-2 text-white/80">{world.tagline}</p>

          {editing ? (
            <div className="mt-4 max-w-2xl">
              <Textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                className="min-h-[100px] border-white/20 bg-white/10 text-white placeholder:text-white/50"
              />
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={saveDesc}>
                  <Check className="h-4 w-4" />
                  保存
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-white">
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-3 line-clamp-3 max-w-2xl text-sm text-white/80">
              {world.description || '还没有描述，点击编辑补充世界观简介。'}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={startEdit}>
              <Pencil className="h-3.5 w-3.5" />
              编辑简介
            </Button>
            <Button size="sm" variant="secondary" onClick={generateSummary} disabled={summarizing}>
              {summarizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              AI 生成摘要
            </Button>
          </div>
        </div>
      </section>

      {/* AI 摘要面板 */}
      {showSummary && (
        <Card className="border-primary/20">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                AI 生成 · 世界观摘要
              </span>
              <button onClick={() => setShowSummary(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {summarizing ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在生成摘要…
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{summary}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 统计卡片 */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      {/* 待办清单 + 最近编辑 */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 text-sm font-semibold">待办清单</h2>
            {todos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Check className="h-8 w-8 text-green-500" />
                <p className="mt-2 text-sm text-muted-foreground">基础设定已齐备，继续丰富细节吧</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {todos.map((t) => (
                  <li key={t.text}>
                    <Link
                      to={t.to}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary/60"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground group-hover:border-primary group-hover:text-primary">
                        <Check className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                      </span>
                      <span className="flex-1 text-sm">{t.text}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 text-sm font-semibold">最近编辑</h2>
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">还没有编辑记录</p>
            ) : (
              <ul className="space-y-1">
                {recent.map((r) => (
                  <li key={r.key}>
                    <Link to={r.to} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary/60">
                      {r.kind === 'character' ? (
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: r.color || '#94a3b8' }}
                        >
                          {r.title.slice(0, 1)}
                        </span>
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <Clock className="h-4 w-4" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{r.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{r.sub}</div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(r.updatedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 快捷入口 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">快捷入口</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { to: '/characters', label: '角色库', desc: '管理角色档案', icon: Users },
            { to: '/relations', label: '关系图', desc: '编织人物羁绊', icon: GitFork },
            { to: '/share-card', label: '展示卡', desc: '生成分享名片', icon: Sparkles },
            { to: '/consistency', label: '设定检查', desc: '一致性校验', icon: Check },
          ].map((q) => {
            const Icon = q.icon
            return (
              <Link key={q.to} to={q.to}>
                <Card className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-4">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    <div className="mt-2 text-sm font-medium">{q.label}</div>
                    <div className="text-xs text-muted-foreground">{q.desc}</div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
