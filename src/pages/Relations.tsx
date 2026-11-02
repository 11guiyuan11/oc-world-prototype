import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowRight, X } from 'lucide-react'
import { load, upsert } from '../lib/storage'
import type { Character, Relation } from '../types'
import CharacterNode from '../components/relations/CharacterNode'
import RelationEdge from '../components/relations/RelationEdge'
import RelationEdgeEditModal from '../components/relations/RelationEdgeEditModal'
import Relations3D from '../components/relations/Relations3D'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { toast } from '../components/ui/toast'
import { cn } from '../lib/utils'

const nodeTypes = { character: CharacterNode }
const edgeTypes = { relation: RelationEdge }

const NODE_W = 180
const NODE_H = 72

interface EdgeOffset {
  curvature: number
  labelOffsetY: number
}

// 多重边与双向边错开：按无序 pair 分组 → 分配索引 → 计算曲率与标签偏移
function computeEdgeOffsets(relations: Relation[]): Map<string, EdgeOffset> {
  const result = new Map<string, EdgeOffset>()

  // 同源同目标、或互为反方向，都归入同一组（无序 pair 为 key）
  const groups = new Map<string, Relation[]>()
  for (const r of relations) {
    const key = [r.sourceId, r.targetId].sort().join('|')
    const list = groups.get(key) ?? []
    list.push(r)
    groups.set(key, list)
  }

  for (const edges of groups.values()) {
    const total = edges.length
    if (total === 1) {
      result.set(edges[0].id, { curvature: 0, labelOffsetY: 0 })
      continue
    }

    const sorted = [...edges].sort((a, b) => a.id.localeCompare(b.id))

    sorted.forEach((edge, index) => {
      const center = index - (total - 1) / 2
      let curvature: number
      if (total === 2) {
        const bidirectional =
          sorted[0].sourceId === sorted[1].targetId && sorted[0].targetId === sorted[1].sourceId
        const mag = bidirectional ? 0.4 : 0.5
        curvature = index === 0 ? mag : -mag
      } else {
        curvature = center * 0.4
      }
      result.set(edge.id, { curvature, labelOffsetY: center * 30 })
    })
  }

  return result
}

function buildNodes(characters: Character[]): Node[] {
  const nodes: Node[] = characters.map((c) => ({
    id: c.id,
    type: 'character',
    position: { x: 0, y: 0 },
    data: { character: c },
  }))

  const n = nodes.length
  const radius = Math.max(240, 40 * n)
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2
    node.position = {
      x: radius * Math.cos(angle) - NODE_W / 2,
      y: radius * Math.sin(angle) - NODE_H / 2,
    }
  })

  return nodes
}

function buildEdges(relations: Relation[]): Edge[] {
  const offsets = computeEdgeOffsets(relations)
  return relations.map((r) => {
    const offset = offsets.get(r.id) ?? { curvature: 0, labelOffsetY: 0 }
    return {
      id: r.id,
      source: r.sourceId,
      target: r.targetId,
      type: 'relation',
      data: {
        label: r.label,
        color: r.color,
        lineStyle: r.lineStyle,
        relType: r.type,
        curvature: offset.curvature,
        labelOffsetY: offset.labelOffsetY,
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: r.color, width: 16, height: 16 },
    }
  })
}

export default function Relations() {
  const navigate = useNavigate()
  const [view, setView] = useState<'2d' | '3d'>('2d')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)

  const characters = useMemo(() => load<Character>('characters'), [])
  const initialNodes = useMemo(() => buildNodes(characters), [characters])
  const initialEdges = useMemo(() => buildEdges(load<Relation>('relations')), [])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const selected = selectedId ? (characters.find((c) => c.id === selectedId) ?? null) : null
  const editingRelation = editingEdgeId
    ? (load<Relation>('relations').find((r) => r.id === editingEdgeId) ?? null)
    : null

  function handleSaveRelation(updated: Relation) {
    upsert('relations', updated)
    setEdges(buildEdges(load<Relation>('relations')))
    setEditingEdgeId(null)
    toast('关系已保存', 'success')
  }

  return (
    <div className="flex h-full flex-col">
      {/* 顶部工具栏 */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-4">
        <h1 className="text-sm font-semibold">人物关系图</h1>
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          <button
            onClick={() => setView('2d')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              view === '2d' ? 'bg-card shadow-sm' : 'text-muted-foreground',
            )}
          >
            2D
          </button>
          <button
            onClick={() => setView('3d')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              view === '3d' ? 'bg-card shadow-sm' : 'text-muted-foreground',
            )}
          >
            3D
          </button>
        </div>
      </header>

      {/* 画布 */}
      <div className="relative min-h-0 flex-1">
        {view === '3d' ? (
          <Relations3D />
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onEdgeClick={(_, edge) => setEditingEdgeId(edge.id)}
            onPaneClick={() => {
              setSelectedId(null)
              setEditingEdgeId(null)
            }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#cbd5e1" />
            <Controls />
          </ReactFlow>
        )}

        {/* 选中节点面板 */}
        {selected && (
          <div className="absolute right-4 top-4 z-10 w-72">
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-semibold text-white"
                      style={{ backgroundColor: selected.themeColor || '#94a3b8' }}
                    >
                      {selected.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold">{selected.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{selected.identity}</div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {selected.intro && <p className="mt-3 text-sm text-muted-foreground">{selected.intro}</p>}
                {selected.personalityTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selected.personalityTags.slice(0, 4).map((t) => (
                      <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => navigate(`/characters/${selected.id}`)}
                >
                  查看完整档案
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 连线编辑弹窗 */}
      {editingRelation && (
        <RelationEdgeEditModal
          relation={editingRelation}
          onClose={() => setEditingEdgeId(null)}
          onSave={handleSaveRelation}
        />
      )}
    </div>
  )
}
