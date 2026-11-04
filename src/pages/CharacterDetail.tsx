import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Share2, Volume2, VolumeX } from 'lucide-react'
import { load, loadByWorld, upsert } from '../lib/storage'
import type { Character } from '../types'
import { Button } from '../components/ui/button'
import { toast } from '../components/ui/toast'
import { cn } from '../lib/utils'
import ProfileTab from '../components/character/ProfileTab'
import GalleryTab from '../components/character/GalleryTab'
import RadarTab from '../components/character/RadarTab'
import OutfitsTab from '../components/character/OutfitsTab'
import { RelationsSummary, TimelineSummary } from '../components/character/SummaryTabs'

const TABS = [
  { key: 'profile', label: '档案' },
  { key: 'gallery', label: '相册' },
  { key: 'radar', label: '雷达图' },
  { key: 'outfits', label: '服装' },
  { key: 'relations', label: '关系摘要' },
  { key: 'timeline', label: '时间轴摘要' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function CharacterDetail() {
  const { id } = useParams()
  const [character, setCharacter] = useState<Character | null>(() => {
    return loadByWorld<Character>('characters').find((c) => c.id === id) ?? null
  })
  const [tab, setTab] = useState<TabKey>('profile')
  const [speaking, setSpeaking] = useState(false)

  if (!character) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">角色不存在</h1>
        <p className="mt-2 text-muted-foreground">该角色可能已被删除。</p>
        <Link to="/characters" className="mt-5 inline-block">
          <Button>
            <ArrowLeft className="h-4 w-4" />
            返回角色库
          </Button>
        </Link>
      </div>
    )
  }

  function onUpdate(patch: Partial<Character>) {
    const next = { ...character!, ...patch, updatedAt: Date.now() }
    upsert('characters', next)
    setCharacter(next)
  }

  function playVoice() {
    if (!('speechSynthesis' in window)) {
      toast('当前浏览器不支持语音合成', 'error')
      return
    }
    const synth = window.speechSynthesis
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    const text = `${character!.name}。${character!.intro || '暂无简介'}`
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    setSpeaking(true)
    synth.speak(u)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* 顶部信息区 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          to="/characters"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>

        <div className="flex flex-1 items-center gap-4">
          {character.avatar ? (
            <img
              src={character.avatar}
              alt={character.name}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold text-white ring-2 ring-border"
              style={{ backgroundColor: character.themeColor || '#94a3b8' }}
            >
              {character.name.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold">{character.name}</h1>
              {character.alias.length > 0 && (
                <span className="hidden truncate text-sm text-muted-foreground sm:inline">
                  （{character.alias.join('、')}）
                </span>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {character.identity}
              {character.faction ? ` · ${character.faction}` : ''}
              {character.age ? ` · ${character.age} 岁` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={playVoice}
            aria-label={speaking ? '停止播放' : '播放语音'}
          >
            {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Link to="/share-card">
            <Button>
              <Share2 className="h-4 w-4" />
              生成展示卡
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm transition-colors',
              tab === t.key
                ? 'font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {tab === t.key && (
              <span
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                style={{ backgroundColor: character.themeColor || '#7c3aed' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="mt-6">
        {tab === 'profile' && <ProfileTab character={character} onUpdate={onUpdate} />}
        {tab === 'gallery' && <GalleryTab character={character} onUpdate={onUpdate} />}
        {tab === 'radar' && <RadarTab character={character} onUpdate={onUpdate} />}
        {tab === 'outfits' && <OutfitsTab character={character} onUpdate={onUpdate} />}
        {tab === 'relations' && <RelationsSummary character={character} />}
        {tab === 'timeline' && <TimelineSummary character={character} />}
      </div>
    </div>
  )
}
