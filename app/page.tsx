"use client"

import { useState, useEffect, useMemo } from "react"
import { MainLayout, useMapSelection } from "@/components/main-layout"
import { EthiopiaMap } from "@/components/ethiopia-map"
import { MapLevelIndicator } from "@/components/map-level-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Thermometer, MapPin, AlertTriangle, MapIcon, Layers, CloudRain, Radio, Wheat } from "lucide-react"

interface WeatherData {
  id: number
  adm1_en: string
  adm1_pcode: string
  adm2_en: string
  adm2_pcode: string
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
  id?: number
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

const colorSchemes = {
  red: "#dc2626",
  blue: "#2563eb",
  green: "#16a34a",
  orange: "#ea580c",
  purple: "#9333ea",
}

function MapContent({ setWeatherControlsProps }: { setWeatherControlsProps: (props: any) => void }) {
  const { activeMapLevel, activeWeatherDataSource } = useMapSelection()

  // Weather Data State
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  const [showWeatherData, setShowWeatherData] = useState(false)
  const [showStations, setShowStations] = useState(false)
  const [showAgricultureLands, setShowAgricultureLands] = useState(false)

  const [stations, setStations] = useState<Station[]>([])
  const [stationsLoading, setStationsLoading] = useState(false)
  const [agricultureLands, setAgricultureLands] = useState<AgricultureLand[]>([])
  const [agricultureLoading, setAgricultureLoading] = useState(false)
  const [selectedLand, setSelectedLand] = useState<AgricultureLand | null>(null)

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
    if (!activeWeatherDataSource || !showWeatherData) {
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
      console.error(" Error fetching weather data:", err)
      setWeatherError(err instanceof Error ? err.message : "Failed to load weather data")
    } finally {
      setWeatherLoading(false)
    }
  }

  const fetchStations = async () => {
    if (!showStations) {
      setStations([])
      return
    }

    setStationsLoading(true)
    try {
      const response = await fetch("/api/stations")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setStations(data.data)
        console.log(` Loaded ${data.data.length} weather stations`)
      }
    } catch (err) {
      console.error(" Error fetching stations:", err)
    } finally {
      setStationsLoading(false)
    }
  }

  const fetchAgricultureLands = async () => {
    if (!showAgricultureLands) {
      setAgricultureLands([])
      return
    }

    setAgricultureLoading(true)
    try {
      const response = await fetch("/api/agriculture_lands")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setAgricultureLands(data.data)
        console.log(` Loaded ${data.data.length} agriculture lands`)
      }
    } catch (err) {
      console.error(" Error fetching agriculture lands:", err)
    } finally {
      setAgricultureLoading(false)
    }
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
    if (showWeatherData) {
      fetchWeatherData(selectedYear)
    } else {
      setWeatherData([])
    }
  }, [selectedYear, activeMapLevel, activeWeatherDataSource, showWeatherData])

  useEffect(() => {
    fetchStations()
  }, [showStations])

  useEffect(() => {
    fetchAgricultureLands()
  }, [showAgricultureLands])

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

  const [currentPage, setCurrentPage] = useState(0)

  return (
    <div className="h-full p-6 space-y-6">
      {/* Map Level Indicator */}
      <MapLevelIndicator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layers className="h-5 w-5" />
            <span>Map Layers</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weather Data Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Thermometer className="h-4 w-4 text-blue-600" />
                <Label htmlFor="weather-toggle" className="font-medium">
                  Weather Data
                </Label>
              </div>
              <Switch id="weather-toggle" checked={showWeatherData} onCheckedChange={setShowWeatherData}  />
            </div>

            {/* Stations Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Radio className="h-4 w-4 text-green-600" />
                <Label htmlFor="stations-toggle" className="font-medium">
                  Weather Stations
                </Label>
              </div>
              <Switch id="stations-toggle" checked={showStations} onCheckedChange={setShowStations} />
            </div>

            {/* Agriculture Lands Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Wheat className="h-4 w-4 text-orange-600" />
                <Label htmlFor="agriculture-toggle" className="font-medium">
                  Agriculture Lands
                </Label>
              </div>
              <Switch
                id="agriculture-toggle"
                checked={showAgricultureLands}
                onCheckedChange={setShowAgricultureLands}
              />
            </div>
          </div>

          {showWeatherData && weatherParameter === "precipitation" && (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
              <div className="flex items-center space-x-2">
                <CloudRain className="h-4 w-4 text-blue-600" />
                <Label htmlFor="precipitation-icons" className="font-medium">
                  Show Precipitation Icons
                </Label>
              </div>
              <Switch
                id="precipitation-icons"
                checked={showPrecipitationIcons}
                onCheckedChange={setShowPrecipitationIcons}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* No Weather Data Alert for Woreda Level */}
      {!activeWeatherDataSource && showWeatherData && (
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
                <span>
                  {showWeatherData && activeWeatherDataSource
                    ? `${getParameterTitle()} - ${selectedYear}`
                    : `${activeMapLevel.charAt(0).toUpperCase() + activeMapLevel.slice(1)} Administrative Boundaries`}
                </span>
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
                  activeLayer={showWeatherData && activeWeatherDataSource ? "weather" : "boundaries"}
                  activeMapLevel={activeMapLevel}
                  weatherData={filteredData}
                  weatherParameter={weatherParameter}
                  baseColor={colorSchemes[colorScheme as keyof typeof colorSchemes]}
                  colorRanges={colorRanges}
                  overlayLayers={{ boundaries: true, pins: false }}
                  layerOpacity={{ boundaries: 0.8, pins: 1.0 }}
                  stations={stations}
                  showStations={showStations}
                  showPrecipitationIcons={showPrecipitationIcons}
                  agricultureLands={agricultureLands}
                  showAgricultureLands={showAgricultureLands}
                  onLandSelect={setSelectedLand}
                />
              )}
            </CardContent>
          </Card>

          {selectedLand && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wheat className="h-5 w-5 text-orange-600" />
                  <span>Agriculture Land Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Label className="font-semibold">Name:</Label>
                      <p>{selectedLand.name}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Region:</Label>
                      <p>{selectedLand.region}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Major Crops:</Label>
                      <p>{selectedLand.major_crops}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Land Size:</Label>
                      <p>{selectedLand.land_size}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Soil Type:</Label>
                      <p>{selectedLand.soil_type}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="font-semibold">Suitability:</Label>
                      <p>{selectedLand.suitability}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Challenges:</Label>
                      <p>{selectedLand.challenges}</p>
                    </div>
                    {selectedLand.image && (
                      <div>
                        <Label className="font-semibold">Image:</Label>
                        <img
                          src={selectedLand.image || "/placeholder.svg"}
                          alt={selectedLand.name}
                          className="w-full h-48 object-cover rounded-lg mt-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={() => setSelectedLand(null)} variant="outline" className="mt-4">
                  Close Details
                </Button>
              </CardContent>
            </Card>
          )}
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
                        {Object.keys(filteredData[0])
                          .slice(1) // remove first column
                          .map((key) => (
                            <th key={key} className="text-left p-2 font-medium">
                              {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData
                        .slice(currentPage * 20, (currentPage + 1) * 20) // pagination
                        .map((item: any, index: number) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            {Object.values(item)
                              .slice(1) // remove first column
                              .map((value: any, idx: number) => (
                                <td key={idx} className="p-2">
                                  {typeof value === "number" ? value.toLocaleString() : String(value)}
                                </td>
                              ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {filteredData.length > 20 && (
                    <div className="flex justify-between mt-4">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                        disabled={currentPage === 0}
                        className="px-3 py-1 border rounded hover:bg-muted/20 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage + 1} of {Math.ceil(filteredData.length / 20)}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredData.length / 20) - 1))
                        }
                        disabled={currentPage === Math.ceil(filteredData.length / 20) - 1}
                        className="px-3 py-1 border rounded hover:bg-muted/20 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function EthiopiaTemperatureMap() {
  const [weatherControlsProps, setWeatherControlsProps] = useState<any>(null)

  return (
    <MainLayout
      title="Ministry of Agriculture - Ethiopia"
      subtitle="ግብርና ሚኒስቴር - ኢትዮጵያ "
      weatherControlsProps={weatherControlsProps}
    >
      <MapContent setWeatherControlsProps={setWeatherControlsProps} />
    </MainLayout>
  )
}
