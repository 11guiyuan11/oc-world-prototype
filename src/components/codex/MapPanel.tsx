import { Fragment, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { ArrowLeft, ChevronRight, MapPin, Trash2, Upload, X } from 'lucide-react'
import { load, loadByWorld, readFileAsDataURL, upsert } from '../../lib/storage'
import type { Character, CodexEntry, MapMarker, MapNode, TimelineEvent } from '../../types'
import { Button } from '../ui/button'
import { toast } from '../ui/toast'
import { cn } from '../../lib/utils'
import MapMarkerModal from './MapMarkerModal'
import MapCanvas from './MapCanvas'

export default function MapPanel() {
  const [nodes, setNodes] = useState<MapNode[]>(() => loadByWorld<MapNode>('mapNodes'))
  const codex = useMemo(() => loadByWorld<CodexEntry>('codex'), [])
  const characters = useMemo(() => loadByWorld<Character>('characters'), [])
  const events = useMemo(() => loadByWorld<TimelineEvent>('timeline'), [])

  const root = nodes.find((n) => n.parentId === null) ?? nodes[0]
  const [currentId, setCurrentId] = useState<string | null>(root?.id ?? null)
  const [draftPos, setDraftPos] = useState<{ x: number; y: number } | null>(null)
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const currentNode = nodes.find((n) => n.id === currentId) ?? root
  const children = nodes.filter((n) => n.parentId === currentNode?.id)

  const ancestors = useMemo(() => {
    const path: MapNode[] = []
    const seen = new Set<string>()
    let cur: MapNode | undefined = currentNode
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id)
      path.unshift(cur)
      cur = cur.parentId ? nodes.find((n) => n.id === cur!.parentId) : undefined
    }
    return path
  }, [currentNode, nodes])

  const selectedMarker = currentNode?.markers.find((m) => m.id === selectedMarkerId) ?? null
  const linkedCodex = selectedMarker?.codexId ? codex.find((c) => c.id === selectedMarker.codexId) : null
  const linkedChar = selectedMarker?.characterId ? characters.find((c) => c.id === selectedMarker.characterId) : null
  const linkedEvent = selectedMarker?.eventId ? events.find((e) => e.id === selectedMarker.eventId) : null
  const linkedMap = selectedMarker?.mapNodeId ? nodes.find((n) => n.id === selectedMarker.mapNodeId) : null

  function persistNode(id: string, patch: Partial<MapNode>) {
    const target = nodes.find((n) => n.id === id)
    if (!target) return
    const updated = { ...target, ...patch }
    upsert('mapNodes', updated)
    setNodes((prev) => prev.map((n) => (n.id === id ? updated : n)))
  }

  async function uploadImage(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f || !currentNode) return
    try {
      const data = await readFileAsDataURL(f)
      persistNode(currentNode.id, { image: data })
      toast('底图已更新', 'success')
    } catch {
      toast('图片读取失败', 'error')
    }
  }

  function saveMarker(marker: MapMarker) {
    if (!currentNode) return
    persistNode(currentNode.id, { markers: [...currentNode.markers, marker] })
    setDraftPos(null)
    toast('标记点已添加', 'success')
  }

  function deleteMarker(id: string) {
    if (!currentNode) return
    persistNode(currentNode.id, { markers: currentNode.markers.filter((m) => m.id !== id) })
    setSelectedMarkerId(null)
  }

  if (!currentNode) {
    return <div className="p-6 text-center text-sm text-muted-foreground">暂无地图节点</div>
  }

  return (
    <div className="flex h-full flex-col">
      {/* 面包屑 + 层级 */}
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-1 text-sm">
          {ancestors.map((n, i) => (
            <Fragment key={n.id}>
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              <button
                onClick={() => setCurrentId(n.id)}
                className={cn(
                  'truncate',
                  i === ancestors.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {n.name}
              </button>
            </Fragment>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {currentNode.parentId && (
            <Button variant="outline" size="sm" className="h-7" onClick={() => setCurrentId(currentNode.parentId!)}>
              <ArrowLeft className="h-3.5 w-3.5" />
              返回上一级
            </Button>
          )}
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setCurrentId(c.id)}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs hover:bg-secondary/70"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 画布 + 标记详情 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">滚轮缩放 · 拖拽平移 · 点击添加标记</span>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <Upload className="h-3.5 w-3.5" />
            上传底图
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadImage} />
        </div>

        <MapCanvas
          node={currentNode}
          onAddMarker={(pos) => setDraftPos(pos)}
          onSelectMarker={(id) => setSelectedMarkerId(id)}
        />

        {/* 标记详情 Popover */}
        {selectedMarker && (
          <div className="mt-3 rounded-lg border bg-card p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" style={{ color: selectedMarker.color || '#7c3aed' }} fill="currentColor" />
                <span className="text-sm font-medium">{selectedMarker.name}</span>
              </div>
              <button onClick={() => setSelectedMarkerId(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {linkedCodex && (
              <div className="mt-2 rounded-md bg-secondary/50 p-2 text-xs">
                <div className="font-medium">图鉴 · {linkedCodex.title}</div>
                <p className="mt-0.5 line-clamp-2 text-muted-foreground">{linkedCodex.content}</p>
              </div>
            )}
            {linkedChar && (
              <div className="mt-2 rounded-md bg-secondary/50 p-2 text-xs">
                <div className="font-medium">角色 · {linkedChar.name}</div>
                <p className="mt-0.5 line-clamp-2 text-muted-foreground">{linkedChar.intro}</p>
              </div>
            )}
            {linkedEvent && (
              <div className="mt-2 rounded-md bg-secondary/50 p-2 text-xs">
                <div className="font-medium">事件 · {linkedEvent.title}</div>
                <p className="mt-0.5 line-clamp-2 text-muted-foreground">{linkedEvent.description}</p>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              {linkedMap && (
                <Button
                  size="sm"
                  onClick={() => {
                    setCurrentId(linkedMap.id)
                    setSelectedMarkerId(null)
                  }}
                >
                  进入 {linkedMap.name}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => deleteMarker(selectedMarker.id)}>
                <Trash2 className="h-3.5 w-3.5" />
                删除
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 添加标记弹窗 */}
      {draftPos && currentNode && (
        <MapMarkerModal
          position={draftPos}
          children={children}
          codex={codex}
          characters={characters}
          events={events}
          onClose={() => setDraftPos(null)}
          onSave={saveMarker}
        />
      )}
    </div>
  )
}
