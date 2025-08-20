"use client"

import { useState, useEffect, useMemo } from "react"
import { MainLayout, useMapSelection } from "@/components/main-layout"
import { EthiopiaMap } from "@/components/ethiopia-map"
import { MapLevelIndicator } from "@/components/map-level-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Thermometer,
  MapPin,
  AlertTriangle,
  Download,
  Search,
  Filter,
  Eye,
  EyeOff,
  RefreshCw,
  MapIcon,
  Layers,
} from "lucide-react"

interface WeatherData {
  id: number
  adm1_en?: string
  adm1_pcode?: string
  adm2_en?: string
  adm2_pcode?: string
  year: number
  avg_annual_precipitation_mm_day: number
  avg_annual_max_temperature_c: number
  avg_annual_min_temperature_c: number
}

const colorSchemes = {
  red: "#dc2626",
  blue: "#2563eb",
  green: "#16a34a",
  orange: "#ea580c",
  purple: "#9333ea",
}

function MapContent({ setWeatherControlsProps }) {
  const { activeMapLevel, activeWeatherDataSource } = useMapSelection()

  // Weather Data State
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  // Control States
  const [selectedYear, setSelectedYear] = useState("2020")
  const [weatherParameter, setWeatherParameter] = useState<"max_temp" | "min_temp" | "precipitation">("max_temp")
  const [colorScheme, setColorScheme] = useState("red")
  const [colorRanges, setColorRanges] = useState(6)
  const [customRange, setCustomRange] = useState<{ min: number; max: number } | null>(null)
  const [useCustomRange, setUseCustomRange] = useState(false)
  const [showPrecipitationIcons, setShowPrecipitationIcons] = useState(false)

  // Interactive Control States
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [showDataTable, setShowDataTable] = useState(false)
  const [exportFormat, setExportFormat] = useState("csv")

  const fetchWeatherData = async (year: string) => {
    if (!activeWeatherDataSource) {
      setWeatherData([])
      setWeatherLoading(false)
      return
    }

    setWeatherLoading(true)
    setWeatherError(null)

    try {
      const endpoint = activeWeatherDataSource === "r_weather_data" ? "/api/weather-data" : "/api/z-weather-data"
      const response = await fetch(`${endpoint}?year=${year}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setWeatherData(data.data)
        console.log(` Loaded ${data.data.length} weather records for ${activeMapLevel} level`)
      } else {
        throw new Error(data.error || "Failed to fetch weather data")
      }
    } catch (err) {
      console.error("Error fetching weather data:", err)
      setWeatherError(err instanceof Error ? err.message : "Failed to load weather data")
    } finally {
      setWeatherLoading(false)
    }
  }

  const handleExportData = () => {
    const dataToExport = weatherData
    const filename = `ethiopia_weather_data_${new Date().toISOString().split("T")[0]}`

    if (exportFormat === "csv") {
      const csv = convertToCSV(dataToExport)
      downloadFile(csv, `${filename}.csv`, "text/csv")
    } else if (exportFormat === "json") {
      const json = JSON.stringify(dataToExport, null, 2)
      downloadFile(json, `${filename}.json`, "application/json")
    }
  }

  const convertToCSV = (data: any) => {
    if (!data || !Array.isArray(data)) return ""

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((row) => Object.values(row).join(","))
    return [headers, ...rows].join("\n")
  }

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const filteredData = useMemo(() => {
    let data = weatherData

    if (!data) return []

    if (searchQuery) {
      data = data.filter((item: any) =>
        Object.values(item).some((value) => String(value).toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    if (selectedRegions.length > 0) {
      data = data.filter((item: any) => selectedRegions.includes(item.adm1_pcode))
    }

    return data
  }, [weatherData, searchQuery, selectedRegions])

  useEffect(() => {
    fetchWeatherData(selectedYear)
  }, [selectedYear, activeMapLevel, activeWeatherDataSource])

  const dataRange = useMemo(() => {
    if (filteredData.length === 0) return { min: 0, max: 0 }

    const parameterKey =
      weatherParameter === "max_temp"
        ? "avg_annual_max_temperature_c"
        : weatherParameter === "min_temp"
          ? "avg_annual_min_temperature_c"
          : "avg_annual_precipitation_mm_day"

    const values = filteredData.map((d) => d[parameterKey as keyof WeatherData] as number).filter((v) => v != null)
    if (values.length === 0) return { min: 0, max: 0 }

    return { min: Math.min(...values), max: Math.max(...values) }
  }, [filteredData, weatherParameter])

  const getParameterTitle = () => {
    switch (weatherParameter) {
      case "max_temp":
        return "Maximum Temperature (°C)"
      case "min_temp":
        return "Minimum Temperature (°C)"
      case "precipitation":
        return "Precipitation (mm/day)"
      default:
        return "Temperature Data"
    }
  }

  const getParameterIcon = () => {
    switch (weatherParameter) {
      case "max_temp":
      case "min_temp":
        return <Thermometer className="h-5 w-5 text-red-600" />
      case "precipitation":
        return <MapPin className="h-5 w-5 text-blue-600" />
      default:
        return <Thermometer className="h-5 w-5" />
    }
  }

  useEffect(() => {
    const weatherControls = {
      selectedYear,
      onYearChange: setSelectedYear,
      weatherParameter,
      onParameterChange: setWeatherParameter,
      colorScheme,
      onColorSchemeChange: setColorScheme,
      colorRanges,
      onColorRangesChange: setColorRanges,
      customRange,
      onCustomRangeChange: setCustomRange,
      useCustomRange,
      onUseCustomRangeChange: setUseCustomRange,
      showPrecipitationIcons,
      onShowPrecipitationIconsChange: setShowPrecipitationIcons,
      dataRange,
      onRefresh: () => fetchWeatherData(selectedYear),
      loading: weatherLoading,
    }

    if (typeof setWeatherControlsProps === "function") {
      setWeatherControlsProps(weatherControls)
    }
  }, [
    selectedYear,
    weatherParameter,
    colorScheme,
    colorRanges,
    customRange,
    useCustomRange,
    showPrecipitationIcons,
    dataRange,
    weatherLoading,
  ])

  return (
    <div className="h-full p-6 space-y-6">
      {/* Map Level Indicator */}
      <MapLevelIndicator />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Interactive Controls</span>
            </div>
            <Badge variant="default">
              <Button variant="ghost" size="sm" className="h-auto p-1">
                Weather Data
              </Button>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={showDataTable ? "outline" : "default"}
                size="sm"
                onClick={() => setShowDataTable(!showDataTable)}
              >
                {showDataTable ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showDataTable ? "Hide Table" : "Show Table"}
              </Button>
            </div>

            {/* Export Controls */}
            <div className="flex items-center space-x-2">
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Refresh */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchWeatherData(selectedYear)}
                disabled={weatherLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${weatherLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Weather Data Alert for Woreda Level */}
      {!activeWeatherDataSource && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Weather data is not available for woreda level. Please select region or zone level to view weather
            information.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map" className="flex items-center space-x-2">
            <MapIcon className="h-4 w-4" />
            <span>Map View</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center space-x-2">
            <MapIcon className="h-4 w-4" />
            <span>Charts</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <span>Data View</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>{activeWeatherDataSource ? `${getParameterTitle()} - ${selectedYear}` : `${activeMapLevel.charAt(0).toUpperCase() + activeMapLevel.slice(1)} Administrative Boundaries`}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[600px]">
              {weatherError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">Error: {weatherError}</p>
                  <Button onClick={() => fetchWeatherData(selectedYear)} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : (
                <EthiopiaMap
                  activeLayer={activeWeatherDataSource ? "weather" : "boundaries"}
                  activeMapLevel={activeMapLevel}
                  weatherData={filteredData}
                  weatherParameter={weatherParameter}
                  baseColor={colorSchemes[colorScheme as keyof typeof colorSchemes]}
                  colorRanges={colorRanges}
                  overlayLayers={{ boundaries: true, pins: false }}
                  layerOpacity={{ boundaries: 0.8, pins: 1.0 }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Weather data charts will be available in the next update.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Table - {filteredData.length} records</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(filteredData[0]).map((key) => (
                          <th key={key} className="text-left p-2 font-medium">
                            {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.slice(0, 50).map((item: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          {Object.values(item).map((value: any, idx: number) => (
                            <td key={idx} className="p-2">
                              {typeof value === "number" ? value.toLocaleString() : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredData.length > 50 && (
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      Showing first 50 of {filteredData.length} records. Use export to download all data.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Summary - Only show if data is available */}
      {filteredData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{filteredData.length}</div>
                <div className="text-sm text-gray-600">
                  {activeMapLevel.charAt(0).toUpperCase() + activeMapLevel.slice(1)}s with Data
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {dataRange.max.toFixed(1)}
                  {weatherParameter === "precipitation" ? " mm" : "°C"}
                </div>
                <div className="text-sm text-gray-600">Maximum Value</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {dataRange.min.toFixed(1)}
                  {weatherParameter === "precipitation" ? " mm" : "°C"}
                </div>
                <div className="text-sm text-gray-600">Minimum Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function EthiopiaTemperatureMap() {
  const [weatherControlsProps, setWeatherControlsProps] = useState<any>(null)

  return (
    <MainLayout
      title="Weather Data Portal"
      subtitle="Ministry of Agriculture - Ethiopia"
      weatherControlsProps={weatherControlsProps}
    >
      <MapContent setWeatherControlsProps={setWeatherControlsProps} />
    </MainLayout>
  )
}