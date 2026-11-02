# OC 世界观创作、管理与展示平台

一个纯前端的 OC（Original Character）世界观创作工具，用于**约稿、自己捋设定、与他人分享**。

## 特性

- **纯前端**：无后端、无数据库、无服务端接口，所有数据存于浏览器 `localStorage`
- **AI 能力**：前端直连 DeepSeek（流式输出 + 思考模式），缺 Key 自动降级 mockAI
- **完整创作闭环**：建世界观 → 加角色 → 连关系 → 生成展示卡 → 分享
- **数据可导入导出**：JSON 备份 / 还原

## 技术栈

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui 风格组件 · lucide-react · react-router-dom · @xyflow/react · recharts · html-to-image · qrcode.react

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:5173

生产构建：

```bash
npm run build
npm run preview
```

## DeepSeek 配置

在项目根目录创建 `.env`（参考 `.env.example`）：

```
VITE_DEEPSEEK_API_KEY=sk-xxx
```

- 未配置 Key 时，页面进入「演示模式」，AI 功能全部走 mock 数据，不影响其他功能。
- 模型统一使用 `deepseek-flash`（已升级为 DeepSeek-V4.1-Flash-1017）。
- 端点：`https://api.deepseek.com/chat/completions`，`stream: true` 流式输出，`thinking: { type: "enabled" }` 开启思考模式。

## 功能列表

| 模块 | 说明 |
|---|---|
| P0 全局壳 | 左导航 + 顶栏 + 右属性面板，保存状态 / 演示模式标识 |
| P1 项目首页 | 四步创作进度（建地基→捏泥人→连关系→出成品） |
| P2 世界观向导 | 三步创建 + AI 生成背景草稿（流式） |
| P3 世界观主页 | 封面 + 统计卡片 + 待办 + 最近编辑 + AI 摘要 |
| P4 角色库 | 搜索 / 标签筛选 / 排序 / 新建 / 批量删除 |
| P5 角色详情 | 档案 / 相册 / 雷达图（跨角色+快照对比）/ 服装 / 关系 / 时间轴 |
| P6 关系图 | 2D（@xyflow/react）+ CSS 3D + 连线编辑 + 多重边错开 |
| P7 时间轴 | 自定义纪年 / 横纵切换 / 角色·地区筛选 / 缩放 |
| P8 图鉴地图 | 图鉴 CRUD + 多层级地图（底图 / 打点 / 下钻 / 缩放平移） |
| P9 一致性检查 | AI 对话预览（流式）+ 设定一致性检查（三级问题 + 来源跳转） |
| P10 展示卡 | 三栏配置 + 长图/名片预览 + AI 气质提示词 + 导出 PNG |
| P11 画师导出 | 画师友好设定集（隐藏长篇/事件，含禁忌点）+ 导出图片 |
| P12 数据 | JSON 备份导出 / 导入还原 |
| P13 分享页 | 移动端只读分享（隐藏私密设定） |

## 数据存储说明

- 所有数据存于 `localStorage`，上限约 **5MB**。
- 图片以 base64 存储（体积约膨胀 33%），长图 / 多图建议压缩或分卷导出。
- 请定期通过「数据」页导出 JSON 备份。

## 生产部署建议（重要）

前端直连 DeepSeek 会在浏览器暴露 API Key。生产环境应通过**服务端代理**转发请求，将 Key 保存在服务端环境变量中，前端只调用自己的代理接口：

- Vercel Serverless Function / Edge Function
- Nginx 反向代理
- Next.js API Route

当前「前端直连」仅用于原型演示。

## 部署 Demo（Netlify / Vercel）

1. 打包

```bash
npm run build
```

生成的 `dist/` 文件夹就是纯静态站点。

### Netlify

- **方式 A（拖拽）**：登录 Netlify，把 `dist/` 文件夹直接拖到 Sites 页面即可上线。
- **方式 B（Git）**：连接 GitHub 仓库，Build command 填 `npm run build`，Publish directory 填 `dist`。

### Vercel

- **方式 A（CLI）**：安装 `vercel`，在项目根目录运行 `vercel`，按提示部署。
- **方式 B（Git）**：导入 GitHub 仓库，Framework 选 Vite，Build command `npm run build`，Output directory `dist`。

### 部署说明

- 路由已用 Hash 模式（`/#/...`），静态服务器刷新不会 404。
- 资源已用相对路径（`base: './'`），可部署到任意子路径。
- 生产环境侧栏提供「重置演示数据」按钮，点击清空 localStorage 恢复到初始 Mock 数据。
