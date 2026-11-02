import { useState } from 'react'
import { Plus, Save, Trash2, X } from 'lucide-react'
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import type { Attribute, AttributeSnapshot, Character } from '../../types'
import { load, uid } from '../../lib/storage'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { toast } from '../ui/toast'

interface Props {
  character: Character
  onUpdate: (patch: Partial<Character>) => void
}

interface Overlay {
  key: string
  type: 'snapshot' | 'character'
  name: string
  color: string
  attributes: Attribute[]
}

interface SeriesItem {
  dataKey: string
  name: string
  color: string
  dashed: boolean
  overlayKey?: string
}

const MAX_OVERLAYS = 2 // 加上默认状态，最多 3 个雷达图

export default function RadarTab({ character, onUpdate }: Props) {
  const snapshots = character.attributeSnapshots ?? []
  const otherCharacters = load<Character>('characters').filter((c) => c.id !== character.id)
  const themeColor = character.themeColor || '#7c3aed'

  const [selected, setSelected] = useState<Overlay[]>([])
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [dimName, setDimName] = useState('')
  const [snapName, setSnapName] = useState('')
  const [showSnapModal, setShowSnapModal] = useState(false)

  // ===== 默认状态维度编辑 =====
  function setValue(dimension: string, value: number) {
    onUpdate({
      attributes: character.attributes.map((a) => (a.dimension === dimension ? { ...a, value } : a)),
    })
  }
  function removeDim(dimension: string) {
    onUpdate({ attributes: character.attributes.filter((a) => a.dimension !== dimension) })
  }
  function addDim() {
    const name = dimName.trim()
    if (!name) return
    if (character.attributes.some((a) => a.dimension === name)) {
      toast('该维度已存在', 'error')
      return
    }
    onUpdate({ attributes: [...character.attributes, { dimension: name, value: 60 }] })
    setDimName('')
  }

  // ===== 快照 =====
  function saveSnapshot() {
    const name = snapName.trim()
    if (!name) return
    const snap: AttributeSnapshot = {
      id: uid(),
      name,
      attributes: character.attributes.map((a) => ({ ...a })),
    }
    onUpdate({ attributeSnapshots: [...snapshots, snap] })
    setSnapName('')
    setShowSnapModal(false)
    toast('已保存状态快照', 'success')
  }
  function deleteSnapshot(id: string) {
    onUpdate({ attributeSnapshots: snapshots.filter((s) => s.id !== id) })
    setSelected((prev) => prev.filter((o) => !(o.type === 'snapshot' && o.key === id)))
  }

  // ===== 添加对比 =====
  function handleAddCompare(value: string) {
    if (!value) return
    if (selected.length >= MAX_OVERLAYS) {
      toast('最多同时叠加 3 个雷达图（含默认状态）', 'error')
      return
    }
    const [kind, id] = value.split(':')
    if (kind === 'char') {
      const c = otherCharacters.find((x) => x.id === id)
      if (!c) return
      if (selected.some((o) => o.type === 'character' && o.key === c.id)) {
        toast('该角色已在对比中', 'info')
        return
      }
      setSelected((prev) => [
        ...prev,
        { key: c.id, type: 'character', name: c.name, color: c.themeColor || '#64748b', attributes: c.attributes },
      ])
    } else if (kind === 'snap') {
      const s = snapshots.find((x) => x.id === id)
      if (!s) return
      if (selected.some((o) => o.type === 'snapshot' && o.key === s.id)) {
        toast('该快照已在对比中', 'info')
        return
      }
      setSelected((prev) => [
        ...prev,
        { key: s.id, type: 'snapshot', name: s.name, color: themeColor, attributes: s.attributes },
      ])
    }
  }

  function removeOverlay(key: string) {
    setSelected((prev) => prev.filter((o) => o.key !== key))
  }

  function toggleHide(key: string) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ===== 维度对齐 & 数据 =====
  const series: SeriesItem[] = [
    { dataKey: 'main', name: '当前状态', color: themeColor, dashed: false },
    ...selected.map((o, i) => ({
      dataKey: `s${i}`,
      name: o.name,
      color: o.color,
      dashed: o.type === 'snapshot',
      overlayKey: o.key,
    })),
  ]

  const allDims: string[] = []
  const seen = new Set<string>()
  character.attributes.forEach((a) => {
    if (!seen.has(a.dimension)) {
      seen.add(a.dimension)
      allDims.push(a.dimension)
    }
  })
  selected.forEach((o) =>
    o.attributes.forEach((a) => {
      if (!seen.has(a.dimension)) {
        seen.add(a.dimension)
        allDims.push(a.dimension)
      }
    }),
  )

  const data = allDims.map((dim) => {
    const row: Record<string, string | number> = { dimension: dim }
    row['main'] = character.attributes.find((a) => a.dimension === dim)?.value ?? 0
    selected.forEach((o, i) => {
      row[`s${i}`] = o.attributes.find((a) => a.dimension === dim)?.value ?? 0
    })
    return row
  })

  const hasData = allDims.length > 0

  return (
    <div className="space-y-5">
      {/* 顶部工具条 */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowSnapModal(true)}>
          <Save className="h-3.5 w-3.5" />
          保存当前为状态快照
        </Button>

        <select
          value=""
          onChange={(e) => handleAddCompare(e.target.value)}
          disabled={selected.length >= MAX_OVERLAYS}
          className="h-8 rounded-md border border-input bg-card px-2 text-sm shadow-sm focus:outline-none disabled:opacity-50"
        >
          <option value="" disabled>
            {selected.length >= MAX_OVERLAYS ? '已达上限（3 个）' : '添加对比…'}
          </option>
          <optgroup label="对比其他角色">
            {otherCharacters
              .filter((c) => c.attributes.length > 0)
              .map((c) => (
                <option key={c.id} value={`char:${c.id}`}>
                  {c.name}
                </option>
              ))}
          </optgroup>
          <optgroup label="对比当前角色快照">
            {snapshots.map((s) => (
              <option key={s.id} value={`snap:${s.id}`}>
                {s.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* 图表 */}
      {hasData ? (
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="70%">
              <PolarGrid />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              {series.map((s) => (
                <Radar
                  key={s.dataKey}
                  name={s.name}
                  dataKey={s.dataKey}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={s.dashed ? 0.05 : 0.2}
                  strokeDasharray={s.dashed ? '5 5' : undefined}
                  strokeWidth={2}
                  hide={hidden.has(s.dataKey)}
                  isAnimationActive={false}
                />
              ))}
              <Legend
                onClick={(entry) => {
                  if (entry && entry.dataKey !== undefined) toggleHide(String(entry.dataKey))
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm font-medium">还没有能力维度</p>
          <p className="mt-1 text-xs text-muted-foreground">在下方添加维度后生成雷达图。</p>
        </div>
      )}

      {/* 一键移除标签（对比项） */}
      {series.filter((s) => s.overlayKey).length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">对比项：</span>
          {series
            .filter((s) => s.overlayKey)
            .map((s) => (
              <span
                key={s.dataKey}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                style={{ borderColor: s.color }}
              >
                <span
                  className="inline-block h-0.5 w-4 rounded-full"
                  style={s.dashed ? { borderTop: `2px dashed ${s.color}` } : { background: s.color }}
                />
                {s.name}
                <button
                  onClick={() => removeOverlay(s.overlayKey!)}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-red-500"
                  aria-label={`移除 ${s.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
        </div>
      )}

      {/* 已保存快照管理 */}
      {snapshots.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">已保存快照（可删除）</div>
          <div className="flex flex-wrap gap-1.5">
            {snapshots.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs"
              >
                {s.name}
                <button
                  onClick={() => deleteSnapshot(s.id)}
                  className="text-muted-foreground hover:text-red-500"
                  aria-label={`删除快照 ${s.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 默认状态维度编辑 */}
      <div className="border-t pt-4">
        <div className="mb-3 text-sm font-medium">编辑默认状态</div>
        <div className="space-y-3">
          {character.attributes.map((a) => (
            <div key={a.dimension} className="flex items-center gap-3">
              <span className="w-20 shrink-0 truncate text-sm">{a.dimension}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={a.value}
                onChange={(e) => setValue(a.dimension, Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer accent-primary"
              />
              <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                {a.value}
              </span>
              <button
                onClick={() => removeDim(a.dimension)}
                className="shrink-0 text-muted-foreground hover:text-red-500"
                aria-label="删除维度"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={dimName}
            onChange={(e) => setDimName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addDim()
              }
            }}
            placeholder="新增维度名称"
          />
          <Button variant="outline" onClick={addDim}>
            <Plus className="h-4 w-4" />
            添加维度
          </Button>
        </div>
      </div>

      {/* 保存快照弹窗 */}
      {showSnapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSnapModal(false)} />
          <div className="relative w-full max-w-sm rounded-xl border bg-card p-5 shadow-xl">
            <h3 className="font-semibold">保存当前为状态快照</h3>
            <p className="mt-1 text-xs text-muted-foreground">将当前维度与数值冻结为一个状态快照。</p>
            <Input
              value={snapName}
              onChange={(e) => setSnapName(e.target.value)}
              placeholder="快照名称，如：黑化后"
              className="mt-3"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowSnapModal(false)}>
                取消
              </Button>
              <Button onClick={saveSnapshot} disabled={!snapName.trim()}>
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
