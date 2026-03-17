import { describe, it, expect } from 'vitest'
import { normalizePath } from './FlightMap'

describe('normalizePath', () => {
  it('returns empty array unchanged', () => {
    expect(normalizePath([])).toEqual([])
  })

  it('returns single point unchanged', () => {
    expect(normalizePath([[103.99, 1.35]])).toEqual([[103.99, 1.35]])
  })

  it('leaves a normal path unchanged', () => {
    const path = [
      [103.99, 1.35],
      [80.0, 12.97],
      [51.57, 25.27],
      [-0.46, 51.48],
    ]
    expect(normalizePath(path)).toEqual(path)
  })

  it('unwraps eastbound antimeridian crossing', () => {
    // Going from 170°E to 190° (i.e. -170°E) should stay > 170, not jump to -170
    const input = [
      [170, 40],
      [-170, 50],
    ]
    const result = normalizePath(input)
    expect(result[0][0]).toBe(170)
    expect(result[1][0]).toBe(190) // -170 + 360
  })

  it('unwraps westbound antimeridian crossing', () => {
    // Going from -170°E to 170°E should become -190, not jump to +170
    const input = [
      [-170, 40],
      [170, 50],
    ]
    const result = normalizePath(input)
    expect(result[0][0]).toBe(-170)
    expect(result[1][0]).toBe(-190) // 170 - 360
  })

  it('handles multiple antimeridian crossings', () => {
    const input = [
      [170, 40],
      [-170, 50], // crosses once → becomes 190
      [-160, 55], // continues eastbound → becomes 200
    ]
    const result = normalizePath(input)
    expect(result[0][0]).toBe(170)
    expect(result[1][0]).toBe(190)
    expect(result[2][0]).toBe(200)
  })

  it('preserves latitude values unchanged', () => {
    const input = [
      [170, 35.5],
      [-170, 51.2],
    ]
    const result = normalizePath(input)
    expect(result[0][1]).toBe(35.5)
    expect(result[1][1]).toBe(51.2)
  })
})
