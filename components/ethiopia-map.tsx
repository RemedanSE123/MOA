"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ZoomIn, ZoomOut, RotateCcw, MapPin } from "lucide-react"

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}

interface MapFeature {
  gid: number
  name: string
  code: string
  geometry: any
  level: "region" | "zone" | "woreda"
  parent_code?: string
}

interface WeatherData {
  id: number
  adm1_en: string
  adm1_pcode: string
  adm2_pcode?: string // Added adm2_pcode field for zone data
  year: number
  avg_annual_precipitation_mm_day: number
  avg_annual_max_temperature_c: number
  avg_annual_min_temperature_c: number
}

interface Station {
  gid: number
  adm1_en: string
  adm1_pcode: string
  longitude: number
  latitude: number
  shape_leng?: number
  shape_area?: number
}

interface EthiopiaMapProps {
  selectedRegion?: string
  selectedZone?: string
  selectedWoreda?: string
  onRegionSelect?: (regionCode: string) => void
  onZoneSelect?: (zoneCode: string) => void
  onWoredaSelect?: (woredaCode: string) => void
  activeLayer?: string
  activeMapLevel?: "region" | "zone" | "woreda"
  baseLayer?: string
  overlayLayers?: Record<string, boolean>
  layerOpacity?: Record<string, number>
  weatherData?: WeatherData[]
  weatherParameter?: "max_temp" | "min_temp" | "precipitation"
  stations?: Station[]
  showStations?: boolean
  baseColor: string
  colorRanges: number
}

export function EthiopiaMap({
  selectedRegion,
  selectedZone,
  selectedWoreda,
  onRegionSelect,
  onZoneSelect,
  onWoredaSelect,
  activeLayer = "map",
  activeMapLevel = "region",
  baseLayer = "osm",
  overlayLayers = { boundaries: true, pins: true },
  layerOpacity = { boundaries: 0.8, pins: 1.0 },
  weatherData = [],
  weatherParameter = "max_temp",
  stations = [],
  showStations = false,
  baseColor,
  colorRanges,
}: EthiopiaMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [features, setFeatures] = useState<MapFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)
  const [hoveredStation, setHoveredStation] = useState<number | null>(null)

  // Ethiopia bounding box (approximate)
  const bounds = {
    minLng: 32.5,
    maxLng: 48.0,
    minLat: 3.0,
    maxLat: 15.0,
  }

  const mapWidth = 800
  const mapHeight = 600

  // Convert lat/lng to SVG coordinates
  const projectPoint = useCallback((lng: number, lat: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * mapWidth
    const y = mapHeight - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * mapHeight
    return { x, y }
  }, [])

  // Convert GeoJSON coordinates to SVG path
  const geometryToPath = useCallback(
    (geometry: any) => {
      if (!geometry || !geometry.coordinates) return ""

      const processCoordinates = (coords: number[][]) => {
        return coords
          .map((coord) => {
            const point = projectPoint(coord[0], coord[1])
            return `${point.x},${point.y}`
          })
          .join(" ")
      }

      try {
        if (geometry.type === "Polygon") {
          const exteriorRing = geometry.coordinates[0]
          const pathData = processCoordinates(exteriorRing)
          return `M ${pathData} Z`
        } else if (geometry.type === "MultiPolygon") {
          return geometry.coordinates
            .map((polygon: number[][][]) => {
              const exteriorRing = polygon[0]
              const pathData = processCoordinates(exteriorRing)
              return `M ${pathData} Z`
            })
            .join(" ")
        }
      } catch (err) {
        console.error("Error processing geometry:", err)
      }

      return ""
    },
    [projectPoint],
  )

  // Fetch map data based on active map level
  const fetchMapData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const url =
        activeMapLevel === "region" ? "/api/regions" : activeMapLevel === "zone" ? "/api/zones" : "/api/woreda"

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        const mappedFeatures: MapFeature[] = data.data.map((item: any) => ({
          gid: item.gid,
          name: item.name,
          code: item.code,
          geometry: item.geometry,
          level: activeMapLevel,
          parent_code: item.region_code || item.zone_code,
        }))

        setFeatures(mappedFeatures)
      } else {
        throw new Error("Invalid data format received")
      }
    } catch (err) {
      console.error("Error fetching map data:", err)
      setError(err instanceof Error ? err.message : "Failed to load map data")
      setFeatures([])
    } finally {
      setLoading(false)
    }
  }, [activeMapLevel])

  useEffect(() => {
    fetchMapData()
  }, [fetchMapData])

  // Handle zoom
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.5, Math.min(5, prev + delta)))
  }

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Reset view
  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const parameterKey = useMemo(() => {
    switch (weatherParameter) {
      case "max_temp":
        return "avg_annual_max_temperature_c"
      case "min_temp":
        return "avg_annual_min_temperature_c"
      case "precipitation":
        return "avg_annual_precipitation_mm_day"
      default:
        return null
    }
  }, [weatherParameter])

  const parseNumericValue = useCallback((value: any): number | null => {
    if (typeof value === "number") return value
    if (typeof value === "string") {
      // Remove units like "°C", "mm", etc. and parse the number
      const numericMatch = value.match(/^([\d.-]+)/)
      if (numericMatch) {
        const parsed = Number.parseFloat(numericMatch[1])
        return isNaN(parsed) ? null : parsed
      }
    }
    return null
  }, [])

  const minMax = useMemo(() => {
    if (!parameterKey || weatherData.length === 0) return { min: 0, max: 0 }
    const values = weatherData
      .map((d) => parseNumericValue(d[parameterKey as keyof WeatherData]))
      .filter((v) => v != null) as number[]
    if (values.length === 0) return { min: 0, max: 0 }
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [weatherData, parameterKey, parseNumericValue])

  // Get feature color based on weather data
  const getFeatureColor = useCallback(
    (feature: MapFeature) => {
      console.log("[v0] Getting color for feature:", feature.name, "code:", feature.code)
      console.log("[v0] activeLayer:", activeLayer, "parameterKey:", parameterKey)

      if (activeLayer !== "weather" || !parameterKey) {
        console.log("[v0] Returning default color - activeLayer or parameterKey missing")
        return "#e5e7eb"
      }

      let weatherInfo: WeatherData | undefined

      if (activeMapLevel === "region") {
        // For regions, match adm1_pcode with feature.code
        weatherInfo = weatherData.find((data) => data.adm1_pcode === feature.code)
        console.log("[v0] Looking for region weather data with code:", feature.code)
      } else if (activeMapLevel === "zone") {
        // For zones, match adm2_pcode with feature.code
        weatherInfo = weatherData.find((data) => data.adm2_pcode === feature.code)
        console.log("[v0] Looking for zone weather data with code:", feature.code)
      }

      console.log("[v0] Found weather info:", weatherInfo)

      if (!weatherInfo) {
        console.log("[v0] No weather info found, returning default color")
        return "#e5e7eb"
      }

      const rawValue = weatherInfo[parameterKey as keyof WeatherData]
      const value = parseNumericValue(rawValue)
      console.log("[v0] Raw weather value:", rawValue, "Parsed value:", value, "for parameter:", parameterKey)

      if (value == null) {
        console.log("[v0] Invalid value after parsing, returning default color")
        return "#e5e7eb"
      }

      const { min, max } = minMax
      console.log("[v0] Min/Max values:", min, max)

      if (min === max) {
        console.log("[v0] Min equals max, returning base color")
        return baseColor
      }

      const factor = (value - min) / (max - min)
      console.log("[v0] Color factor:", factor)

      const baseRgb = hexToRgb(baseColor)
      if (!baseRgb) {
        console.log("[v0] Invalid base color, returning default")
        return "#e5e7eb"
      }

      const colors: string[] = []
      for (let i = 0; i < colorRanges; i++) {
        const intensity = i / (colorRanges - 1)
        const r = Math.round(255 - (255 - baseRgb.r) * intensity)
        const g = Math.round(255 - (255 - baseRgb.g) * intensity)
        const b = Math.round(255 - (255 - baseRgb.b) * intensity)
        colors.push(`rgb(${r},${g},${b})`)
      }

      const colorIndex = Math.floor(factor * (colorRanges - 1))
      const finalColor = colors[colorIndex]
      console.log("[v0] Final color:", finalColor, "for feature:", feature.name)

      return finalColor
    },
    [activeLayer, weatherData, parameterKey, minMax, baseColor, colorRanges, activeMapLevel, parseNumericValue],
  )

  const getFeatureStroke = (feature: MapFeature) => {
    const isSelected =
      (feature.level === "region" && feature.code === selectedRegion) ||
      (feature.level === "zone" && feature.code === selectedZone) ||
      (feature.level === "woreda" && feature.code === selectedWoreda)

    return isSelected ? "#ffffff" : "#9ca3af"
  }

  if (loading) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map data...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading map: {error}</p>
          <Button onClick={fetchMapData} variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  const title =
    weatherParameter === "max_temp"
      ? "Max Temperature °C"
      : weatherParameter === "min_temp"
        ? "Min Temperature °C"
        : "Precipitation mm"
  const { min, max } = minMax
  const step = (max - min) / colorRanges
  const legendColors: string[] = []
  const baseRgb = hexToRgb(baseColor)
  if (baseRgb) {
    for (let i = 0; i < colorRanges; i++) {
      const intensity = i / (colorRanges - 1)
      const r = Math.round(255 - (255 - baseRgb.r) * intensity)
      const g = Math.round(255 - (255 - baseRgb.g) * intensity)
      const b = Math.round(255 - (255 - baseRgb.b) * intensity)
      legendColors.push(`rgb(${r},${g},${b})`)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <Button
          onClick={() => handleZoom(0.2)}
          size="sm"
          variant="outline"
          className="bg-white shadow-md hover:bg-gray-50"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => handleZoom(-0.2)}
          size="sm"
          variant="outline"
          className="bg-white shadow-md hover:bg-gray-50"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button onClick={resetView} size="sm" variant="outline" className="bg-white shadow-md hover:bg-gray-50">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {activeLayer === "weather" && legendColors.length > 0 && minMax.min !== minMax.max && (
        <div className="absolute bottom-4 right-4 z-10 bg-white rounded shadow p-2 text-sm">
          <div className="font-medium mb-1">{title}</div>
          {legendColors.map((color, i) => {
            const low = min + i * step
            const high = i === colorRanges - 1 ? max : min + (i + 1) * step
            return (
              <div key={i} className="flex items-center space-x-2">
                <div style={{ width: "20px", height: "20px", backgroundColor: color }} />
                <span>
                  {low.toFixed(1)} - {high.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {showStations && stations.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h4 className="font-semibold text-sm mb-3 flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span>Weather Stations</span>
          </h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-xs">Active Station</span>
            </div>
            <div className="text-xs text-muted-foreground">Total: {stations.length} stations</div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-blue-50 to-green-50"
        style={{ height: "500px", cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {/* Administrative Boundaries */}
          {overlayLayers.boundaries &&
            features.map((feature) => {
              const pathData = geometryToPath(feature.geometry)
              if (!pathData) return null

              const weatherInfo = weatherData.find((data) =>
                activeMapLevel === "region" ? data.adm1_pcode === feature.code : data.adm2_pcode === feature.code,
              ) // Fixed weather info lookup for tooltips

              return (
                <g key={feature.gid}>
                  <path
                    d={pathData}
                    fill={getFeatureColor(feature)}
                    stroke={getFeatureStroke(feature)}
                    strokeWidth="1"
                    fillOpacity={layerOpacity.boundaries || 0.8}
                    className="transition-all duration-200 cursor-pointer hover:opacity-80"
                    onMouseEnter={() => setHoveredFeature(feature.code)}
                    onMouseLeave={() => setHoveredFeature(null)}
                  />
                  {/* Weather Data Tooltip */}
                  {hoveredFeature === feature.code && weatherInfo && activeLayer === "weather" && (
                    <foreignObject x="10" y="10" width="200" height="100">
                      <div className="bg-white p-2 rounded shadow-lg text-xs border">
                        <div className="font-semibold">{weatherInfo.adm1_en}</div>
                        <div>Max Temp: {weatherInfo.avg_annual_max_temperature_c}°C</div>
                        <div>Min Temp: {weatherInfo.avg_annual_min_temperature_c}°C</div>
                        <div>Precipitation: {weatherInfo.avg_annual_precipitation_mm_day}mm</div>
                      </div>
                    </foreignObject>
                  )}
                </g>
              )
            })}

          {showStations &&
            stations.map((station) => {
              const point = projectPoint(station.longitude, station.latitude)
              const isHovered = hoveredStation === station.gid

              return (
                <g key={station.gid}>
                  {/* Station marker */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHovered ? 8 : 6}
                    fill="#16a34a"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer transition-all duration-200 hover:fill-green-700"
                    onMouseEnter={() => setHoveredStation(station.gid)}
                    onMouseLeave={() => setHoveredStation(null)}
                  />

                  {/* Station icon */}
                  <g transform={`translate(${point.x - 3}, ${point.y - 3})`} className="pointer-events-none">
                    <MapPin
                      className="h-2 w-2 text-white"
                      style={{
                        transform: "scale(0.8)",
                        transformOrigin: "center",
                      }}
                    />
                  </g>

                  {/* Station tooltip */}
                  {isHovered && (
                    <foreignObject x={point.x + 15} y={point.y - 40} width="180" height="80">
                      <div className="bg-white p-3 rounded-lg shadow-lg text-xs border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-3 w-3 text-green-600" />
                          <span className="font-semibold text-gray-800">Weather Station</span>
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">Region:</span> {station.adm1_en}
                          </div>
                          <div>
                            <span className="font-medium">Code:</span> {station.adm1_pcode}
                          </div>
                          <div>
                            <span className="font-medium">Coordinates:</span>
                          </div>
                          <div className="text-xs text-gray-600 ml-2">
                            Lat: {station.latitude.toFixed(4)}°<br />
                            Lng: {station.longitude.toFixed(4)}°
                          </div>
                        </div>
                      </div>
                    </foreignObject>
                  )}
                </g>
              )
            })}
        </svg>
      </div>
    </div>
  )
}
