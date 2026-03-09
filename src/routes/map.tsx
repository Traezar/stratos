import { createFileRoute, redirect } from '@tanstack/react-router'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { FLAGS } from '../lib/flags'
import type { Waypoint } from '../lib/waypoints'

const WorldMap = lazy(() => import('../components/WorldMap'))

export type MapMode = 'named' | 'grid' | 'both'

export const Route = createFileRoute('/map')({
  beforeLoad: () => { if (!FLAGS.worldMap) throw redirect({ to: '/flights' }) },
  component: MapPage,
})

async function apiFetch(path: string): Promise<Waypoint[]> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function MapPage() {
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<MapMode>('named')
  const [namedWaypoints, setNamedWaypoints] = useState<Waypoint[]>([])
  const [gridWaypoints, setGridWaypoints] = useState<Waypoint[]>([])

  const fetched = useRef({ named: false, grid: false })

  function loadNamed() {
    if (fetched.current.named) return
    fetched.current.named = true
    apiFetch('/api/waypoints?grid=false')
      .then(setNamedWaypoints)
      .catch(() => { fetched.current.named = false })
  }

  function loadGrid() {
    if (fetched.current.grid) return
    fetched.current.grid = true
    apiFetch('/api/waypoints?grid=true')
      .then(setGridWaypoints)
      .catch(() => { fetched.current.grid = false })
  }

  useEffect(() => {
    setMounted(true)
    loadNamed()
  }, [])

  function handleMode(next: MapMode) {
    setMode(next)
    if (next === 'grid' || next === 'both') loadGrid()
    if (next === 'named' || next === 'both') loadNamed()
  }

  return (
    <div className="relative h-full w-full">
      {mounted && (
        <Suspense>
          <WorldMap
            mode={mode}
            onModeChange={handleMode}
            namedWaypoints={namedWaypoints}
            gridWaypoints={gridWaypoints}
          />
        </Suspense>
      )}
    </div>
  )
}
