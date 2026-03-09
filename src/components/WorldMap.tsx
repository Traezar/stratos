import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import { useMemo, useRef, useState } from 'react'
import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MapMode } from '../routes/map'
import type { Waypoint } from '../lib/waypoints'

const MAP_VIEW = new MapView({ repeat: true })

const LABEL_ZOOM_THRESHOLD = 5
const INITIAL_VIEW_STATE = { longitude: 0, latitude: 20, zoom: 2 }
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const COLOR_NAMED: [number, number, number] = [59, 130, 246]
const COLOR_GRID: [number, number, number] = [220, 220, 220]

const MODES: { value: MapMode; label: string }[] = [
  { value: 'named', label: 'Named' },
  { value: 'grid', label: 'Grid' },
  { value: 'both', label: 'Both' },
]

type Props = {
  mode: MapMode
  onModeChange: (mode: MapMode) => void
  namedWaypoints: Waypoint[]
  gridWaypoints: Waypoint[]
}

export default function WorldMap({ mode, onModeChange, namedWaypoints, gridWaypoints }: Props) {
  const [labelsVisible, setLabelsVisible] = useState(false)
  const zoomRef = useRef(INITIAL_VIEW_STATE.zoom)

  const layers = useMemo(() => {
    const showNamed = mode === 'named' || mode === 'both'
    const showGrid = mode === 'grid' || mode === 'both'
    const result = []

    if (showGrid && gridWaypoints.length > 0) {
      result.push(
        new ScatterplotLayer<Waypoint>({
          id: 'grid-waypoints',
          data: gridWaypoints,
          getPosition: (d) => [d.longitude, d.latitude],
          getRadius: 3,
          radiusUnits: 'pixels',
          radiusMinPixels: 2,
          getFillColor: COLOR_GRID,
        }),
      )
    }

    if (showNamed && namedWaypoints.length > 0) {
      result.push(
        new ScatterplotLayer<Waypoint>({
          id: 'named-waypoints',
          data: namedWaypoints,
          getPosition: (d) => [d.longitude, d.latitude],
          getRadius: 4,
          radiusUnits: 'pixels',
          radiusMinPixels: 2,
          getFillColor: COLOR_NAMED,
        }),
        new TextLayer<Waypoint>({
          id: 'named-labels',
          data: namedWaypoints,
          visible: labelsVisible,
          getPosition: (d) => [d.longitude, d.latitude],
          getText: (d) => d.name,
          getSize: 11,
          getColor: [180, 210, 255],
          getPixelOffset: [0, -14],
          fontFamily: 'Manrope, sans-serif',
          fontWeight: '600',
          outlineColor: [0, 0, 0],
          outlineWidth: 2,
          fontSettings: { sdf: true },
        }),
      )
    }

    return result
  }, [mode, namedWaypoints, gridWaypoints, labelsVisible])

  return (
    <div className="relative h-full w-full">
      <DeckGL
        views={MAP_VIEW}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        style={{ position: 'absolute', inset: 0 }}
        onViewStateChange={({ viewState }) => {
          const z = (viewState as { zoom: number }).zoom
          const crossed = z >= LABEL_ZOOM_THRESHOLD !== zoomRef.current >= LABEL_ZOOM_THRESHOLD
          zoomRef.current = z
          if (crossed) setLabelsVisible(z >= LABEL_ZOOM_THRESHOLD)
        }}
      >
        <Map mapStyle={MAP_STYLE} />
      </DeckGL>

      <div className="absolute left-3 top-3 z-50 flex overflow-hidden rounded-lg border border-white/20 shadow-lg backdrop-blur-md">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onModeChange(value)}
            className={[
              'px-3 py-1.5 text-xs font-semibold transition-colors',
              mode === value
                ? 'bg-white/20 text-white'
                : 'bg-black/40 text-white/50 hover:bg-white/10 hover:text-white/80',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
