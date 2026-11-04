import type {
  World,
  Character,
  Relation,
  TimelineEvent,
  CodexEntry,
  MapNode,
  ShareCard,
} from '../types'

const H = 3600_000
const now = Date.now()

const world: World = {
  id: 'world-wugang',
  name: '雾港纪事',
  tagline: '海雾之下，齿轮与谎言一同转动。',
  genreTags: ['悬疑', '蒸汽朋克', '都市'],
  era: '架空近未来 · 蒸汽与电气并存',
  calendarName: '星历',
  calendarStart: 0,
  cover: '',
  description:
    '雾港城终年被浓雾笼罩，机械公会与烬组织明争暗斗。调查员林见月追查十年前大火的真相，却一步步逼近自己身世的谜团。',
}

const neonWorld: World = {
  id: 'world-neon',
  name: '赛博朋克：霓虹深渊',
  tagline: '在数据洪流中，记忆是最昂贵的商品。',
  genreTags: ['赛博朋克', '科幻', '反乌托邦'],
  era: '近未来 · 数字都市',
  calendarName: '网络纪元',
  calendarStart: 2080,
  cover: '',
  description:
    '霓虹深渊，一座被数据洪流淹没的超级都市。记忆可以买卖，义体可以改造，而真正的自由早已在算法中迷失。',
}

const characters: Character[] = [
  {
    id: 'char-lin',
    name: '林见月',
    alias: ['见月', '雾港之眼'],
    identity: '雾港调查局·调查员',
    age: '24',
    faction: '雾港调查局',
    avatar: '',
    themeColor: '#6366f1',
    intro: '冷静克制的调查员，擅长从细节中还原真相。',
    longBio:
      '林见月，雾港调查局最年轻的资深调查员。十年前的大火夺走了她的双亲，也让她从此只相信证据与逻辑。她习惯在浓雾中独自办案，直到遇见机械师学徒阿柚，才第一次学会把后背交给别人。',
    personalityTags: ['冷静', '观察敏锐', '理性', '外冷内热'],
    appearance: '黑色短发，灰蓝瞳孔，常穿深色长风衣，左耳戴一枚旧铜齿轮耳钉。',
    outfits: [],
    taboos: ['灰蓝瞳孔，切勿画成纯黑或紫色', '左耳旧铜齿轮耳钉不可遗漏'],
    voiceUrl: null,
    gallery: [],
    attributes: [
      { dimension: '冷静', value: 90 },
      { dimension: '观察', value: 88 },
      { dimension: '推理', value: 92 },
      { dimension: '武力', value: 62 },
      { dimension: '社交', value: 45 },
    ],
    updatedAt: now - 2 * H,
  },
  {
    id: 'char-shen',
    name: '沈烬',
    alias: ['烬', '烬主'],
    identity: '烬组织·首领',
    age: '28',
    faction: '烬组织',
    avatar: '',
    themeColor: '#ef4444',
    intro: '敌对组织的首领，为达目的不择手段，却对妹妹阿柚留有最后的温柔。',
    longBio:
      '沈烬，烬组织的创立者与首领。十年前的大火让他失去一切，也让他确信只有握紧力量才能保护重要的人。他表面冷酷狠辣，实则背负着与妹妹阿柚失散多年的愧疚。',
    personalityTags: ['野心', '果决', '偏执', '隐忍'],
    appearance: '暗红长发，金色瞳孔，右脸有一道旧烧伤痕，常披黑色大氅。',
    outfits: [],
    taboos: ['右脸旧烧伤痕不可省略', '金色瞳孔，非红瞳'],
    voiceUrl: null,
    gallery: [],
    attributes: [
      { dimension: '冷静', value: 88 },
      { dimension: '领导', value: 90 },
      { dimension: '武力', value: 85 },
      { dimension: '魅力', value: 75 },
      { dimension: '野心', value: 95 },
    ],
    updatedAt: now - 30 * H,
  },
  {
    id: 'char-you',
    name: '阿柚',
    alias: ['柚子', '小齿轮'],
    identity: '机械师学徒',
    age: '19',
    faction: '雾港机械公会',
    avatar: '',
    themeColor: '#f59e0b',
    intro: '元气满满的机械师学徒，动手能力强，是调查搭档中的活力担当。',
    longBio:
      '阿柚，雾港机械公会的学徒，天生对齿轮与蒸汽机关有着惊人的天赋。她性格开朗、话多，与沉默的林见月正好互补。她不知道自己的兄长沈烬，正是调查局追捕的烬组织首领。',
    personalityTags: ['元气', '机灵', '热情', '重感情'],
    appearance: '橙色双马尾，琥珀色瞳孔，脸上常沾着机油，工装背带裤。',
    outfits: [],
    taboos: ['橙色双马尾 + 琥珀色瞳孔', '脸上常沾机油是她的标志'],
    voiceUrl: null,
    gallery: [],
    attributes: [
      { dimension: '机械', value: 88 },
      { dimension: '活力', value: 90 },
      { dimension: '观察', value: 70 },
      { dimension: '武力', value: 40 },
      { dimension: '社交', value: 65 },
    ],
    updatedAt: now - 10 * H,
  },
]

const relations: Relation[] = [
  {
    id: 'rel-1',
    sourceId: 'char-lin',
    targetId: 'char-shen',
    type: '敌对',
    label: '宿敌',
    color: '#ef4444',
    lineStyle: 'dashed',
    note: '十年前大火真相的对立双方。',
  },
  {
    id: 'rel-2',
    sourceId: 'char-lin',
    targetId: 'char-you',
    type: '搭档',
    label: '调查搭档',
    color: '#6366f1',
    lineStyle: 'solid',
    note: '雾港调查局临时搭档，性格互补。',
  },
  {
    id: 'rel-3',
    sourceId: 'char-lin',
    targetId: 'char-you',
    type: '师徒',
    label: '调查术导师',
    color: '#f59e0b',
    lineStyle: 'solid',
    note: '林见月指导阿柚调查方法。',
  },
  {
    id: 'rel-4',
    sourceId: 'char-shen',
    targetId: 'char-you',
    type: '契约',
    label: '技术雇佣',
    color: '#10b981',
    lineStyle: 'dotted',
    note: '烬组织曾雇佣阿柚维护机械。',
  },
  {
    id: 'rel-5',
    sourceId: 'char-shen',
    targetId: 'char-you',
    type: '亲情',
    label: '兄妹',
    color: '#ec4899',
    lineStyle: 'solid',
    note: '沈烬是阿柚失散多年的兄长。',
  },
]

const timeline: TimelineEvent[] = [
  {
    id: 'ev-298',
    calendarYear: 298,
    displayDate: '星历 298 年',
    title: '雾港大火灾',
    description:
      '雾港旧城区突发大火，数百人遇难。官方定性为锅炉爆炸事故，但林见月的双亲死于这场大火。',
    characterIds: ['char-lin'],
    mapNodeId: 'map-wugang',
    image: '',
    updatedAt: now - 70 * H,
  },
  {
    id: 'ev-300',
    calendarYear: 300,
    displayDate: '星历 300 年',
    title: '林见月加入调查局',
    description: '林见月以第一名成绩进入雾港调查局，开始追查十年前大火的真相。',
    characterIds: ['char-lin'],
    mapNodeId: null,
    image: '',
    updatedAt: now - 45 * H,
  },
  {
    id: 'ev-301',
    calendarYear: 301,
    displayDate: '星历 301 年',
    title: '烬组织浮出水面',
    description: '一个名为「烬」的秘密结社在雾港地下世界崛起，首领身份成谜。',
    characterIds: ['char-shen'],
    mapNodeId: 'map-wugang',
    image: '',
    updatedAt: now - 20 * H,
  },
  {
    id: 'ev-302',
    calendarYear: 302,
    displayDate: '星历 302 年',
    title: '阿柚与林见月搭档',
    description: '机械师学徒阿柚因一桩机械事故与林见月结识，成为搭档。',
    characterIds: ['char-lin', 'char-you'],
    mapNodeId: null,
    image: '',
    updatedAt: now - 5 * H,
  },
]

const codex: CodexEntry[] = [
  {
    id: 'codex-1',
    category: '地点',
    title: '雾港调查局',
    content:
      '雾港城的官方调查机构，负责侦破各类悬案。局内规矩森严，以「证据至上」为信条。',
    tags: ['机构', '雾港城'],
  },
  {
    id: 'codex-2',
    category: '组织',
    title: '烬组织',
    content:
      '活跃于雾港地下的秘密结社，掌控着大量非法机械交易。首领「烬主」行踪诡秘，与十年前的大火关系密切。',
    tags: ['敌对', '秘密结社'],
  },
]

const mapNodes: MapNode[] = [
  {
    id: 'map-north',
    parentId: null,
    name: '北境大陆',
    level: '世界',
    image: '',
    markers: [],
  },
  {
    id: 'map-wugang',
    parentId: 'map-north',
    name: '雾港城',
    level: '城市',
    image: '',
    markers: [
      {
        id: 'mk-1',
        x: 0.5,
        y: 0.5,
        name: '雾港调查局',
        codexId: 'codex-1',
        characterId: null,
        eventId: null,
      },
    ],
  },
]

const shareCards: ShareCard[] = [
  {
    id: 'card-lin',
    characterId: 'char-lin',
    fields: {
      cover: true,
      name: true,
      tagline: true,
      avatar: true,
      tags: true,
      outfit: true,
      relations: true,
      events: true,
      quote: true,
      qrcode: true,
    },
    theme: 'indigo',
    layout: 'long',
  },
]

const neonCharacters: Character[] = [
  {
    id: 'neon-ni',
    worldId: 'world-neon',
    name: '霓',
    alias: ['Neon', '深渊幽灵'],
    identity: '自由黑客',
    age: '21',
    faction: '黑客组织「深渊」',
    avatar: '',
    themeColor: '#06b6d4',
    intro: '游走于数据暗网的天才黑客，用代码对抗霓虹深渊的掌控者。',
    longBio:
      '霓，霓虹深渊最臭名昭著的黑客。她相信信息应当自由，于是不断入侵掌控整座城市的「主脑」，把被垄断的记忆数据公之于众。',
    personalityTags: ['叛逆', '机敏', '孤僻', '理想主义'],
    appearance: '荧光青短发，右眼植入一枚发光的数据义眼，常穿黑色机能风衣。',
    outfits: [],
    voiceUrl: null,
    gallery: [],
    attributes: [
      { dimension: '骇客', value: 92 },
      { dimension: '敏捷', value: 80 },
      { dimension: '魅力', value: 55 },
      { dimension: '武力', value: 40 },
    ],
    taboos: ['右眼发光数据义眼不可省略'],
    updatedAt: now - 1 * H,
  },
  {
    id: 'neon-zero',
    worldId: 'world-neon',
    name: '零',
    alias: ['Zero', '义体佣兵'],
    identity: '义体改造佣兵',
    age: '27',
    faction: '自由佣兵',
    avatar: '',
    themeColor: '#f43f5e',
    intro: '全身义体化的赏金猎人，冷血高效，只为最高出价者效力。',
    longBio:
      '零，一名几乎完全义体化的佣兵。他记不清自己成为义体前的样子，只靠接单活着。霓是他唯一不愿下手的对象。',
    personalityTags: ['冷血', '高效', '寡言', '守诺'],
    appearance: '银灰短发，红色瞳孔，右臂为碳纤维义体，常穿战术背心。',
    outfits: [],
    voiceUrl: null,
    gallery: [],
    attributes: [
      { dimension: '武力', value: 90 },
      { dimension: '冷静', value: 85 },
      { dimension: '骇客', value: 30 },
      { dimension: '社交', value: 25 },
    ],
    taboos: ['右臂碳纤维义体不可省略', '红色瞳孔'],
    updatedAt: now - 3 * H,
  },
]

const neonRelations: Relation[] = [
  {
    id: 'neon-rel-1',
    worldId: 'world-neon',
    sourceId: 'neon-ni',
    targetId: 'neon-zero',
    type: '搭档',
    label: '临时搭档',
    color: '#06b6d4',
    lineStyle: 'dashed',
    note: '霓与零因一桩数据窃案临时联手。',
  },
]

const neonTimeline: TimelineEvent[] = [
  {
    id: 'neon-ev-2080',
    worldId: 'world-neon',
    calendarYear: 2080,
    displayDate: '网络纪元 2080 年',
    title: '霓虹深渊第一次大断网',
    description:
      '主脑遭遇史无前例的黑客攻击，整座城市断网 12 小时，记忆交易市场一度崩溃。',
    characterIds: ['neon-ni'],
    mapNodeId: 'neon-map-city',
    image: '',
    updatedAt: now - 2 * H,
  },
]

const neonCodex: CodexEntry[] = [
  {
    id: 'neon-codex-1',
    worldId: 'world-neon',
    category: '组织',
    title: '深渊',
    content:
      '霓虹深渊地下最神秘的黑客组织，主张信息自由，常年与掌控城市的主脑对抗。',
    tags: ['黑客', '反乌托邦'],
  },
]

const neonMapNodes: MapNode[] = [
  {
    id: 'neon-map-city',
    worldId: 'world-neon',
    parentId: null,
    name: '霓虹深渊',
    level: '世界',
    image: '',
    markers: [],
  },
]

export function buildSeedData() {
  return {
    worlds: [world, neonWorld],
    characters: [...characters, ...neonCharacters],
    relations: [...relations, ...neonRelations],
    timeline: [...timeline, ...neonTimeline],
    codex: [...codex, ...neonCodex],
    mapNodes: [...mapNodes, ...neonMapNodes],
    shareCards,
  }
}
