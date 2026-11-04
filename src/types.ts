// ===== 世界观 =====
export interface World {
  id: string
  name: string
  tagline: string // 一句话简介
  genreTags: string[] // 类型标签
  era: string // 时代背景
  calendarName: string // 纪年名称，如「星历」
  calendarStart: number // 纪年起点年份
  cover: string // 封面（base64 或 URL）
  description: string // 长简介
}

// ===== 角色 =====
export interface Outfit {
  id: string
  image: string
  tags: string[]
  note: string
}

export interface GalleryImage {
  id: string
  image: string // base64
  caption: string
  group: string
}

export interface Attribute {
  dimension: string
  value: number
}

export interface AttributeSnapshot {
  id: string
  name: string
  attributes: Attribute[]
}

export interface Character {
  id: string
  worldId?: string
  name: string
  alias: string[]
  identity: string
  age: string
  faction: string
  avatar: string // base64
  themeColor: string
  intro: string
  longBio: string
  personalityTags: string[]
  appearance: string
  outfits: Outfit[]
  voiceUrl: string | null
  gallery: GalleryImage[]
  attributes: Attribute[]
  attributeSnapshots?: AttributeSnapshot[]
  taboos?: string[]
  updatedAt?: number
}

// ===== 关系 =====
export type LineStyle = 'solid' | 'dashed' | 'dotted'

export interface Relation {
  id: string
  worldId?: string
  sourceId: string
  targetId: string
  type: string // 师徒 / 敌对 / 契约 / 亲情 / 搭档 ...
  label: string
  color: string
  lineStyle: LineStyle
  note: string
}

// ===== 时间轴事件 =====
export interface TimelineEvent {
  id: string
  worldId?: string
  calendarYear: number
  displayDate: string
  title: string
  description: string
  characterIds: string[]
  mapNodeId: string | null
  image: string
  updatedAt?: number
}

// ===== 图鉴 =====
export type CodexCategory = '角色' | '地点' | '组织' | '物品' | '种族' | '术语'

export interface CodexEntry {
  id: string
  worldId?: string
  category: CodexCategory
  title: string
  content: string
  tags: string[]
}

// ===== 地图 =====
export type MapLevel = '世界' | '区域' | '城市' | '建筑' | '房间'

export interface MapMarker {
  id: string
  x: number // 相对坐标 0~1
  y: number
  name: string
  color?: string
  codexId?: string | null
  characterId?: string | null
  eventId?: string | null
  mapNodeId?: string | null
}

export interface MapNode {
  id: string
  worldId?: string
  parentId: string | null
  name: string
  level: MapLevel
  image: string
  markers: MapMarker[]
}

// ===== 展示卡 =====
export interface ShareCard {
  id: string
  worldId?: string
  characterId: string
  fields: Record<string, boolean>
  theme: string
  layout: 'long' | 'card'
}

// ===== 导入任务 =====
export type ImportStatus = 'reading' | 'mapping' | 'conflict' | 'done' | 'rolled_back'

export interface ImportConflict {
  field: string
  value: string
  reason: string
}

export interface ImportJob {
  id: string
  fileName: string
  status: ImportStatus
  fieldMapping: Record<string, string>
  conflicts: ImportConflict[]
}

// ===== 一致性检查 =====
export type IssueLevel = '严重' | '提醒' | '建议'

export interface ConsistencyIssue {
  id: string
  level: IssueLevel
  message: string
  sourceType: 'character' | 'timeline' | 'relation' | 'codex'
  sourceId: string
  suggestion: string
}

// ===== 对话预览 =====
export interface DialogLine {
  speaker: string
  text: string
  citedSetting: string
  oocRisk: boolean
}

export interface DialogPreview {
  id: string
  characterId: string
  presetScene: string
  lines: DialogLine[]
}

// ===== 存储 key =====
export type StoreKey =
  | 'worlds'
  | 'characters'
  | 'relations'
  | 'timeline'
  | 'codex'
  | 'mapNodes'
  | 'shareCards'
  | 'importJobs'
