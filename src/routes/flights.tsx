import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { fetchFlights, type Flight, type FlightFilters } from '../lib/flights'

const PAGE_SIZE = 25

type SearchParams = FlightFilters & { page?: number }

export const Route = createFileRoute('/flights')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    callsign: (search.callsign as string) || undefined,
    departure: (search.departure as string) || undefined,
    destination: (search.destination as string) || undefined,
    operator: (search.operator as string) || undefined,
    date_from: (search.date_from as string) || undefined,
    date_to: (search.date_to as string) || undefined,
    page: search.page ? Number(search.page) : undefined,
  }),
  component: FlightsPage,
})

function formatDateTime(iso?: string) {
  if (!iso) return '—'
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
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function FlightsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/flights' })

  const page = search.page ?? 1
  const filters: FlightFilters = {
    callsign: search.callsign,
    departure: search.departure,
    destination: search.destination,
    operator: search.operator,
    date_from: search.date_from,
    date_to: search.date_to,
  }

  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(false)

  // Local form state (committed to URL on submit)
  const [draft, setDraft] = useState<FlightFilters>(filters)

  useEffect(() => {
    setLoading(true)
    fetchFlights(filters)
      .then(setFlights)
      .catch(() => setFlights([]))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search.callsign,
    search.departure,
    search.destination,
    search.operator,
    search.date_from,
    search.date_to,
  ])

  const totalPages = Math.max(1, Math.ceil(flights.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = flights.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function applyFilters() {
    navigate({ search: { ...draft, page: 1 } })
  }

  function clearFilters() {
    const empty: FlightFilters = {}
    setDraft(empty)
    navigate({ search: {} })
  }

  function goToPage(p: number) {
    navigate({ search: { ...filters, page: p } })
  }

  const field = (
    id: keyof FlightFilters,
    label: string,
    placeholder: string,
    uppercase = false,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder={placeholder}
        value={draft[id] ?? ''}
        onChange={(e) =>
          setDraft((d) => ({
            ...d,
            [id]: uppercase ? e.target.value.toUpperCase() : e.target.value || undefined,
          }))
        }
        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
        className="h-8 w-36 text-sm"
      />
    </div>
  )

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        {field('callsign', 'Callsign', 'SIA325')}
        {field('departure', 'Departure', 'WSSS', true)}
        {field('destination', 'Destination', 'EGLL', true)}
        {field('operator', 'Operator', 'SIA')}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date_from">Date from</Label>
          <Input
            id="date_from"
            type="date"
            value={draft.date_from ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, date_from: e.target.value || undefined }))}
            className="h-8 w-36 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date_to">Date to</Label>
          <Input
            id="date_to"
            type="date"
            value={draft.date_to ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, date_to: e.target.value || undefined }))}
            className="h-8 w-36 text-sm"
          />
        </div>
        <div className="flex gap-2 self-end">
          <Button size="sm" onClick={applyFilters}>
            Search
          </Button>
          <Button size="sm" variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        </div>
        {!loading && (
          <p className="self-end text-xs text-muted-foreground">
            {flights.length} result{flights.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead>Callsign</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Aircraft</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>STD</TableHead>
              <TableHead>STA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                  No flights found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((f) => (
                <TableRow key={f.id} className="hover:bg-muted/40 cursor-pointer">
                  <TableCell className="font-mono font-medium">
                    <Badge variant="outline">{f.callsign}</Badge>
                  </TableCell>
                  <TableCell>{f.operator ?? '—'}</TableCell>
                  <TableCell>{f.aircraftType ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{f.aircraftRegistration ?? '—'}</TableCell>
                  <TableCell className="font-mono">{f.departureAerodrome}</TableCell>
                  <TableCell className="font-mono">{f.destinationAerodrome}</TableCell>
                  <TableCell className="text-xs">{formatDate(f.dateOfFlight)}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(f.scheduledDepartureAt)}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(f.scheduledArrivalAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-border bg-background px-4 py-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <PaginationItem key={`ellipsis-${i}`}>
                      <span className="px-2 text-muted-foreground">…</span>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        onClick={() => goToPage(p as number)}
                        isActive={currentPage === p}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
