"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ZoomIn, ZoomOut, RotateCcw, CloudRain, Sprout, BarChart3, Bug, MapPin, Wheat } from "lucide-react"

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
  adm2_pcode?: string
  adm3_pcode?: string
  year: number
  avg_annual_precipitation_mm_day: number
  avg_annual_max_temperature_c: number
  avg_annual_min_temperature_c: number
}

interface Station {
  gid: number
  id?: number
  adm1_en: string
  adm1_pcode: string
  longitude: number
  latitude: number
  shape_leng?: number
  shape_area?: number
  geometry?: {
    type: string
    coordinates: [number, number]
  }
}

interface AgricultureLand {
  id: number
  name: string
  region: string
  major_crops: string
  land_size: string
  soil_type: string
  suitability: string
  challenges: string
  image: string
  geometry: {
    type: string
    coordinates: [number, number]
  }
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
  showPrecipitationIcons?: boolean
  agricultureLands?: AgricultureLand[]
  showAgricultureLands?: boolean
  onLandSelect?: (land: AgricultureLand) => void
  landData?: any[]
  landLayerEnabled?: boolean
  cropProductionData?: any[]
  cropProductionLayerEnabled?: boolean
  pestData?: any[]
  pestDataLayerEnabled?: boolean
  landParameter?: string
  cropParameter?: string
  pestParameter?: string
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
  showPrecipitationIcons = false,
  agricultureLands = [],
  showAgricultureLands = false,
  onLandSelect,
  landData = [],
  landLayerEnabled = false,
  cropProductionData = [],
  cropProductionLayerEnabled = false,
  pestData = [],
  pestDataLayerEnabled = false,
  landParameter = "total_agri_land",
  cropParameter = "teff_production_mt",
  pestParameter = "pest_incidence",
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
  const [hoveredLand, setHoveredLand] = useState<number | null>(null)
  const [featuresRenderOrder, setFeaturesRenderOrder] = useState<string[]>([])

  const handleFeatureInteraction = useCallback((feature: MapFeature, isEntering: boolean) => {
    if (isEntering) {
      setHoveredFeature(feature.code)
      setHoveredStation(null)
      setHoveredLand(null)
      setFeaturesRenderOrder(prev => [
        feature.code,
        ...prev.filter(code => code !== feature.code)
      ])
    } else {
      setHoveredFeature(null)
    }
  }, [])

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
      const numericMatch = value.match(/^([\d.-]+)/)
      if (numericMatch) {
        const parsed = Number.parseFloat(numericMatch[1])
        return isNaN(parsed) ? null : parsed
      }
    }
    return null
  }, [])

  const getActiveDataLayer = useCallback(() => {
    if (landLayerEnabled && landData.length > 0) {
      return { data: landData, parameter: landParameter, type: "land" }
    }
    if (cropProductionLayerEnabled && cropProductionData.length > 0) {
      return { data: cropProductionData, parameter: cropParameter, type: "crop" }
    }
    if (pestDataLayerEnabled && pestData.length > 0) {
      return { data: pestData, parameter: pestParameter, type: "pest" }
    }
    return null
  }, [
    landLayerEnabled,
    landData,
    landParameter,
    cropProductionLayerEnabled,
    cropProductionData,
    cropParameter,
    pestDataLayerEnabled,
    pestData,
    pestParameter,
  ])

  const activeDataLayer = getActiveDataLayer()

  const minMax = useMemo(() => {
    if (activeLayer === "weather" && parameterKey && weatherData.length > 0) {
      const values = weatherData
        .map((d) => parseNumericValue(d[parameterKey as keyof WeatherData]))
        .filter((v) => v != null) as number[]
      if (values.length === 0) return { min: 0, max: 0 }
      return { min: Math.min(...values), max: Math.max(...values) }
    }

    if (activeDataLayer && activeDataLayer.data.length > 0) {
      const values = activeDataLayer.data
        .map((d) => parseNumericValue(d[activeDataLayer.parameter]))
        .filter((v) => v != null) as number[]
      if (values.length === 0) return { min: 0, max: 0 }
      return { min: Math.min(...values), max: Math.max(...values) }
    }

    return { min: 0, max: 0 }
  }, [weatherData, parameterKey, parseNumericValue, activeLayer, activeDataLayer])

  const getFeatureColor = useCallback(
    (feature: MapFeature) => {
      if (activeDataLayer) {
        let dataInfo: any = null
        if (activeMapLevel === "region") {
          dataInfo = activeDataLayer.data.find((data) => data.adm1_pcode === feature.code)
        } else if (activeMapLevel === "zone") {
          dataInfo = activeDataLayer.data.find((data) => data.adm2_pcode === feature.code)
        } else if (activeMapLevel === "woreda") {
          dataInfo = activeDataLayer.data.find((data) => data.adm3_pcode === feature.code)
        }

        if (!dataInfo) return "#e5e7eb"

        const rawValue = dataInfo[activeDataLayer.parameter]
        const value = parseNumericValue(rawValue)
        if (value == null) return "#e5e7eb"

        const { min, max } = minMax
        if (min === max) return baseColor

        const factor = Math.max(0, Math.min(1, (value - min) / (max - min)))
        const baseRgb = hexToRgb(baseColor)
        if (!baseRgb) return "#e5e7eb"

        const colorIndex = Math.min(Math.floor(factor * colorRanges), colorRanges - 1)
        const intensity = colorIndex / Math.max(1, colorRanges - 1)
        const r = Math.round(255 - (255 - baseRgb.r) * intensity)
        const g = Math.round(255 - (255 - baseRgb.g) * intensity)
        const b = Math.round(255 - (255 - baseRgb.b) * intensity)
        return `rgb(${r},${g},${b})`
      }

      if (activeLayer !== "weather" || !parameterKey) return "#e5e7eb"
      if (weatherParameter === "precipitation" && showPrecipitationIcons) return "#f3f4f6"

      let weatherInfo: WeatherData | undefined
      if (activeMapLevel === "region") {
        weatherInfo = weatherData.find((data) => data.adm1_pcode === feature.code)
      } else if (activeMapLevel === "zone") {
        weatherInfo = weatherData.find((data) => data.adm2_pcode === feature.code)
      } else if (activeMapLevel === "woreda") {
        weatherInfo = weatherData.find((data) => data.adm3_pcode === feature.code)
      }

      if (!weatherInfo) return "#e5e7eb"

      const rawValue = weatherInfo[parameterKey as keyof WeatherData]
      const value = parseNumericValue(rawValue)
      if (value == null) return "#e5e7eb"

      const { min, max } = minMax
      if (min === max) return baseColor

      const factor = Math.max(0, Math.min(1, (value - min) / (max - min)))
      const baseRgb = hexToRgb(baseColor)
      if (!baseRgb) return "#e5e7eb"

      const colorIndex = Math.min(Math.floor(factor * colorRanges), colorRanges - 1)
      const intensity = colorIndex / Math.max(1, colorRanges - 1)
      const r = Math.round(255 - (255 - baseRgb.r) * intensity)
      const g = Math.round(255 - (255 - baseRgb.g) * intensity)
      const b = Math.round(255 - (255 - baseRgb.b) * intensity)
      return `rgb(${r},${g},${b})`
    },
    [
      activeLayer,
      weatherData,
      parameterKey,
      minMax,
      baseColor,
      colorRanges,
      activeMapLevel,
      parseNumericValue,
      weatherParameter,
      showPrecipitationIcons,
      activeDataLayer,
    ],
  )

  const getPrecipitationIconSize = useCallback(
    (feature: MapFeature) => {
      if (weatherParameter !== "precipitation" || !showPrecipitationIcons) return 0

      let weatherInfo: WeatherData | undefined
      if (activeMapLevel === "region") {
        weatherInfo = weatherData.find((data) => data.adm1_pcode === feature.code)
      } else if (activeMapLevel === "zone") {
        weatherInfo = weatherData.find((data) => data.adm2_pcode === feature.code)
      } else if (activeMapLevel === "woreda") {
        weatherInfo = weatherData.find((data) => data.adm3_pcode === feature.code)
      }

      if (!weatherInfo) return 0

      const value = parseNumericValue(weatherInfo.avg_annual_precipitation_mm_day)
      if (value == null) return 0

      const { min, max } = minMax
      if (min === max) return 12

      const factor = (value - min) / (max - min)
      return 8 + factor * 16
    },
    [weatherData, weatherParameter, showPrecipitationIcons, activeMapLevel, parseNumericValue, minMax],
  )

  const sortedFeatures = useMemo(() => {
    return [...features].sort((a, b) => {
      const aIndex = featuresRenderOrder.indexOf(a.code)
      const bIndex = featuresRenderOrder.indexOf(b.code)
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return -1
      if (bIndex === -1) return 1
      return aIndex - bIndex
    })
  }, [features, featuresRenderOrder])

  const handleFeatureClick = useCallback(
    (feature: MapFeature) => {
      if (feature.level === "region" && onRegionSelect) {
        onRegionSelect(feature.code)
      } else if (feature.level === "zone" && onZoneSelect) {
        onZoneSelect(feature.code)
      } else if (feature.level === "woreda" && onWoredaSelect) {
        onWoredaSelect(feature.code)
      }
    },
    [onRegionSelect, onZoneSelect, onWoredaSelect],
  )

  const getFeatureStroke = useCallback(
    (feature: MapFeature) => {
      const isSelected =
        (feature.level === "region" && feature.code === selectedRegion) ||
        (feature.level === "zone" && feature.code === selectedZone) ||
        (feature.level === "woreda" && feature.code === selectedWoreda)

      const isHovered = hoveredFeature === feature.code

      if (isSelected) return "#ffffff"
      if (isHovered) return "#3b82f6"
      return "#9ca3af"
    },
    [selectedRegion, selectedZone, selectedWoreda, hoveredFeature],
  )

  const getFeatureStrokeWidth = useCallback(
    (feature: MapFeature) => {
      const isSelected =
        (feature.level === "region" && feature.code === selectedRegion) ||
        (feature.level === "zone" && feature.code === selectedZone) ||
        (feature.level === "woreda" && feature.code === selectedWoreda)

      const isHovered = hoveredFeature === feature.code

      if (isSelected) return "3"
      if (isHovered) return "2"
      return "1"
    },
    [selectedRegion, selectedZone, selectedWoreda, hoveredFeature],
  )

  const getAllParametersForFeature = useCallback(
    (feature: any, activeLayer: any) => {
      if (!activeLayer || !activeLayer.data) return null
      const featureData = activeLayer.data.find((item: any) => {
        if (activeMapLevel === "region") return item.adm1_en === feature.name
        if (activeMapLevel === "zone") return item.adm2_en === feature.name
        if (activeMapLevel === "woreda") return item.adm3_en === feature.name
        return false
      })

      if (!featureData) return null

      if (activeLayer.type === "land") {
        return {
          total_agri_land: featureData.total_agri_land,
          plowed_area: featureData.plowed_area,
          sowed_land: featureData.sowed_land,
          harvested_land: featureData.harvested_land,
        }
      } else if (activeLayer.type === "crop") {
        return {
          teff_production_mt: featureData.teff_production_mt,
          wheat_production_mt: featureData.wheat_production_mt,
          barley_production_mt: featureData.barley_production_mt,
          maize_production_mt: featureData.maize_production_mt,
        }
      } else if (activeLayer.type === "pest") {
        return {
          pest_incidence: featureData.pest_incidence,
          affected_area_ha: featureData.affected_area_ha,
          crop_loss_tons: featureData.crop_loss_tons,
          pest_control_cost_etb: featureData.pest_control_cost_etb,
        }
      }
      return null
    },
    [activeMapLevel],
  )

  const formatParameterName = useCallback((param: string) => {
    const names: { [key: string]: string } = {
      total_agri_land: "Total Agricultural Land",
      plowed_area: "Plowed Area",
      sowed_land: "Sowed Area",
      harvested_land: "Harvested Area",
      teff_production_mt: "Teff Production",
      wheat_production_mt: "Wheat Production",
      barley_production_mt: "Barley Production",
      maize_production_mt: "Maize Production",
      pest_incidence: "Pest Incidence",
      affected_area_ha: "Affected Area",
      crop_loss_tons: "Crop Loss",
      pest_control_cost_etb: "Pest Control Cost",
    }
    return names[param] || param.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }, [])

  // FIXED: Updated formatParameterValue to properly display units for all parameter types
  const formatParameterValue = useCallback((value: any, param: string) => {
    if (value === null || value === undefined) return "N/A"
    
    try {
      // Convert to number if it's a string
      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
      
      if (isNaN(numericValue)) return String(value);
      
      // Land parameters - area measurements (hectares)
      if (param.includes("total_agri_land") || param.includes("plowed_area") || 
          param.includes("sowed_land") || param.includes("harvested_land")) {
        return `${numericValue.toLocaleString()} ha`;
      }
      
      // Affected area (hectares)
      if (param.includes("affected_area")) {
        return `${numericValue.toLocaleString()} ha`;
      }
      
      // Crop production parameters (metric tons)
      if (param.includes("production") || param.includes("crop_loss")) {
        return `${numericValue.toLocaleString()} tons`;
      }
      
      // Temperature parameters (celsius)
      if (param.includes("temp")) {
        return `${numericValue.toFixed(1)}°C`;
      }
      
      // Precipitation parameters (millimeters)
      if (param.includes("precipitation")) {
        return `${numericValue.toFixed(1)} mm`;
      }
      
      // Cost parameters (Ethiopian Birr)
      if (param.includes("cost")) {
        return `${numericValue.toLocaleString()} ETB`;
      }
      
      // Pest incidence (percentage)
      if (param.includes("incidence")) {
        return `${numericValue.toFixed(1)}%`;
      }
      
      // Default for other numeric values
      return numericValue.toLocaleString();
    } catch (error) {
      console.error("Error formatting parameter value:", error, value, param);
      return String(value);
    }
  }, []);

  const legendColors: string[] = []
  const baseRgb = hexToRgb(baseColor)
  const step = colorRanges > 0 ? (minMax.max - minMax.min) / colorRanges : 0

  if (baseRgb && colorRanges > 0) {
    for (let i = 0; i < colorRanges; i++) {
      const intensity = i / Math.max(1, colorRanges - 1)
      const r = Math.round(255 - (255 - baseRgb.r) * intensity)
      const g = Math.round(255 - (255 - baseRgb.g) * intensity)
      const b = Math.round(255 - (255 - baseRgb.b) * intensity)
      legendColors.push(`rgb(${r},${g},${b})`)
    }
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

  const getLegendTitle = () => {
    if (activeDataLayer) {
      switch (activeDataLayer.type) {
        case "land":
          return formatParameterName(landParameter)
        case "crop":
          return formatParameterName(cropParameter)
        case "pest":
          return formatParameterName(pestParameter)
      }
    }
    return weatherParameter === "max_temp"
      ? "Max Temperature °C"
      : weatherParameter === "min_temp"
        ? "Min Temperature °C"
        : "Precipitation mm"
  }

  const getLegendIcon = () => {
    if (activeDataLayer) {
      switch (activeDataLayer.type) {
        case "land":
          return <Sprout className="h-4 w-4 text-green-600" />
        case "crop":
          return <BarChart3 className="h-4 w-4 text-blue-600" />
        case "pest":
          return <Bug className="h-4 w-4 text-red-600" />
      }
    }
    return null
  }

  const title = getLegendTitle()
  const { min, max } = minMax

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      {/* Map Controls */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10 flex flex-col space-y-1 md:space-y-2">
        <Button
          onClick={() => handleZoom(0.2)}
          size="icon"
          variant="outline"
          className="bg-white shadow-md hover:bg-gray-50 h-8 w-8 md:h-10 md:w-10"
        >
          <ZoomIn className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        <Button
          onClick={() => handleZoom(-0.2)}
          size="icon"
          variant="outline"
          className="bg-white shadow-md hover:bg-gray-50 h-8 w-8 md:h-10 md:w-10"
        >
          <ZoomOut className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        <Button
          onClick={resetView}
          size="icon"
          variant="outline"
          className="bg-white shadow-md hover:bg-gray-50 h-8 w-8 md:h-10 md:w-10"
        >
          <RotateCcw className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
      </div>

      {/* Legend */}
      {((activeLayer === "weather" && !showPrecipitationIcons) || activeDataLayer) &&
        legendColors.length > 0 &&
        min !== max && (
          <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 z-10 bg-white rounded shadow p-2 text-xs md:text-sm max-w-[200px] md:max-w-none">
            <div className="font-medium mb-1 flex items-center space-x-1 md:space-x-2">
              {getLegendIcon()}
              <span className="truncate">{title}</span>
            </div>
            {legendColors.map((color, i) => {
              const low = min + i * step
              const high = i === colorRanges - 1 ? max : min + (i + 1) * step
              return (
                <div key={i} className="flex items-center space-x-1 md:space-x-2">
                  <div style={{ width: "16px", height: "16px", backgroundColor: color }} className="md:w-5 md:h-5" />
                  <span className="text-xs">
                    {low.toFixed(1)} - {high.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

      {/* Station Legend */}
      {showStations && stations.length > 0 && (
        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-10 bg-white rounded-lg shadow-lg p-2 md:p-4 max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-xs">Weather Station</span>
            </div>
            <div className="text-xs text-muted-foreground">Total: {stations.length} stations</div>
          </div>
        </div>
      )}

      {/* Agriculture Lands Legend */}
      {showAgricultureLands && agricultureLands.length > 0 && (
        <div className="absolute top-16 left-2 md:top-20 md:left-4 z-10 bg-white rounded-lg shadow-lg p-2 md:p-4 max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
              <span className="text-xs">Agriculture Lands</span>
            </div>
            <div className="text-xs text-muted-foreground">Total: {agricultureLands.length} sites</div>
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {(hoveredFeature || hoveredStation || hoveredLand) && (
        <div
          className="absolute top-2 left-2 md:top-4 md:left-4 z-50 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl p-4 text-xs border-2 border-primary/20 animate-in fade-in-0 zoom-in-95 duration-200 w-[280px] max-h-[300px] overflow-y-auto"
          style={{
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)",
          }}
        >
          {hoveredFeature && (
            (() => {
              const feature = sortedFeatures.find((f) => f.code === hoveredFeature)
              if (!feature) return null

              let featureName = feature.name
              let weatherInfo: WeatherData | undefined
              let agriculturalInfo: any = null

              if (activeMapLevel === "region") {
                weatherInfo = weatherData.find((data) => data.adm1_pcode === feature.code)
                agriculturalInfo = activeDataLayer?.data.find((data) => data.adm1_pcode === feature.code)
                featureName = weatherInfo?.adm1_en || feature.name
              } else if (activeMapLevel === "zone") {
                weatherInfo = weatherData.find((data) => data.adm2_pcode === feature.code)
                agriculturalInfo = activeDataLayer?.data.find((data) => data.adm2_pcode === feature.code)
              } else if (activeMapLevel === "woreda") {
                weatherInfo = weatherData.find((data) => data.adm3_pcode === feature.code)
                agriculturalInfo = activeDataLayer?.data.find((data) => data.adm3_pcode === feature.code)
              }

              const allParameters = activeDataLayer ? getAllParametersForFeature(feature, activeDataLayer) : null

              return (
                <div>
                  <div className="font-bold text-gray-900 text-base mb-3 border-b-2 border-primary/20 pb-2 bg-gradient-to-r from-primary/5 to-transparent px-2 py-1 rounded-lg -mx-2">
                    {featureName}
                  </div>

                  {allParameters && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center space-x-2">
                        {activeDataLayer?.type === "land" && <Sprout className="h-3 w-3" />}
                        {activeDataLayer?.type === "crop" && <BarChart3 className="h-3 w-3" />}
                        {activeDataLayer?.type === "pest" && <Bug className="h-3 w-3" />}
                        <span>
                          {activeDataLayer?.type === "land"
                            ? "Land Data"
                            : activeDataLayer?.type === "crop"
                              ? "Crop Production"
                              : "Pest Data"}
                        </span>
                      </div>
                      {Object.entries(allParameters).map(([param, value]) => {
                        const isActive = activeDataLayer && param === activeDataLayer.parameter
                        return (
                          <div
                            key={param}
                            className={`flex justify-between items-center p-2.5 rounded-lg transition-all duration-200 ${
                              isActive
                                ? "bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-primary shadow-sm"
                                : "bg-gray-50/80 hover:bg-gray-100/80"
                            }`}
                          >
                            <span className={`text-xs font-medium ${isActive ? "text-primary font-bold" : "text-gray-700"}`}>
                              {formatParameterName(param)}
                            </span>
                            <span className={`text-xs font-mono font-semibold ${isActive ? "text-primary" : "text-gray-800"}`}>
                              {formatParameterValue(value, param)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {weatherInfo && !activeDataLayer && (
                    <div className="mt-3 pt-3 border-t-2 border-blue-200">
                      <div className="text-xs font-semibold text-blue-700 mb-3 flex items-center space-x-2">
                        <CloudRain className="h-3 w-3" />
                        <span>Weather Information</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className={`flex justify-between p-2 rounded-lg ${
                          weatherParameter === "max_temp" 
                            ? "bg-blue-100 border-l-4 border-blue-500" 
                            : "bg-blue-50/80"
                        }`}>
                          <span>Max Temp:</span>
                          <span className={`font-mono font-semibold ${
                            weatherParameter === "max_temp" ? "text-blue-800 font-bold" : "text-blue-800"
                          }`}>
                            {formatParameterValue(weatherInfo.avg_annual_max_temperature_c, "max_temp")}
                          </span>
                        </div>
                        <div className={`flex justify-between p-2 rounded-lg ${
                          weatherParameter === "min_temp" 
                            ? "bg-blue-100 border-l-4 border-blue-500" 
                            : "bg-blue-50/80"
                        }`}>
                          <span>Min Temp:</span>
                          <span className={`font-mono font-semibold ${
                            weatherParameter === "min_temp" ? "text-blue-800 font-bold" : "text-blue-800"
                          }`}>
                            {formatParameterValue(weatherInfo.avg_annual_min_temperature_c, "min_temp")}
                          </span>
                        </div>
                        <div className={`flex justify-between col-span-2 p-2 rounded-lg ${
                          weatherParameter === "precipitation" 
                            ? "bg-blue-100 border-l-4 border-blue-500" 
                            : "bg-blue-50/80"
                        }`}>
                          <span>Precipitation:</span>
                          <span className={`font-mono font-semibold ${
                            weatherParameter === "precipitation" ? "text-blue-800 font-bold" : "text-blue-800"
                          }`}>
                            {formatParameterValue(weatherInfo.avg_annual_precipitation_mm_day, "precipitation")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!weatherInfo && !allParameters && (
                    <div className="text-xs text-gray-600 bg-gray-50/80 p-2 rounded-lg text-center">
                      Click to select this {activeMapLevel}
                    </div>
                  )}
                </div>
              )
            })()
          )}

          {hoveredStation && (
            (() => {
              const station = stations.find((s) => s.id === hoveredStation)
              if (!station || !station.geometry?.coordinates) return null

              return (
                <div>
                  <div className="flex items-center space-x-2 mb-2 bg-gradient-to-r from-green-50 to-transparent px-2 py-1 rounded-lg -mx-2">
                    <MapPin className="h-3 w-3 text-green-600" />
                    <span className="font-bold text-green-800">Weather Station #{station.gid}</span>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-semibold text-green-700">Coordinates:</span>
                    </div>
                    <div className="text-xs text-green-800 ml-2 font-mono bg-green-50/80 p-1.5 rounded">
                      Lat: {station.geometry.coordinates[1].toFixed(4)}°<br />
                      Lng: {station.geometry.coordinates[0].toFixed(4)}°
                    </div>
                  </div>
                </div>
              )
            })()
          )}

          {hoveredLand && (
            (() => {
              const land = agricultureLands.find((l) => l.id === hoveredLand)
              if (!land) return null

              return (
                <div>
                  <div className="font-bold text-orange-900 text-sm mb-2 bg-gradient-to-r from-orange-50 to-transparent px-2 py-1 rounded-lg -mx-2">
                    {land.name}
                  </div>
                  <div className="text-orange-700 font-bold mb-2 flex items-center space-x-1">
                    <Wheat className="h-3 w-3" />
                    <span>Agricultural Land</span>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between p-1.5 bg-orange-50/80 rounded">
                      <span>Area:</span>
                      <span className="font-mono font-semibold text-orange-800">{land.land_size}</span>
                    </div>
                    <div className="flex justify-between p-1.5 bg-orange-50/80 rounded">
                      <span>Type:</span>
                      <span className="capitalize font-semibold text-orange-800">{land.soil_type}</span>
                    </div>
                    <div className="flex justify-between p-1.5 bg-orange-50/80 rounded">
                      <span>Coordinates:</span>
                      <span className="font-mono text-xs font-semibold text-orange-800">
                        {land.geometry.coordinates[0].toFixed(3)}, {land.geometry.coordinates[1].toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()
          )}
        </div>
      )}

      {/* Map Container */}
      <div
        className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-blue-50 to-green-50"
        style={{ height: "400px", cursor: isDragging ? "grabbing" : "grab" }}
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
            sortedFeatures.map((feature) => {
              const pathData = geometryToPath(feature.geometry)
              if (!pathData) return null

              return (
                <g key={feature.gid}>
                  <path
                    d={pathData}
                    fill={getFeatureColor(feature)}
                    stroke={getFeatureStroke(feature)}
                    strokeWidth={getFeatureStrokeWidth(feature)}
                    fillOpacity={hoveredFeature === feature.code ? 0.9 : layerOpacity.boundaries || 0.8}
                    className="transition-all duration-200 cursor-pointer hover:brightness-110"
                    style={{
                      filter: hoveredFeature === feature.code ? "drop-shadow(0 8px 16px rgba(0,0,0,0.3))" : "none",
                      transform: hoveredFeature === feature.code ? "scale(1.01)" : "scale(1)",
                      transformOrigin: "center",
                    }}
                    onMouseEnter={() => handleFeatureInteraction(feature, true)}
                    onMouseLeave={() => handleFeatureInteraction(feature, false)}
                    onClick={() => handleFeatureClick(feature)}
                    onTouchStart={() => handleFeatureInteraction(feature, true)}
                    onTouchEnd={() => handleFeatureInteraction(feature, false)}
                  />

                  {showPrecipitationIcons &&
                    weatherParameter === "precipitation" &&
                    (() => {
                      const iconSize = getPrecipitationIconSize(feature)
                      if (iconSize === 0) return null

                      const bounds = feature.geometry?.coordinates?.[0]
                      if (!bounds) return null

                      let centerLng = 0,
                        centerLat = 0
                      bounds.forEach(([lng, lat]: [number, number]) => {
                        centerLng += lng
                        centerLat += lat
                      })
                      centerLng /= bounds.length
                      centerLat /= bounds.length

                      const centerPoint = projectPoint(centerLng, centerLat)

                      return (
                        <g transform={`translate(${centerPoint.x - iconSize / 2}, ${centerPoint.y - iconSize / 2})`}>
                          <CloudRain className="text-blue-600" style={{ width: iconSize, height: iconSize }} />
                        </g>
                      )
                    })()}
                </g>
              )
            })}

          {showStations &&
            stations.map((station) => {
              const coords = station.geometry?.coordinates
              if (!coords || coords.length !== 2) return null

              const point = projectPoint(coords[0], coords[1])
              const isHovered = hoveredStation === station.id

              return (
                <g key={station.gid}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHovered ? 8 : 6}
                    fill="#16a34a"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer transition-all duration-200 hover:fill-green-700"
                    onMouseEnter={() => {
                      setHoveredStation(station.id ?? null)
                      setHoveredFeature(null)
                      setHoveredLand(null)
                    }}
                    onMouseLeave={() => setHoveredStation(null)}
                  />
                </g>
              )
            })}

          {showAgricultureLands &&
            agricultureLands.map((land) => {
              const point = projectPoint(land.geometry.coordinates[0], land.geometry.coordinates[1])
              const isHovered = hoveredLand === land.id

              return (
                <g key={land.id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHovered ? "10" : "8"}
                    fill={isHovered ? "#dc2626" : "#ea580c"}
                    stroke="white"
                    strokeWidth={isHovered ? "3" : "2"}
                    className="transition-all duration-200 cursor-pointer hover:brightness-110"
                    style={{
                      filter: isHovered ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" : "none",
                    }}
                    onClick={() => onLandSelect?.(land)}
                    onTouchStart={() => setHoveredLand(land.id)}
                    onTouchEnd={() => setHoveredLand(null)}
                    onMouseEnter={() => {
                      setHoveredLand(land.id)
                      setHoveredFeature(null)
                      setHoveredStation(null)
                    }}
                    onMouseLeave={() => setHoveredLand(null)}
                  />
                </g>
              )
            })}
        </svg>
      </div>
    </div>
  )
}