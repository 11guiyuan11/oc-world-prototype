import { Fragment, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Sparkles, Upload, X } from 'lucide-react'
import { readFileAsDataURL, setSetting, uid, upsert } from '../lib/storage'
import { streamChat } from '../lib/deepseek'
import { toast } from '../components/ui/toast'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input, Textarea } from '../components/ui/input'
import { cn } from '../lib/utils'
import type { World } from '../types'

const STEP_LABELS = ['基本信息', '视觉基调与模板', '确认创建']

const GENRE_PRESETS = ['悬疑', '蒸汽朋克', '奇幻', '都市', '科幻', '古风']

const TEMPLATES = [
  {
    id: 'mist',
    name: '雾港 · 悬疑',
    desc: '冷灰迷雾，暗流涌动',
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
  },
  {
    id: 'steam',
    name: '蒸汽 · 铜锈',
    desc: '齿轮与蒸汽的旧时代',
    color: '#b45309',
    gradient: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)',
  },
  {
    id: 'fantasy',
    name: '奇幻 · 星夜',
    desc: '魔法与传说的星海',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)',
  },
  {
    id: 'urban',
    name: '都市 · 冷灰',
    desc: '霓虹与钢铁的现代',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)',
  },
]

export default function WorldOnboarding() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    genreTags: [] as string[],
    era: '',
    calendarName: '星历',
    calendarStart: '',
    cover: '',
  })
  const [tagInput, setTagInput] = useState('')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState(TEMPLATES[0])
  const [error, setError] = useState('')
  const [drafting, setDrafting] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !form.genreTags.includes(t)) set('genreTags', [...form.genreTags, t])
    setTagInput('')
  }

  function removeTag(t: string) {
    set('genreTags', form.genreTags.filter((x) => x !== t))
  }

  function togglePreset(t: string) {
    set(
      'genreTags',
      form.genreTags.includes(t) ? form.genreTags.filter((x) => x !== t) : [...form.genreTags, t],
    )
  }

  async function onCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await readFileAsDataURL(file)
      set('cover', data)
    } catch {
      toast('封面读取失败', 'error')
    }
  }

  function next() {
    if (step === 0) {
      if (!form.name.trim()) {
        setError('请填写世界观名称')
        toast('请填写世界观名称', 'error')
        return
      }
      setError('')
    }
    setStep((s) => Math.min(s + 1, 2))
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function generateDraft() {
    setDrafting(true)
    setDescription('')
    await streamChat(
      [
        {
          role: 'system',
          content:
            '你是世界观创作者。请根据类型标签撰写一段世界背景草稿，包含核心母题、势力版图、时代基调，约200-300字，用中文。',
        },
        { role: 'user', content: `类型标签：${form.genreTags.join('、') || '架空'}` },
      ],
      (delta) => setDescription((prev) => prev + delta),
      () => setDrafting(false),
      () => {
        toast('AI 调用失败，已切换演示模式', 'info')
        setDrafting(false)
      },
    )
  }

  function handleCreate() {
    const world: World = {
      id: uid(),
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      genreTags: form.genreTags,
      era: form.era.trim(),
      calendarName: form.calendarName.trim() || '星历',
      calendarStart: Number(form.calendarStart) || 0,
      cover: form.cover || template.gradient,
      description,
    }
    upsert('worlds', world)
    setSetting('currentWorldId', world.id)
    toast('世界观创建成功', 'success')
    navigate(`/world/${world.id}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* 步骤指示器 */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <Fragment key={label}>
            {i > 0 && <div className="h-px w-8 bg-border" />}
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  i < step && 'bg-primary text-primary-foreground',
                  i === step && 'bg-primary/15 text-primary',
                  i > step && 'bg-secondary text-muted-foreground',
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn('text-sm', i === step ? 'font-medium' : 'text-muted-foreground')}>
                {label}
              </span>
            </div>
          </Fragment>
        ))}
      </div>

      {/* 步骤 1：基本信息 */}
      {step === 0 && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                世界观名称 <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="例如：雾港纪事"
                autoFocus
              />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">一句话简介</label>
              <Input
                value={form.tagline}
                onChange={(e) => set('tagline', e.target.value)}
                placeholder="用一句话概括这个世界"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">类型标签</label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {GENRE_PRESETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => togglePreset(t)}
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                      form.genreTags.includes(t)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-secondary',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="自定义标签，回车添加"
                />
                <Button type="button" variant="outline" size="icon" onClick={addTag} aria-label="添加标签">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.genreTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.genreTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`移除 ${t}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">时代背景</label>
                <Input
                  value={form.era}
                  onChange={(e) => set('era', e.target.value)}
                  placeholder="例如：架空近未来"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">纪年名称</label>
                <Input
                  value={form.calendarName}
                  onChange={(e) => set('calendarName', e.target.value)}
                  placeholder="例如：星历"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">纪年起点年份</label>
              <Input
                type="number"
                value={form.calendarStart}
                onChange={(e) => set('calendarStart', e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">封面</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onCover} />
              {form.cover ? (
                <div className="relative h-40 overflow-hidden rounded-lg border">
                  <img src={form.cover} alt="封面预览" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => set('cover', '')}
                    className="absolute right-2 top-2 rounded-md bg-black/50 p-1 text-white hover:bg-black/70"
                    aria-label="移除封面"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground hover:bg-secondary/50"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">点击上传封面图片</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤 2：视觉基调与模板 */}
      {step === 1 && (
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <label className="mb-3 block text-sm font-medium">选择视觉基调</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t)}
                    className={cn(
                      'rounded-lg border p-3 text-left transition-all',
                      template.id === t.id ? 'border-primary ring-1 ring-primary/20' : 'hover:border-border',
                    )}
                  >
                    <div className="mb-2 h-16 w-full rounded-md" style={{ background: t.gradient }} />
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.desc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">世界观描述</label>
                <Button type="button" variant="outline" size="sm" onClick={generateDraft} disabled={drafting}>
                  {drafting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {drafting ? 'AI 生成中…' : 'AI 生成背景草稿'}
                </Button>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述这个世界的母题、势力与基调，或点击上方按钮让 AI 生成草稿。"
                className="min-h-[160px]"
              />
              {drafting && <p className="mt-1 text-xs text-muted-foreground">正在流式生成…</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步骤 3：确认创建 */}
      {step === 2 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <div className="mb-3 h-32 overflow-hidden rounded-lg" style={{ background: form.cover || template.gradient }}>
                {form.cover && <img src={form.cover} alt="封面" className="h-full w-full object-cover" />}
              </div>
              <h2 className="text-xl font-bold">{form.name || '未命名世界观'}</h2>
              {form.tagline && <p className="mt-1 text-muted-foreground">{form.tagline}</p>}
            </div>

            <dl className="space-y-2 rounded-lg bg-secondary/50 p-4 text-sm">
              {form.era && (
                <div className="flex gap-2">
                  <dt className="shrink-0 text-xs text-muted-foreground">时代背景</dt>
                  <dd>{form.era}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="shrink-0 text-xs text-muted-foreground">纪年</dt>
                <dd>
                  {form.calendarName || '星历'} · 起点 {form.calendarStart || 0}
                </dd>
              </div>
              {form.genreTags.length > 0 && (
                <div className="flex gap-2">
                  <dt className="shrink-0 text-xs text-muted-foreground">类型</dt>
                  <dd>{form.genreTags.join('、')}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="shrink-0 text-xs text-muted-foreground">视觉基调</dt>
                <dd>{template.name}</dd>
              </div>
              {description && (
                <div>
                  <dt className="text-xs text-muted-foreground">描述</dt>
                  <dd className="mt-1 line-clamp-3 text-muted-foreground">{description}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* 底部导航 */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={prev} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" />
          上一步
        </Button>
        {step < 2 ? (
          <Button onClick={next}>
            下一步
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate}>
            <Check className="h-4 w-4" />
            创建世界观
          </Button>
        )}
      </div>
    </div>
  )
}
