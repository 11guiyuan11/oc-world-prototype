import { Link } from 'react-router-dom'
import { ArrowRight, Clock, GitFork } from 'lucide-react'
import type { Character, Relation, TimelineEvent } from '../../types'
import { load, loadByWorld } from '../../lib/storage'

export function RelationsSummary({ character }: { character: Character }) {
  const characters = loadByWorld<Character>('characters')
  const relations = loadByWorld<Relation>('relations').filter(
    (r) => r.sourceId === character.id || r.targetId === character.id,
  )

  if (relations.length === 0) {
    return <Empty text="该角色还没有关系，去关系图里连线吧" to="/relations" />
  }

  return (
    <div className="space-y-2">
      {relations.map((r) => {
        const otherId = r.sourceId === character.id ? r.targetId : r.sourceId
        const other = characters.find((c) => c.id === otherId)
        const direction = r.sourceId === character.id ? '→' : '←'
        return (
          <Link
            key={r.id}
            to={other ? `/characters/${other.id}` : '/relations'}
            className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-secondary/50"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: other?.themeColor || '#94a3b8' }}
            >
              {other?.name.slice(0, 1) ?? '?'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-medium">{character.name}</span>
                <span className="text-muted-foreground">{direction}</span>
                <span className="font-medium">{other?.name ?? '未知'}</span>
                <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">{r.type}</span>
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {r.label}
                {r.note ? ` · ${r.note}` : ''}
              </div>
            </div>
            <GitFork className="h-4 w-4 shrink-0 text-muted-foreground/50" style={{ color: r.color }} />
          </Link>
        )
      })}
    </div>
  )
}

export function TimelineSummary({ character }: { character: Character }) {
  const events = loadByWorld<TimelineEvent>('timeline')
    .filter((e) => e.characterIds.includes(character.id))
    .sort((a, b) => a.calendarYear - b.calendarYear)

  if (events.length === 0) {
    return <Empty text="该角色还没有关联事件" to="/timeline" />
  }

  return (
    <div className="space-y-2">
      {events.map((e) => (
        <Link
          key={e.id}
          to="/timeline"
          className="flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-secondary/50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Clock className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{e.displayDate}</span>
              <span className="truncate text-sm font-medium">{e.title}</span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{e.description}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        </Link>
      ))}
    </div>
  )
}

function Empty({ text, to }: { text: string; to: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link to={to} className="mt-3 text-sm font-medium text-primary hover:underline">
        前往查看
      </Link>
    </div>
  )
}
