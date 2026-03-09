import { createServerFn } from '@tanstack/react-start'

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

export const fetchFlights = createServerFn({ method: 'GET' })
  .inputValidator((filters: FlightFilters) => filters)
  .handler(async ({ data }) => {
    const params = new URLSearchParams()
    if (data.callsign) params.set('callsign', data.callsign)
    if (data.departure) params.set('departure', data.departure)
    if (data.destination) params.set('destination', data.destination)
    if (data.operator) params.set('operator', data.operator)
    if (data.date_from) params.set('date_from', data.date_from)
    if (data.date_to) params.set('date_to', data.date_to)

    const url = `http://127.0.0.1:8080/flights${params.size ? `?${params}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<Flight[]>
  })
