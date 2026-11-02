export default function PageStub({ title, code }: { title: string; code: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{code} · 页面待实现</p>
      <div className="mt-6 flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        占位内容 — 将在后续批次实现
      </div>
    </div>
  )
}
