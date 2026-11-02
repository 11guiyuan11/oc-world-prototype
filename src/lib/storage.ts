import type { ImportJob, ShareCard, StoreKey, Character } from '../types'
import { buildSeedData } from '../mock/data'

const PREFIX = 'oc:'
const SETTINGS_PREFIX = 'oc:setting:'

// ===== 基础 CRUD =====
export function load<T>(key: StoreKey): T[] {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export function save<T>(key: StoreKey, data: T[]): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(data))
}

export function upsert<T extends { id: string }>(key: StoreKey, item: T): void {
  const list = load<T>(key)
  const idx = list.findIndex((x) => x.id === item.id)
  if (idx >= 0) list[idx] = item
  else list.push(item)
  save(key, list)
}

export function remove(key: StoreKey, id: string): void {
  const list = load<{ id: string }>(key)
  save(key, list.filter((x) => x.id !== id))
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// ===== 设置（非实体，key-value） =====
export function getSetting<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(SETTINGS_PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function setSetting<T>(key: string, value: T): void {
  localStorage.setItem(SETTINGS_PREFIX + key, JSON.stringify(value))
}

// ===== 种子数据 =====
export function seedIfEmpty(): void {
  if (load('worlds').length === 0) {
    const d = buildSeedData()
    save('worlds', d.worlds)
    save('characters', d.characters)
    save('relations', d.relations)
    save('timeline', d.timeline)
    save('codex', d.codex)
    save('mapNodes', d.mapNodes)
    save('shareCards', d.shareCards)
  }
}

// 重置演示数据：清空所有 oc: 前缀的 localStorage 数据并重新种子
export function resetDemoData(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('oc:'))
    .forEach((k) => localStorage.removeItem(k))
  seedIfEmpty()
}

// ===== 导出 / 下载 =====
export function exportJSON(): Blob {
  const data = {
    exportedAt: new Date().toISOString(),
    worlds: load('worlds'),
    characters: load('characters'),
    relations: load('relations'),
    timeline: load('timeline'),
    codex: load('codex'),
    mapNodes: load('mapNodes'),
    shareCards: load('shareCards'),
  }
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error ?? new Error('读取文件失败'))
    r.readAsText(file)
  })
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error ?? new Error('读取文件失败'))
    r.readAsDataURL(file)
  })
}

// ===== 导入（骨架版，完整字段映射在 P12 实现） =====
export async function importJSON(file: File): Promise<ImportJob> {
  const text = await readFileAsText(file)
  const job: ImportJob = {
    id: uid(),
    fileName: file.name,
    status: 'done',
    fieldMapping: {},
    conflicts: [],
  }
  try {
    const data = JSON.parse(text)
    if (Array.isArray(data.worlds)) save('worlds', data.worlds)
    if (Array.isArray(data.characters)) save('characters', data.characters)
    if (Array.isArray(data.relations)) save('relations', data.relations)
    if (Array.isArray(data.timeline)) save('timeline', data.timeline)
    if (Array.isArray(data.codex)) save('codex', data.codex)
    if (Array.isArray(data.mapNodes)) save('mapNodes', data.mapNodes)
    if (Array.isArray(data.shareCards)) save('shareCards', data.shareCards)
  } catch {
    job.status = 'conflict'
    job.conflicts.push({ field: '整体', value: '无法解析', reason: '文件不是合法 JSON' })
  }
  return job
}

// ===== 分享链接 =====
export function getShareToken(cardId: string): string {
  return encodeURIComponent(cardId)
}

export function resolveShareToken(
  token: string,
): { card: ShareCard; character: Character | null } | null {
  try {
    const cardId = decodeURIComponent(token)
    const card = load<ShareCard>('shareCards').find((c) => c.id === cardId)
    if (!card) return null
    const character = load<Character>('characters').find((c) => c.id === card.characterId) ?? null
    return { card, character }
  } catch {
    return null
  }
}
