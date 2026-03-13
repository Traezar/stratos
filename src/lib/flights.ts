export type RouteWaypoint = {
  seqNum: number
  waypointName: string
  airway?: string
  latitude?: number
  longitude?: number
}

export type Flight = {
  id: string
  callsign: string
  flightType: string
  operator?: string
  aircraftType?: string
  aircraftRegistration?: string
  departureAerodrome: string
  destinationAerodrome: string
  dateOfFlight: string
  scheduledDepartureAt?: string
  scheduledArrivalAt?: string
  route: RouteWaypoint[]
}

export type FlightFilters = {
  callsign?: string
  departure?: string
  destination?: string
  operator?: string
  date_from?: string
  date_to?: string
}

export async function fetchFlights(filters: FlightFilters): Promise<Flight[]> {
  const params = new URLSearchParams()
  if (filters.callsign) params.set('callsign', filters.callsign)
  if (filters.departure) params.set('departure', filters.departure)
  if (filters.destination) params.set('destination', filters.destination)
  if (filters.operator) params.set('operator', filters.operator)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)

  const url = `/api/flights${params.size ? `?${params}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
