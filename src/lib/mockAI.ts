import type {
  Character,
  ConsistencyIssue,
  DialogPreview,
  DialogLine,
} from '../types'
import { load, uid } from './storage'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// ===== 流式打字机（演示模式） =====
export async function mockStreamChat(
  messages: ChatMessage[],
  onChunk: (delta: string) => void,
  onDone: () => void,
): Promise<void> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const text =
    lastUser?.content?.slice(0, 40) ??
    '（演示模式）这是一段 AI 生成的示例文本，用于在未配置 API Key 时展示流式打字机效果。'
  const demo =
    '【演示模式】未配置 DeepSeek API Key，以下为本地模拟输出。\n\n' +
    `针对「${text}」，我建议从世界观基调、角色动机与时间线一致性三个角度展开设定。\n\n` +
    '1. 世界观基调：明确时代背景与核心矛盾，让所有设定都服务于同一母题。\n' +
    '2. 角色动机：每个角色的行为都应可追溯到其过往经历与欲望。\n' +
    '3. 时间线一致性：纪年、事件先后与角色年龄需相互印证。'

  for (const ch of demo) {
    await sleep(16)
    onChunk(ch)
  }
  onDone()
}

// ===== 一致性检查（演示模式） =====
export function mockCheckConsistency(
  text: string,
  _worldContext: string,
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = []

  if (text.includes('笑')) {
    issues.push({
      id: uid(),
      level: '提醒',
      message: '林见月被设定为冷静克制的调查员，此处出现笑容/笑意，语气可能偏 OOC。',
      sourceType: 'character',
      sourceId: 'char-lin',
      suggestion: '将笑容改为克制的细微表情（如「嘴角极轻地扬了一下」），或明确标注为极特殊情况。',
    })
  }

  if (text.includes('沈烬')) {
    issues.push({
      id: uid(),
      level: '严重',
      message: '沈烬在设定中为敌对组织「烬组织」首领，与调查局立场对立；若此处表现为友好，与「宿敌」关系冲突。',
      sourceType: 'relation',
      sourceId: 'rel-1',
      suggestion: '补充立场冲突，或说明此处刻意隐藏真实目的。',
    })
  }

  if (text.includes('阿柚') && (text.includes('兄妹') || text.includes('哥哥') || text.includes('兄长'))) {
    issues.push({
      id: uid(),
      level: '提醒',
      message: '阿柚（19 岁）与「星历 298 年雾港大火灾」存在潜在年龄矛盾，且与沈烬的兄妹关系需与时间线互证。',
      sourceType: 'timeline',
      sourceId: 'ev-298',
      suggestion: '核对阿柚出生年份，或在大火事件中补充其当时年幼的说明。',
    })
  }

  issues.push({
    id: uid(),
    level: '建议',
    message: '该片段缺少场景氛围或角色外貌描写，可增加细节以增强代入感。',
    sourceType: 'character',
    sourceId: 'char-lin',
    suggestion: '补充雾港的浓雾、昏黄灯火等环境描写，或角色的外貌细节。',
  })

  return issues
}

// ===== 角色对话预览（演示模式） =====
const SCENE_LINES: Record<string, DialogLine[]> = {
  日常: [
    { speaker: '林见月', text: '雾又浓了。出门记得带指南针。', citedSetting: '性格：冷静、外冷内热', oocRisk: false },
    { speaker: '阿柚', text: '知道啦——见月姐你今天该不会又没吃早饭吧？', citedSetting: '关系：调查搭档', oocRisk: false },
    { speaker: '林见月', text: '……调查局楼下买了咖啡。', citedSetting: '设定：雾港城浓雾', oocRisk: false },
  ],
  冲突: [
    { speaker: '沈烬', text: '雾港的真相，从来不是你们调查局能碰的。', citedSetting: '身份：烬组织首领', oocRisk: false },
    { speaker: '林见月', text: '十年前的大火，和你到底有什么关系？', citedSetting: '时间轴：雾港大火灾', oocRisk: false },
    { speaker: '沈烬', text: '你什么都不知道，见月。', citedSetting: '关系：宿敌 / 身世谜团', oocRisk: true },
  ],
  求助: [
    { speaker: '阿柚', text: '见月姐，那个……我好像把调查局的蒸汽引擎搞坏了。', citedSetting: '身份：机械师学徒', oocRisk: false },
    { speaker: '林见月', text: '……先别动，我看看。', citedSetting: '关系：师徒 / 搭档', oocRisk: false },
  ],
  告白: [
    { speaker: '林见月', text: '我不是擅长说这些的人。', citedSetting: '性格：外冷内热', oocRisk: true },
    { speaker: '阿柚', text: '没关系，我替你说！我喜欢你，见月姐！', citedSetting: '性格：元气、重感情', oocRisk: false },
  ],
  战斗前: [
    { speaker: '沈烬', text: '带着你的小徒弟离开雾港，这与你无关。', citedSetting: '关系：兄妹（隐藏）', oocRisk: false },
    { speaker: '林见月', text: '真相没有“无关”二字。', citedSetting: '信条：证据至上', oocRisk: false },
  ],
}

export async function mockGenerateDialog(
  characterId: string,
  scene: string,
  _worldContext: string,
): Promise<DialogPreview> {
  const character = load<Character>('characters').find((c) => c.id === characterId)
  const name = character?.name ?? '林见月'
  const base = SCENE_LINES[scene] ?? SCENE_LINES['日常']
  // 将第一句说话人替换为当前角色，模拟「以该角色为视角」
  const lines: DialogLine[] = base.map((l, i) => ({
    ...l,
    speaker: i === 0 && l.speaker !== name ? name : l.speaker,
  }))
  await sleep(300)
  return {
    id: uid(),
    characterId,
    presetScene: scene,
    lines,
  }
}

export async function mockStreamDialog(
  characterId: string,
  scene: string,
  onChunk: (delta: string) => void,
  onDone: () => void,
): Promise<void> {
  const preview = await mockGenerateDialog(characterId, scene, '')
  const text = preview.lines.map((l) => `${l.speaker}：${l.text}`).join('\n') + '\n'
  for (const ch of text) {
    await sleep(20)
    onChunk(ch)
  }
  onDone()
}

// ===== 世界背景草稿（演示模式） =====
export async function mockWorldDraft(tags: string[]): Promise<string> {
  await sleep(200)
  return `【演示模式】世界背景草稿\n\n标签：${tags.join('、') || '未指定'}\n\n这是一个架空世界。建议围绕一条核心矛盾（如“秩序与自由”“科技与禁忌”）展开，先确定地理格局与纪年体系，再铺设势力版图与关键事件。\n\n- 核心母题：在迷雾中寻找真相\n- 势力：官方调查机构 / 地下秘密结社 / 中立机械公会\n- 基调：悬疑 × 蒸汽朋克`
}

// ===== 展示卡气质提示词（演示模式） =====
export async function mockShareCardPrompt(character: Character): Promise<string> {
  await sleep(200)
  return [
    `关键词：${['冷静', '克制', '灰蓝', '风衣', '雾港'].join(' / ')}`,
    '',
    `画师描述：一名${character.age}岁的${character.identity}，黑色短发、灰蓝瞳孔，深色长风衣，左耳旧铜齿轮耳钉。整体气质清冷克制，背景是雾港的浓雾与昏黄灯火，冷暖对比，突出「外冷内热」的层次感。`,
  ].join('\n')
}
