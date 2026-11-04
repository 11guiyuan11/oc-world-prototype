import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Pencil, Plus, ZoomIn, ZoomOut } from 'lucide-react'
import { load, loadByWorld, upsert } from '../lib/storage'
import type { Character, MapNode, TimelineEvent, World } from '../types'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { toast } from '../components/ui/toast'
import { cn } from '../lib/utils'
import TimelineEventModal from '../components/TimelineEventModal'

const FORMATS = [
  { value: 'nameYear', label: '星历 298 年' },
  { value: 'yearOnly', label: '298 年' },
  { value: 'noUnit', label: '星历 298' },
]

function formatYear(year: number, name: string, format: string): string {
  if (format === 'yearOnly') return `${year} 年`
  if (format === 'noUnit') return `${name} ${year}`
  return `${name} ${year} 年`
}

interface EventCardProps {
  event: TimelineEvent
  dateLabel: string
  characters: Character[]
  mapNodes: MapNode[]
  onEdit: (event: TimelineEvent) => void
}

function EventCard({ event, dateLabel, characters, mapNodes, onEdit }: EventCardProps) {
  const mapNode = event.mapNodeId ? mapNodes.find((m) => m.id === event.mapNodeId) : null
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs tabular-nums text-muted-foreground">{dateLabel}</span>
          <button onClick={() => onEdit(event)} className="text-muted-foreground hover:text-foreground" aria-label="编辑事件">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-1 text-sm font-semibold">{event.title}</div>
        {event.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{event.description}</p>
        )}
        {event.image && <img src={event.image} alt="" className="mt-2 h-20 w-full rounded-md object-cover" />}
        <div className="mt-2 flex flex-wrap gap-1">
          {event.characterIds.map((id) => {
            const c = characters.find((x) => x.id === id)
            if (!c) return null
            return (
              <Link
                key={id}
                to={`/characters/${id}`}
                className="rounded-full px-1.5 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: `${c.themeColor}1a`, color: c.themeColor }}
              >
                {c.name}
              </Link>
            )
          })}
          {mapNode && (
            <Link
              to="/codex"
              className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              <MapPin className="h-3 w-3" />
              {mapNode.name}
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Timeline() {
  const worlds = load<World>('worlds')
  const world = worlds[0]
  const characters = loadByWorld<Character>('characters')
  const mapNodes = loadByWorld<MapNode>('mapNodes')
  const allEvents = loadByWorld<TimelineEvent>('timeline')

  const [calendarName, setCalendarName] = useState(world?.calendarName ?? '星历')
  const [calendarStart, setCalendarStart] = useState(String(world?.calendarStart ?? 0))
  const [format, setFormat] = useState('nameYear')
  const [view, setView] = useState<'horizontal' | 'vertical'>('horizontal')
  const [charFilter, setCharFilter] = useState('all')
  const [mapFilter, setMapFilter] = useState('all')
  const [zoom, setZoom] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<TimelineEvent | null>(null)

  function saveCalendar() {
    if (!world) return
    upsert('worlds', {
      ...world,
      calendarName: calendarName.trim() || '星历',
      calendarStart: Number(calendarStart) || 0,
    })
    toast('纪年设置已保存', 'success')
  }

  const filtered = useMemo(() => {
    return allEvents
      .filter((e) => charFilter === 'all' || e.characterIds.includes(charFilter))
      .filter((e) => mapFilter === 'all' || e.mapNodeId === mapFilter)
      .sort((a, b) => a.calendarYear - b.calendarYear)
  }, [allEvents, charFilter, mapFilter])

  function handleSave(ev: TimelineEvent) {
    upsert('timeline', ev)
    setShowModal(false)
    setEditing(null)
    toast(editing ? '事件已保存' : '事件已创建', 'success')
  }

  function openNew() {
    setEditing(null)
    setShowModal(true)
  }

  function openEdit(ev: TimelineEvent) {
    setEditing(ev)
    setShowModal(true)
  }

  const minYear = filtered.length ? filtered[0].calendarYear : 0
  const maxYear = filtered.length ? filtered[filtered.length - 1].calendarYear : 1
  const pxPerYear = 70 * zoom
  const totalWidth = 400 + (Math.max(maxYear - minYear, 1) * pxPerYear)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* 顶部 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">时间轴</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-secondary p-1">
            <button
              onClick={() => setView('horizontal')}
              className={cn('rounded-md px-3 py-1 text-xs font-medium transition-colors', view === 'horizontal' ? 'bg-card shadow-sm' : 'text-muted-foreground')}
            >
              横向
            </button>
            <button
              onClick={() => setView('vertical')}
              className={cn('rounded-md px-3 py-1 text-xs font-medium transition-colors', view === 'vertical' ? 'bg-card shadow-sm' : 'text-muted-foreground')}
            >
              纵向
            </button>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            新增事件
          </Button>
        </div>
      </div>

      {/* 纪年设置 + 筛选 */}
      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">纪年名称</label>
          <Input
            value={calendarName}
            onChange={(e) => setCalendarName(e.target.value)}
            onBlur={saveCalendar}
            className="h-8 w-28 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">起点</label>
          <Input
            value={calendarStart}
            onChange={(e) => setCalendarStart(e.target.value)}
            onBlur={saveCalendar}
            type="number"
            className="h-8 w-20 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">显示格式</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="h-8 rounded-md border border-input bg-card px-2 text-sm focus:outline-none"
          >
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1" />

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">按角色</label>
          <select
            value={charFilter}
            onChange={(e) => setCharFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-card px-2 text-sm focus:outline-none"
          >
            <option value="all">全部角色</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">按地区</label>
          <select
            value={mapFilter}
            onChange={(e) => setMapFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-card px-2 text-sm focus:outline-none"
          >
            <option value="all">全部地区</option>
            {mapNodes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {view === 'horizontal' && (
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} className="rounded-md border p-1.5 hover:bg-secondary" aria-label="缩小">
              <ZoomOut className="h-4 w-4" />
            </button>
            <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))} className="rounded-md border p-1.5 hover:bg-secondary" aria-label="放大">
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* 时间轴主体 */}
      <div className="mt-6">
        {allEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
            <p className="font-medium">时间轴还是空的</p>
            <p className="mt-1 text-sm text-muted-foreground">添加第一个事件，梳理你的世界观时间线。</p>
            <Button className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4" />
              新增事件
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
            <p className="font-medium">无筛选结果</p>
            <p className="mt-1 text-sm text-muted-foreground">试试调整角色或地区筛选。</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setCharFilter('all')
                setMapFilter('all')
              }}
            >
              清除筛选
            </Button>
          </div>
        ) : view === 'horizontal' ? (
          <div className="overflow-x-auto pb-4">
            <div className="relative" style={{ width: totalWidth, minHeight: 420 }}>
              <div className="absolute left-[200px] right-[200px] top-1/2 h-px bg-border" />
              {filtered.map((e, i) => {
                const x = 200 + (e.calendarYear - minYear) * pxPerYear
                const above = i % 2 === 0
                return (
                  <div key={e.id} className="absolute" style={{ left: x, top: '50%' }}>
                    <div className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-card" />
                    <div className={cn('absolute w-60 -translate-x-1/2', above ? 'bottom-4' : 'top-4')}>
                      <EventCard
                        event={e}
                        dateLabel={formatYear(e.calendarYear, calendarName, format)}
                        characters={characters}
                        mapNodes={mapNodes}
                        onEdit={openEdit}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="relative mx-auto max-w-2xl">
            <div className="absolute bottom-2 left-[5px] top-2 w-px bg-border" />
            <div className="space-y-4">
              {filtered.map((e) => (
                <div key={e.id} className="relative pl-8">
                  <div className="absolute left-0 top-5 h-3 w-3 rounded-full border-2 border-primary bg-card" />
                  <EventCard
                    event={e}
                    dateLabel={formatYear(e.calendarYear, calendarName, format)}
                    characters={characters}
                    mapNodes={mapNodes}
                    onEdit={openEdit}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <TimelineEventModal
          calendarName={calendarName}
          characters={characters}
          mapNodes={mapNodes}
          event={editing}
          onClose={() => {
            setShowModal(false)
            setEditing(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
