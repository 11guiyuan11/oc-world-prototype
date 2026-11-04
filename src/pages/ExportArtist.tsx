import { useRef, useState } from 'react'
import { AlertTriangle, Download, FileDown } from 'lucide-react'
import { load, loadByWorld } from '../lib/storage'
import { exportNodeToPng } from '../lib/exportImage'
import type { Character } from '../types'
import { Button } from '../components/ui/button'
import { toast } from '../components/ui/toast'

const FIELD_OPTIONS = [
  { key: 'appearance', label: '颜貌特征（发色/瞳色/体型）' },
  { key: 'personality', label: '性格标签' },
  { key: 'outfits', label: '服装与配色设定' },
  { key: 'references', label: '参考图（相册/服装图）' },
  { key: 'taboos', label: '禁忌点提示' },
] as const

export default function ExportArtist() {
  const characters = loadByWorld<Character>('characters')
  const [characterId, setCharacterId] = useState(characters[0]?.id ?? '')
  const [fields, setFields] = useState<Record<string, boolean>>({
    appearance: true,
    personality: true,
    outfits: true,
    references: true,
    taboos: true,
  })
  const previewRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const character = characters.find((c) => c.id === characterId) ?? characters[0]

  function toggle(key: string) {
    setFields((f) => ({ ...f, [key]: !f[key] }))
  }

  async function doExport(label: string) {
    if (!previewRef.current || !character) return
    setExporting(true)
    try {
      await exportNodeToPng(previewRef.current, `${character.name}-画师设定集.png`)
      toast(label, 'success')
    } catch {
      toast('导出失败', 'error')
    } finally {
      setExporting(false)
    }
  }

  if (!character) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        还没有角色，先创建角色再导出设定集
      </div>
    )
  }

  const themeColor = character.themeColor || '#7c3aed'
  const references = [...character.gallery.map((g) => g.image), ...character.outfits.map((o) => o.image)]
  const taboos = character.taboos ?? []

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4">
        <h1 className="text-sm font-semibold">画师友好版设定集导出</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => doExport('已导出（暂用图片代替 PDF）')} disabled={exporting}>
            <FileDown className="h-3.5 w-3.5" />
            导出 PDF（暂用图片代替）
          </Button>
          <Button size="sm" onClick={() => doExport('已导出长图 PNG')} disabled={exporting}>
            <Download className="h-3.5 w-3.5" />
            导出长图 PNG
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* 左：字段筛选 */}
        <aside className="w-full shrink-0 overflow-y-auto border-b border-border/60 p-4 md:w-72 md:border-b-0 md:border-r">
          <div className="mb-3 text-sm font-semibold">给画师看什么</div>
          <div className="mb-4">
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
          <div className="space-y-1.5">
            {FIELD_OPTIONS.map((f) => (
              <label key={f.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary/60">
                <input type="checkbox" checked={fields[f.key]} onChange={() => toggle(f.key)} className="h-4 w-4 accent-primary" />
                {f.label}
              </label>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">此页不会渲染长篇背景故事与事件时间轴。</p>
        </aside>

        {/* 右：预览 */}
        <div className="flex min-w-0 flex-1 items-start justify-center overflow-y-auto p-8">
          <div ref={previewRef} className="w-[560px] rounded-lg border border-slate-200 bg-white p-8 text-slate-900 shadow-sm">
            {/* 头部基础信息 */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              {character.avatar ? (
                <img src={character.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <span
                  className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-semibold text-white"
                  style={{ backgroundColor: themeColor }}
                >
                  {character.name.slice(0, 1)}
                </span>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{character.name}</h2>
                  <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}>
                    {character.identity}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {character.age} 岁 · {character.faction}
                  {character.alias.length > 0 && ` · 别名：${character.alias.join('、')}`}
                </p>
              </div>
            </div>

            {fields.appearance && character.appearance && (
              <section className="border-b border-slate-100 py-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">颜貌特征</h3>
                <p className="text-sm leading-relaxed text-slate-600">{character.appearance}</p>
              </section>
            )}

            {fields.personality && character.personalityTags.length > 0 && (
              <section className="border-b border-slate-100 py-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">性格标签</h3>
                <div className="flex flex-wrap gap-1.5">
                  {character.personalityTags.map((t) => (
                    <span key={t} className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: `${themeColor}14`, color: themeColor }}>
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {fields.outfits && (
              <section className="border-b border-slate-100 py-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">服装与配色设定</h3>
                <div className="mb-2 flex items-center gap-2 text-sm text-slate-600">
                  <span>主色调：</span>
                  <span className="inline-block h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: themeColor }} />
                  <span className="tabular-nums">{themeColor}</span>
                </div>
                {character.outfits.length > 0 ? (
                  <ul className="space-y-1 text-sm text-slate-600">
                    {character.outfits.map((o) => (
                      <li key={o.id}>
                        {o.tags.length > 0 && <span className="font-medium">{o.tags.join(' / ')}</span>}
                        {o.note && <span> · {o.note}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-600">{character.appearance || '暂无服装设定'}</p>
                )}
              </section>
            )}

            {fields.references && (
              <section className="border-b border-slate-100 py-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">参考图</h3>
                {references.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {references.map((img, i) => (
                      <img key={i} src={img} alt="" className="aspect-square w-full rounded-md border border-slate-100 object-cover" />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">暂无参考图</p>
                )}
              </section>
            )}

            {fields.taboos && taboos.length > 0 && (
              <section className="py-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  设定禁忌 / 避雷提示
                </h3>
                <ul className="space-y-1.5">
                  {taboos.map((t) => (
                    <li key={t} className="flex items-start gap-1.5 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      {t}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
