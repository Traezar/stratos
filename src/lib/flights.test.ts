import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchFlight, fetchFlights, fetchAlternatives } from './flights'

const mockFlight = {
  id: 'abc-123',
  callsign: 'SIA321',
  flightType: 'S',
  operator: 'SIA',
  aircraftType: 'B77W',
  aircraftRegistration: '9V-SWA',
  departureAerodrome: 'WSSS',
  departureLat: 1.3502,
  departureLon: 103.9943,
  destinationAerodrome: 'EGLL',
  destinationLat: 51.477,
  destinationLon: -0.4614,
  dateOfFlight: '2025-03-01',
  scheduledDepartureAt: '2025-03-01T23:30:00Z',
  scheduledArrivalAt: '2025-03-02T06:00:00Z',
  route: [],
}

const mockAlternatives = [
  {
    rank: 1,
    totalDistanceKm: 10800,
    waypoints: [
      { name: 'WSSS', latitude: 1.35, longitude: 103.99 },
      { name: 'EGLL', latitude: 51.48, longitude: -0.46 },
    ],
  },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchFlight', () => {
  it('returns flight data on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFlight),
      }),
    )

    const result = await fetchFlight('abc-123')
    expect(result).toEqual(mockFlight)
    expect(fetch).toHaveBeenCalledWith('/api/flights/abc-123')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    )

    await expect(fetchFlight('missing')).rejects.toThrow('HTTP 404')
  })
})

describe('fetchFlights', () => {
  it('fetches with no filters', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([mockFlight]),
      }),
    )

    const result = await fetchFlights({})
    expect(result).toEqual([mockFlight])
    expect(fetch).toHaveBeenCalledWith('/api/flights')
  })

  it('appends query params for each filter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    )

    await fetchFlights({
      callsign: 'SIA321',
      departure: 'WSSS',
      destination: 'EGLL',
      operator: 'SIA',
      date_from: '2025-03-01',
      date_to: '2025-03-31',
    })

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    const params = new URL(url, 'http://x').searchParams
    expect(params.get('callsign')).toBe('SIA321')
    expect(params.get('departure')).toBe('WSSS')
    expect(params.get('destination')).toBe('EGLL')
    expect(params.get('operator')).toBe('SIA')
    expect(params.get('date_from')).toBe('2025-03-01')
    expect(params.get('date_to')).toBe('2025-03-31')
  })

  it('omits undefined filters from query string', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    )

    await fetchFlights({ callsign: 'BAW1' })

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    const params = new URL(url, 'http://x').searchParams
    expect(params.get('callsign')).toBe('BAW1')
    expect(params.has('departure')).toBe(false)
    expect(params.has('destination')).toBe(false)
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    )

    await expect(fetchFlights({})).rejects.toThrow('HTTP 500')
  })
})

describe('fetchAlternatives', () => {
  it('returns alternative routes on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAlternatives),
      }),
    )

    const result = await fetchAlternatives('abc-123')
    expect(result).toEqual(mockAlternatives)
    expect(fetch).toHaveBeenCalledWith('/api/flights/abc-123/alternatives?k=3')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    )

    await expect(fetchAlternatives('missing')).rejects.toThrow('HTTP 404')
  })
})
