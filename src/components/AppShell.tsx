import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Home,
  Users,
  GitFork,
  Clock,
  Map as MapIcon,
  ShieldCheck,
  CreditCard,
  Download,
  Database,
  Menu,
  X,
  Share2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Plus,
} from 'lucide-react'
import { load, setSetting, resetDemoData, getCurrentWorldId } from '../lib/storage'
import { isDemoMode } from '../lib/deepseek'
import type { World } from '../types'
import { cn } from '../lib/utils'
import SaveStatus from './SaveStatus'

const NAV = [
  { to: '/', label: '项目首页', icon: Home, end: true },
  { to: '/characters', label: '角色库', icon: Users },
  { to: '/relations', label: '关系图', icon: GitFork },
  { to: '/timeline', label: '时间轴', icon: Clock },
  { to: '/codex', label: '图鉴地图', icon: MapIcon },
  { to: '/consistency', label: '设定检查', icon: ShieldCheck },
  { to: '/share-card', label: '展示卡', icon: CreditCard },
  { to: '/export-artist', label: '导出', icon: Download },
  { to: '/data', label: '数据', icon: Database },
]

export default function AppShell() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [worlds, setWorlds] = useState<World[]>([])
  const [currentWorldId, setCurrentWorldId] = useState('')
  const demo = isDemoMode()

  useEffect(() => {
    const list = load<World>('worlds')
    setWorlds(list)
    setCurrentWorldId(getCurrentWorldId())
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const currentWorld = worlds.find((w) => w.id === currentWorldId) ?? worlds[0]

  function handleReset() {
    if (!window.confirm('确定要重置演示数据吗？所有修改将被清除。')) return
    resetDemoData()
    window.location.reload()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 左侧导航 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border/60 bg-card transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* 品牌区 */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">OC 世界观</div>
            <div className="text-[11px] text-muted-foreground">创作 · 管理 · 分享</div>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
          <div className="px-3 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
            工作区
          </div>
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-secondary font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-border/60 px-5 py-3">
          <div className="text-[11px] text-muted-foreground">数据仅保存在本地浏览器</div>
          <button
            onClick={handleReset}
            className="mt-2 w-full rounded-md border border-border/60 px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            重置演示数据
          </button>
        </div>
      </aside>

      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 主区域 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-card/70 px-3 backdrop-blur sm:px-4">
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="打开导航"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* 项目切换 */}
          <div className="relative">
            <select
              value={currentWorld?.id ?? ''}
              onChange={(e) => {
                const id = e.target.value
                setSetting('currentWorldId', id)
                setCurrentWorldId(id)
              }}
              className="max-w-[180px] appearance-none truncate rounded-md py-1.5 pl-2.5 pr-7 text-sm font-medium hover:bg-secondary focus:outline-none"
            >
              {worlds.length === 0 && <option value="">暂无世界观</option>}
              {worlds.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Link
            to="/onboarding/world"
            title="新建世界观"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-border/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </Link>

          <div className="flex-1" />

          <div className="hidden sm:block">
            <SaveStatus />
          </div>

          {demo && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
              演示模式
            </span>
          )}

          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
            aria-label="分享"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-secondary lg:block"
            onClick={() => setPanelOpen((v) => !v)}
            aria-label="切换属性面板"
          >
            {panelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet key={currentWorldId} />
        </main>
      </div>

      {/* 右侧属性面板（可折叠） */}
      {panelOpen && (
        <aside className="hidden w-72 shrink-0 border-l border-border/60 bg-card lg:block">
          <div className="border-b border-border/60 px-4 py-3">
            <span className="text-sm font-medium">属性面板</span>
          </div>
          <div className="p-4 text-sm text-muted-foreground">
            选中角色 / 关系 / 事件后，此处显示可编辑属性。
          </div>
        </aside>
      )}
    </div>
  )
}
