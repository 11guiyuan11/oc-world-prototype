import { MapPin } from 'lucide-react'
import type { MapMarker } from '../../types'

interface Props {
  marker: MapMarker
  onClick: () => void
}

export default function Marker({ marker, onClick }: Props) {
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center"
      style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
    >
      <span className="mb-0.5 whitespace-nowrap rounded-md border border-border/60 bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-foreground shadow-sm">
        {marker.name}
      </span>
      <MapPin
        className="h-6 w-6 drop-shadow"
        style={{ color: marker.color || '#7c3aed' }}
        fill="currentColor"
        strokeWidth={1.5}
      />
    </button>
  )
}
