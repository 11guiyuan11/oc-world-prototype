import { useRef, useState } from 'react'
import { Download, FileJson, Upload } from 'lucide-react'
import { downloadBlob, exportJSON, readFileAsText, save } from '../lib/storage'
import type { StoreKey } from '../types'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { toast } from '../components/ui/toast'

const STORE_KEYS: StoreKey[] = ['worlds', 'characters', 'relations', 'timeline', 'codex', 'mapNodes', 'shareCards']

export default function Data() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [dragging, setDragging] = useState(false)

  function handleExport() {
    const date = new Date().toISOString().slice(0, 10)
    downloadBlob(exportJSON(), `oc-世界观备份-${date}.json`)
    toast('已导出 JSON 备份', 'success')
  }

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.json')) {
      toast('请选择 JSON 文件', 'error')
      return
    }
    setImporting(true)
    try {
      const text = await readFileAsText(file)
      const data = JSON.parse(text)
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('JSON 结构无效')
      const present = STORE_KEYS.filter((k) => Array.isArray(data[k]))
      if (present.length === 0) throw new Error('缺少必须的数据字段（worlds/characters 等）')
      present.forEach((k) => save(k, data[k]))
      toast(`导入成功（${present.length} 个数据集），即将刷新`, 'success')
      setTimeout(() => window.location.reload(), 900)
    } catch (e) {
      toast(e instanceof Error ? e.message : '导入失败', 'error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">数据导入与导出</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        所有数据保存在本地浏览器 localStorage，请定期备份以防数据丢失。
      </p>

      <div className="mt-6 space-y-4">
        {/* 导出 */}
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="font-medium">导出完整项目 JSON</div>
              <div className="text-sm text-muted-foreground">打包世界观、角色、关系、时间轴、图鉴、地图等全部数据</div>
            </div>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4" />
              导出
            </Button>
          </CardContent>
        </Card>

        {/* 导入 */}
        <Card>
          <CardContent className="p-5">
            <div className="font-medium">导入 JSON 备份</div>
            <div className="text-sm text-muted-foreground">读取 JSON 并合并到当前数据</div>
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                const f = e.dataTransfer.files?.[0]
                if (f) handleFile(f)
              }}
              className={`mt-3 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition-colors ${
                dragging ? 'border-primary bg-accent/40' : 'hover:bg-secondary/40'
              }`}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">拖拽 JSON 文件到此处，或</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => fileRef.current?.click()} disabled={importing}>
                {importing ? '导入中…' : '选择文件'}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
            </div>
          </CardContent>
        </Card>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileJson className="h-3.5 w-3.5" />
          导入会覆盖同名数据集（worlds/characters/…），不会清空未包含的数据。
        </p>
      </div>
    </div>
  )
}
