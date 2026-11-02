import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, Clock, Plus, Share2, Users } from 'lucide-react'
import { load } from '../lib/storage'
import type { Character, Relation, ShareCard, TimelineEvent, World } from '../types'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import ProgressRing from '../components/ProgressRing'
import { cn } from '../lib/utils'

type StepState = 'done' | 'active' | 'todo'

function stateOf(p: number): StepState {
  if (p >= 1) return 'done'
  if (p > 0) return 'active'
  return 'todo'
}

export default function Home() {
  const worlds = load<World>('worlds')
  const characters = load<Character>('characters')
  const relations = load<Relation>('relations')
  const timeline = load<TimelineEvent>('timeline')
  const shareCards = load<ShareCard>('shareCards')

  const world = worlds[0]

  const steps = [
    {
      key: 'world',
      title: '建地基',
      desc: '创建世界观，定下时代与基调',
      progress: world ? 1 : 0,
      todo: world ? 0 : 1,
      to: world ? `/world/${world.id}` : '/onboarding/world',
      cta: world ? '查看世界观' : '创建世界观',
    },
    {
      key: 'characters',
      title: '捏泥人',
      desc: '添加角色，完善档案与外观',
      progress: Math.min(characters.length / 3, 1),
      todo: Math.max(3 - characters.length, 0),
      to: '/characters',
      cta: '管理角色',
    },
    {
      key: 'relations',
      title: '连关系',
      desc: '用关系图编织人物羁绊',
      progress: Math.min(relations.length / 5, 1),
      todo: Math.max(5 - relations.length, 0),
      to: '/relations',
      cta: '编辑关系',
    },
    {
      key: 'output',
      title: '出成品',
      desc: '生成展示卡，分享给画师',
      progress: Math.min(shareCards.length / 1, 1),
      todo: Math.max(1 - shareCards.length, 0),
      to: '/share-card',
      cta: '生成展示卡',
    },
  ]

  const recentEvents = [...timeline].sort((a, b) => b.calendarYear - a.calendarYear).slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* 顶部：世界观封面与简介 */}
      {world ? (
        <section className="relative overflow-hidden rounded-xl border border-border/60">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/40" />
          <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-widest text-primary">
                {world.calendarName} · {world.era}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{world.name}</h1>
              <p className="mt-2 text-muted-foreground">{world.tagline}</p>
              {world.description && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{world.description}</p>
              )}
            </div>
            <Link to={`/world/${world.id}`}>
              <Button variant="outline" size="sm">
                进入世界观
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-border p-10 text-center">
          <h1 className="text-2xl font-bold">创建第一个世界观</h1>
          <p className="mt-2 text-muted-foreground">从一个名字开始，铺开属于你的 OC 世界。</p>
          <Link to="/onboarding/world" className="mt-5 inline-block">
            <Button>
              <Plus className="h-4 w-4" />
              新建世界观
            </Button>
          </Link>
        </section>
      )}

      {/* 四步创作进度 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">创作进度</h2>
          <span className="text-xs text-muted-foreground">
            {steps.filter((s) => s.progress >= 1).length}/{steps.length} 步完成
          </span>
        </div>

        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
          {steps.map((s, i) => {
            const st = stateOf(s.progress)
            return (
              <Fragment key={s.key}>
                {i > 0 && (
                  <div className="hidden shrink-0 lg:block lg:w-8 lg:pt-[46px]" aria-hidden="true">
                    <div className="relative h-px w-full bg-border">
                      <ChevronRight className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/50" />
                    </div>
                  </div>
                )}
                <Link to={s.to} className="block flex-1">
                  <Card
                    className={cn(
                      'h-full transition-all hover:-translate-y-0.5 hover:shadow-md',
                      st === 'active' && 'border-primary/30 ring-1 ring-primary/15',
                      st === 'todo' && 'opacity-70',
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <ProgressRing progress={s.progress} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              0{i + 1}
                            </span>
                            {st === 'done' && (
                              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-600">
                                已完成
                              </span>
                            )}
                            {st === 'active' && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                进行中
                              </span>
                            )}
                            {st === 'todo' && (
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                待开始
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-base font-semibold">{s.title}</div>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{s.desc}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                        <span className="text-xs text-muted-foreground">
                          {s.todo > 0 ? `${s.todo} 项待办` : '全部完成'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                          {s.cta}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </Fragment>
            )
          })}
        </div>
      </section>

      {/* 最近角色 / 最近事件 */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-muted-foreground" />
              最近角色
            </div>
            {characters.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">还没有角色，先去「捏泥人」吧</p>
            ) : (
              <ul className="space-y-2">
                {characters.slice(0, 3).map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/characters/${c.id}`}
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-secondary/60"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: c.themeColor || '#94a3b8' }}
                      >
                        {c.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{c.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{c.identity}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-muted-foreground" />
              最近事件
            </div>
            {recentEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">时间轴还是空的</p>
            ) : (
              <ul className="space-y-2">
                {recentEvents.map((e) => (
                  <li key={e.id}>
                    <Link
                      to="/timeline"
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-secondary/60"
                    >
                      <span className="w-20 shrink-0 text-xs tabular-nums text-muted-foreground">
                        {e.displayDate}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{e.title}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 快速生成展示卡入口 */}
      <Link to="/share-card" className="block">
        <Card className="group border-primary/20 bg-accent/30 transition-all hover:bg-accent/50">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Share2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">快速生成展示卡</div>
                <div className="text-xs text-muted-foreground">一键生成可分享的角色名片</div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
