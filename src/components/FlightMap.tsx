import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import { useMemo } from 'react'
import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { RouteWaypoint } from '../lib/flights'

const MAP_VIEW = new MapView({ repeat: true })
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

// Unwrap longitudes so consecutive points never jump >180°.
// DeckGL with repeat:true renders coordinates outside ±180 correctly.
function normalizePath(coords: number[][]): number[][] {
  if (coords.length === 0) return coords
  const out = [coords[0]]
  for (let i = 1; i < coords.length; i++) {
    let lng = coords[i][0]
    const prev = out[i - 1][0]
    while (lng - prev > 180) lng -= 360
    while (prev - lng > 180) lng += 360
    out.push([lng, coords[i][1]])
  }
  return out
}

const COLOR_PATH: [number, number, number] = [59, 130, 246]
const COLOR_WPT: [number, number, number] = [250, 204, 21]
const COLOR_INACTIVE: [number, number, number, number] = [100, 116, 139, 140]
const COLOR_AIRPORT: [number, number, number] = [52, 211, 153]

type AirportMarker = { name: string; latitude: number; longitude: number }

type Props = {
  route: RouteWaypoint[]
  inactiveRoutes?: RouteWaypoint[][]
  departure?: AirportMarker
  destination?: AirportMarker
}

function getInitialViewState(route: RouteWaypoint[]) {
  const pts = route.filter((w) => w.latitude != null && w.longitude != null)
  if (pts.length === 0) return { longitude: 0, latitude: 20, zoom: 2 }
  const normalized = normalizePath(pts.map((w) => [w.longitude!, w.latitude!]))
  const lngs = normalized.map((c) => c[0])
  const lats = normalized.map((c) => c[1])
  return {
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    zoom: 3,
  }
}

export default function FlightMap({ route, inactiveRoutes, departure, destination }: Props) {
  const positioned = useMemo(
    () => route.filter((w) => w.latitude != null && w.longitude != null),
    [route],
  )

  const inactivePaths = useMemo(
    () =>
      (inactiveRoutes ?? [])
        .map((r) =>
          normalizePath(
            r
              .filter((w) => w.latitude != null && w.longitude != null)
              .map((w) => [w.longitude!, w.latitude!]),
          ),
        )
        .filter((p) => p.length > 0)
        .map((path) => ({ path })),
    [inactiveRoutes],
  )

  const layers = useMemo(() => {
    if (positioned.length === 0) return []
    const path = normalizePath(positioned.map((w) => [w.longitude!, w.latitude!]))
    return [
      inactivePaths.length > 0 &&
        new PathLayer<{ path: number[][] }>({
          id: 'inactive-paths',
          data: inactivePaths,
          getPath: (d) => d.path,
          getColor: COLOR_INACTIVE,
          getWidth: 1.5,
          widthUnits: 'pixels',
          widthMinPixels: 1,
        }),
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
      ...(() => {
        const airports = [departure, destination].filter(Boolean) as AirportMarker[]
        if (airports.length === 0) return []
        return [
          new ScatterplotLayer<AirportMarker>({
            id: 'airports',
            data: airports,
            getPosition: (d) => [d.longitude, d.latitude],
            getRadius: 7,
            radiusUnits: 'pixels',
            radiusMinPixels: 5,
            getFillColor: COLOR_AIRPORT,
            getLineColor: [255, 255, 255],
            stroked: true,
            lineWidthUnits: 'pixels',
            lineWidthMinPixels: 1.5,
          }),
          new TextLayer<AirportMarker>({
            id: 'airport-labels',
            data: airports,
            getPosition: (d) => [d.longitude, d.latitude],
            getText: (d) => d.name,
            getSize: 12,
            getColor: COLOR_AIRPORT,
            getPixelOffset: [0, -18],
            fontFamily: 'Manrope, sans-serif',
            fontWeight: '700',
            outlineColor: [0, 0, 0],
            outlineWidth: 2,
            fontSettings: { sdf: true },
          }),
        ]
      })(),
    ].filter(Boolean)
  }, [positioned, inactivePaths, departure, destination])

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
