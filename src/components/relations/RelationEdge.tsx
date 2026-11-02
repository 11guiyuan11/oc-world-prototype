import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'

export interface RelationEdgeData {
  label: string
  color: string
  lineStyle: 'solid' | 'dashed' | 'dotted'
  relType: string
  curvature: number
  labelOffsetY: number
}

function dashFor(lineStyle?: string) {
  if (lineStyle === 'dashed') return '8 4'
  if (lineStyle === 'dotted') return '2 4'
  return undefined
}

export default function RelationEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd } = props
  const d = data as RelationEdgeData | undefined
  const color = d?.color ?? '#94a3b8'
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: d?.curvature ?? 0,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: color, strokeWidth: 1.8, strokeDasharray: dashFor(d?.lineStyle) }}
      />
      {d?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + (d?.labelOffsetY ?? 0)}px)`,
              pointerEvents: 'none',
            }}
            className="nodrag nopan rounded-full border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm"
          >
            {d.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
