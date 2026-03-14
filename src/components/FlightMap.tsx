import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import { useMemo } from 'react'
import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { RouteWaypoint } from '../lib/flights'

const MAP_VIEW = new MapView({ repeat: true })
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const COLOR_PATH: [number, number, number] = [59, 130, 246]
const COLOR_WPT: [number, number, number] = [250, 204, 21]

type Props = { route: RouteWaypoint[] }

function getInitialViewState(route: RouteWaypoint[]) {
  const pts = route.filter((w) => w.latitude != null && w.longitude != null)
  if (pts.length === 0) return { longitude: 0, latitude: 20, zoom: 2 }
  const lngs = pts.map((w) => w.longitude!)
  const lats = pts.map((w) => w.latitude!)
  return {
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    zoom: 3,
  }
}

export default function FlightMap({ route }: Props) {
  const positioned = useMemo(
    () => route.filter((w) => w.latitude != null && w.longitude != null),
    [route],
  )

  const layers = useMemo(() => {
    if (positioned.length === 0) return []
    const path = positioned.map((w) => [w.longitude!, w.latitude!])
    return [
      new PathLayer<{ path: number[][] }>({
        id: 'route-path',
        data: [{ path }],
        getPath: (d) => d.path,
        getColor: COLOR_PATH,
        getWidth: 2,
        widthUnits: 'pixels',
        widthMinPixels: 1,
      }),
      new ScatterplotLayer<RouteWaypoint>({
        id: 'route-waypoints',
        data: positioned,
        getPosition: (d) => [d.longitude!, d.latitude!],
        getRadius: 4,
        radiusUnits: 'pixels',
        radiusMinPixels: 3,
        getFillColor: COLOR_WPT,
      }),
      new TextLayer<RouteWaypoint>({
        id: 'route-labels',
        data: positioned,
        getPosition: (d) => [d.longitude!, d.latitude!],
        getText: (d) => d.waypointName,
        getSize: 11,
        getColor: [255, 240, 150],
        getPixelOffset: [0, -14],
        fontFamily: 'Manrope, sans-serif',
        fontWeight: '600',
        outlineColor: [0, 0, 0],
        outlineWidth: 2,
        fontSettings: { sdf: true },
      }),
    ]
  }, [positioned])

  return (
    <DeckGL
      views={MAP_VIEW}
      initialViewState={getInitialViewState(route)}
      controller={true}
      layers={layers}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Map mapStyle={MAP_STYLE} />
    </DeckGL>
  )
}
