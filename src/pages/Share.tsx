import { Link, useParams } from 'react-router-dom'
import { Clock, Sparkles, Users } from 'lucide-react'
import { load } from '../lib/storage'
import type { Character, Relation, TimelineEvent } from '../types'

export default function Share() {
  const { token } = useParams()
  const character = token ? (load<Character>('characters').find((c) => c.id === token) ?? null) : null

  if (!character) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold">链接已失效</p>
        <p className="text-sm text-muted-foreground">该角色可能已被删除，或分享链接无效。</p>
        <Link to="/" className="text-sm font-medium text-primary hover:underline">
          返回项目
        </Link>
      </div>
    )
  }

  const characters = load<Character>('characters')
  const relations = load<Relation>('relations').filter((r) => r.sourceId === character.id || r.targetId === character.id)
  const events = load<TimelineEvent>('timeline')
    .filter((e) => e.characterIds.includes(character.id))
    .sort((a, b) => a.calendarYear - b.calendarYear)
    .slice(0, 3)

  const themeColor = character.themeColor || '#7c3aed'

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-4 py-6">
        {/* 网页名片 */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
          <div className="h-24" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}99)` }} />
          <div className="p-5">
            <div className="flex items-center gap-4">
              {character.avatar ? (
                <img src={character.avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-white" />
              ) : (
                <span
                  className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold text-white ring-2 ring-white"
                  style={{ backgroundColor: themeColor }}
                >
                  {character.name.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0">
                <h1 className="text-xl font-bold">{character.name}</h1>
                <p className="text-sm text-muted-foreground">{character.identity}</p>
              </div>
            </div>
            {character.intro && <p className="mt-3 text-sm text-muted-foreground">{character.intro}</p>}
            {character.personalityTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {character.personalityTags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 关键关系 */}
        {relations.length > 0 && (
          <section className="mt-5">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <Users className="h-4 w-4 text-muted-foreground" />
              关键关系
            </h2>
            <div className="mt-2 space-y-2">
              {relations.map((r) => {
                const otherId = r.sourceId === character.id ? r.targetId : r.sourceId
                const other = characters.find((c) => c.id === otherId)
                return (
                  <div key={r.id} className="flex items-center gap-2.5 rounded-lg border bg-card p-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: other?.themeColor || '#94a3b8' }}
                    >
                      {other?.name.slice(0, 1) ?? '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{other?.name ?? '?'}</div>
                      <div className="text-xs text-muted-foreground">{r.label || r.type}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 最近事件 */}
        {events.length > 0 && (
          <section className="mt-5">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <Clock className="h-4 w-4 text-muted-foreground" />
              最近事件
            </h2>
            <div className="mt-2 space-y-2">
              {events.map((e) => (
                <div key={e.id} className="rounded-lg border bg-card p-3">
                  <div className="text-xs tabular-nums text-muted-foreground">{e.displayDate}</div>
                  <div className="mt-0.5 text-sm font-medium">{e.title}</div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{e.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 拉新浮动按钮 */}
      <Link
        to="/share-card"
        className="fixed bottom-5 right-5 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Sparkles className="h-4 w-4" />
        我也要制作 OC 名片
      </Link>
    </div>
  )
}
