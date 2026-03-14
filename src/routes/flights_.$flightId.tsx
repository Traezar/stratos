import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Badge } from '../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { fetchFlight, type Flight } from '../lib/flights'

const FlightMap = lazy(() => import('../components/FlightMap'))

export const Route = createFileRoute('/flights_/$flightId')({
  component: FlightDetailPage,
})

function meta(label: string, value?: string) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-sm">{value ?? '—'}</span>
    </div>
  )
}

function formatDateTime(iso?: string) {
  if (!iso) return undefined
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDate(iso?: string) {
  if (!iso) return undefined
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function FlightDetailPage() {
  const { flightId } = Route.useParams()
  const router = useRouter()
  const stateFlight = (router.history.location.state as { flight?: Flight } | undefined)?.flight

  const [flight, setFlight] = useState<Flight | null>(stateFlight ?? null)
  const [loading, setLoading] = useState(!stateFlight)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (stateFlight) return
    fetchFlight(flightId)
      .then(setFlight)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [flightId, stateFlight])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (error || !flight) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <p>Flight not found.</p>
        <Link to="/flights" className="text-sm underline hover:text-foreground">
          ← Back to flights
        </Link>
      </div>
    )
  }

  const hasRoute = flight.route.length > 0

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left panel: metadata + route table ── */}
      <div className="flex w-[420px] shrink-0 flex-col overflow-y-auto border-r border-border">
        {/* Header */}
        <div className="border-b border-border px-4 py-3">
          <Link
            to="/flights"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Flights
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="font-mono text-xl font-bold">{flight.callsign}</h1>
            <Badge variant="outline">{flight.flightType}</Badge>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-border px-4 py-4">
          {meta('Operator', flight.operator)}
          {meta('Aircraft', flight.aircraftType)}
          {meta('Registration', flight.aircraftRegistration)}
          {meta('Date', formatDate(flight.dateOfFlight))}
          {meta('Departure', flight.departureAerodrome)}
          {meta('Destination', flight.destinationAerodrome)}
          {meta('STD', formatDateTime(flight.scheduledDepartureAt))}
          {meta('STA', formatDateTime(flight.scheduledArrivalAt))}
        </div>

        {/* Route table */}
        <div className="flex-1">
          {hasRoute ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Waypoint</TableHead>
                  <TableHead>Airway</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flight.route.map((w) => (
                  <TableRow key={w.seqNum}>
                    <TableCell className="text-xs text-muted-foreground">
                      {w.seqNum}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">
                      {w.waypointName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {w.airway ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No route data.
            </p>
          )}
        </div>
      </div>

      {/* ── Right panel: route map ── */}
      <div className="relative flex-1">
        {hasRoute ? (
          <Suspense>
            <FlightMap route={flight.route} />
          </Suspense>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No route to display.
          </div>
        )}
      </div>
    </div>
  )
}
