import type {
  Character,
  ConsistencyIssue,
  DialogPreview,
  Relation,
  TimelineEvent,
  World,
} from '../types'
import { load, loadByWorld, uid } from './storage'
import * as mockAI from './mockAI'
import type { ChatMessage } from './mockAI'

// ===== DeepSeek 最新版配置 =====
const BASE_URL = 'https://api.deepseek.com'
const ENDPOINT = '/chat/completions'
const MODEL = 'deepseek-flash' // 已升级为 DeepSeek-V4.1-Flash-1017（当前最新版）

function getApiKey(): string {
  return import.meta.env.VITE_DEEPSEEK_API_KEY ?? ''
}

/** 未配置 Key 时进入演示模式 */
export function isDemoMode(): boolean {
  return !getApiKey()
}

// ===== 非流式调用 =====
async function chat(messages: ChatMessage[]): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('未配置 DeepSeek API Key')
  const res = await fetch(`${BASE_URL}${ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`)
  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

// ===== 流式调用（SSE 打字机） =====
export async function streamChat(
  messages: ChatMessage[],
  onChunk: (delta: string) => void,
  onDone: () => void,
  onError: (e: Error) => void,
  mockFallback?: (onChunk: (delta: string) => void, onDone: () => void) => Promise<void>,
): Promise<void> {
  const apiKey = getApiKey()
  if (!apiKey) {
    if (mockFallback) await mockFallback(onChunk, onDone)
    else await mockAI.mockStreamChat(messages, onChunk, onDone)
    return
  }
  try {
    const res = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
        thinking: { type: 'enabled' },
        reasoning_effort: 'high',
      }),
    })

    if (!res.ok || !res.body) throw new Error(`DeepSeek API error: ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') {
          onDone()
          return
        }
        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta?.content
          if (delta) onChunk(delta)
        } catch {
          // 忽略无法解析的块
        }
      }
    }
    onDone()
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    onError(err) // 通知 UI：真实 API 失败，将降级到演示模式
    if (mockFallback) await mockFallback(onChunk, onDone)
    else await mockAI.mockStreamChat(messages, onChunk, onDone)
  }
}

// ===== 结构化输出辅助 =====
function extractJson(text: string): string {
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1)
  const s2 = text.indexOf('{')
  const e2 = text.lastIndexOf('}')
  if (s2 !== -1 && e2 !== -1 && e2 > s2) return text.slice(s2, e2 + 1)
  return text
}

// ===== 一致性检查 =====
export async function checkConsistency(
  text: string,
  worldContext: string,
): Promise<ConsistencyIssue[]> {
  try {
    const sys = `你是 OC 世界观设定一致性检查器。请根据提供的世界观设定，检查用户给出的剧情/对话草稿，找出设定冲突。只输出 JSON 数组，每个元素格式：
{"level":"严重|提醒|建议","message":"问题描述","sourceType":"character|timeline|relation|codex","sourceId":"相关实体id或空字符串","suggestion":"修改建议"}。不要输出任何其他文字。`
    const content = await chat([
      { role: 'system', content: sys },
      { role: 'user', content: `世界观设定：\n${worldContext}\n\n待检查文本：\n${text}` },
    ])
    const arr = JSON.parse(extractJson(content)) as ConsistencyIssue[]
    if (!Array.isArray(arr) || arr.length === 0) throw new Error('empty result')
    return arr.map((it, i) => ({
      id: uid(),
      level: it.level ?? '提醒',
      message: it.message ?? '',
      sourceType: it.sourceType ?? 'character',
      sourceId: it.sourceId ?? '',
      suggestion: it.suggestion ?? '',
    }))
  } catch {
    return mockAI.mockCheckConsistency(text, worldContext)
  }
}

// ===== 角色对话预览 =====
export async function generateCharacterDialog(
  characterId: string,
  scene: string,
  worldContext: string,
): Promise<DialogPreview> {
  try {
    const character = load<Character>('characters').find((c) => c.id === characterId)
    const sys = `你是 OC 角色对话生成器。请以角色「${character?.name ?? '角色'}」（身份：${character?.identity ?? '未知'}，性格：${(character?.personalityTags ?? []).join('、')}）为视角，基于世界观设定生成一段「${scene}」场景的短对话。只输出 JSON 数组，每个元素：
{"speaker":"说话人","text":"台词","citedSetting":"引用到的设定","oocRisk":true或false}。不要输出其他文字。`
    const content = await chat([
      { role: 'system', content: sys },
      { role: 'user', content: `世界观设定：\n${worldContext}` },
    ])
    const lines = JSON.parse(extractJson(content)) as DialogPreview['lines']
    if (!Array.isArray(lines) || lines.length === 0) throw new Error('empty dialog')
    return { id: uid(), characterId, presetScene: scene, lines }
  } catch {
    return mockAI.mockGenerateDialog(characterId, scene, worldContext)
  }
}

// ===== 世界背景草稿（流式） =====
export async function generateWorldDraft(tags: string[]): Promise<string> {
  try {
    const sys = '你是世界观创作者。请根据给定标签，撰写一段世界背景草稿，含核心母题、势力版图、时代基调。用中文，约 300 字。'
    const content = await chat([
      { role: 'system', content: sys },
      { role: 'user', content: `类型标签：${tags.join('、')}` },
    ])
    return content
  } catch {
    return mockAI.mockWorldDraft(tags)
  }
}

// ===== 展示卡气质提示词 =====
export async function generateShareCardPrompt(character: Character): Promise<string> {
  try {
    const sys = '你是画师向的角色气质提示词生成器。请根据角色档案，输出 3-5 个关键词 + 一段画师描述（外貌、配色、气质、氛围）。用中文。'
    const content = await chat([
      { role: 'system', content: sys },
      {
        role: 'user',
        content: `角色：${character.name}\n身份：${character.identity}\n年龄：${character.age}\n外貌：${character.appearance}\n性格：${(character.personalityTags ?? []).join('、')}\n简介：${character.intro}`,
      },
    ])
    return content
  } catch {
    return mockAI.mockShareCardPrompt(character)
  }
}

// ===== 构建世界上下文（供一致性检查 / 对话生成使用） =====
export function buildWorldContext(): string {
  const worlds = load<World>('worlds')
  const characters = loadByWorld<Character>('characters')
  const relations = loadByWorld<Relation>('relations')
  const timeline = loadByWorld<TimelineEvent>('timeline')

  const w = worlds[0]
  const worldLine = w
    ? `世界观：${w.name}（${w.tagline}）｜时代：${w.era}｜纪年：${w.calendarName}`
    : '世界观：未创建'

  const charLines = characters
    .map((c) => `- ${c.name}（${c.identity}，${c.age}岁，阵营：${c.faction}）：${c.intro}`)
    .join('\n')

  const relLines = relations
    .map((r) => {
      const s = characters.find((c) => c.id === r.sourceId)?.name ?? r.sourceId
      const t = characters.find((c) => c.id === r.targetId)?.name ?? r.targetId
      return `- ${s} → ${t}：${r.type}（${r.label}）`
    })
    .join('\n')

  const evLines = timeline
    .map((e) => `- ${e.displayDate}：${e.title}（${e.description.slice(0, 40)}）`)
    .join('\n')

  return `${worldLine}\n\n角色：\n${charLines}\n\n关系：\n${relLines}\n\n时间轴：\n${evLines}`
}

// ===== 角色对话预览（流式） =====
export async function streamCharacterDialog(
  characterId: string,
  scene: string,
  worldContext: string,
  onChunk: (delta: string) => void,
  onDone: () => void,
  onError: (e: Error) => void,
): Promise<void> {
  const character = load<Character>('characters').find((c) => c.id === characterId)
  const sys = `你是 OC 角色对话生成器。请以「${character?.name ?? '角色'}」（身份：${character?.identity ?? ''}，性格：${(character?.personalityTags ?? []).join('、')}）为核心，基于世界观设定生成一段「${scene}」场景的短对话。每行格式「角色名：台词」，不超过 6 行，用中文，不要输出其他内容。`
  await streamChat(
    [
      { role: 'system', content: sys },
      { role: 'user', content: `世界观设定：\n${worldContext}` },
    ],
    onChunk,
    onDone,
    onError,
    (oc, od) => mockAI.mockStreamDialog(characterId, scene, oc, od),
  )
}
