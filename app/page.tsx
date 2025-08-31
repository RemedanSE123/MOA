"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { MainLayout, useMapSelection } from "@/components/main-layout"
import { EthiopiaMap } from "@/components/ethiopia-map"
// import { MapLevelIndicator } from "@/components/map-level-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DataCharts } from "@/components/data-charts"
import { Loader2 } from "lucide-react"
import {
  Thermometer,
  MapPin,
  AlertTriangle,
  MapIcon,
  Layers,
  Radio,
  Wheat,
  Sprout,
  BarChart3,
  Bug,
  Download,
  Search,
  Filter,
} from "lucide-react"

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
  amber: "#fbbf24",
}

function MapContent({
  setWeatherControlsProps,
  setLayerControlsProps,
}: { setWeatherControlsProps: (props: any) => void; setLayerControlsProps: (props: any) => void }) {
  const { activeMapLevel, activeWeatherDataSource } = useMapSelection()

  // Weather Data State
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [weatherParameter, setWeatherParameter] = useState("avg_annual_max_temperature_c")

  const [showWeatherData, setShowWeatherData] = useState(false)
  const [showStations, setShowStations] = useState(false)
  const [showAgricultureLands, setShowAgricultureLands] = useState(false)

  const [stations, setStations] = useState<Station[]>([])
  const [stationsLoading, setStationsLoading] = useState(false)
  const [agricultureLands, setAgricultureLands] = useState<AgricultureLand[]>([])
  const [agricultureLoading, setAgricultureLoading] = useState(false)
  const [selectedLand, setSelectedLand] = useState<AgricultureLand | null>(null)

  // New Layer States
  const [landLayerEnabled, setLandLayerEnabled] = useState(false)
  const [cropProductionLayerEnabled, setCropProductionLayerEnabled] = useState(false)
  const [pestDataLayerEnabled, setPestDataLayerEnabled] = useState(false)

  // New Data States
  const [landData, setLandData] = useState<any[]>([])
  const [cropProductionData, setCropProductionData] = useState<any[]>([])
  const [pestData, setPestData] = useState<any[]>([])
  const [landLoading, setLandLoading] = useState(false)
  const [cropProductionLoading, setCropProductionLoading] = useState(false)
  const [pestLoading, setPestLoading] = useState(false)

  // New Parameter States
  const [landParameter, setLandParameter] = useState("total_agri_land")
  const [cropParameter, setCropParameter] = useState("teff_production_mt")
  const [pestParameter, setPestParameter] = useState("pest_incidence")

  // Control States
  const [selectedYear, setSelectedYear] = useState("2020")

  const [landColorScheme, setLandColorScheme] = useState("green")
  const [landColorRanges, setLandColorRanges] = useState(6)
  const [cropColorScheme, setCropColorScheme] = useState("orange")
  const [cropColorRanges, setCropColorRanges] = useState(6)
  const [pestColorScheme, setPestColorScheme] = useState("red")
  const [pestColorRanges, setPestColorRanges] = useState(6)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])

  const fetchWeatherData = useCallback(
  async (year: string) => {
    if (!showWeatherData) return

    setWeatherLoading(true)
    setWeatherError(null)

    try {
      let endpoint = ""
      if (activeWeatherDataSource === "r_weather_data") {
        endpoint = "/api/r-weather-data"
      } else if (activeWeatherDataSource === "z_weather_data") {
        endpoint = "/api/z-weather-data"
      } else if (activeWeatherDataSource === "w_weather_data") {
        endpoint = "/api/w-weather-data"
      } else {
        throw new Error("Invalid weather data source")
      }

      const response = await fetch(`${endpoint}?year=${year}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setWeatherData(data.data)
        console.log(`✅ Loaded ${data.data.length} weather records for ${activeMapLevel} level`)
      } else {
        throw new Error(data.error || "Failed to fetch weather data")
      }
    } catch (err) {
      console.error("❌ Error fetching weather data:", err)
      setWeatherError(err instanceof Error ? err.message : "Failed to load weather data")
    } finally {
      setWeatherLoading(false)
    }
  },
  [showWeatherData, activeWeatherDataSource, activeMapLevel]
)


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

  const fetchLandData = async (year: string) => {
    if (!landLayerEnabled) {
      setLandData([])
      return
    }

    setLandLoading(true)
    try {
      let endpoint = "/api/land"
      if (activeMapLevel === "zone") {
        endpoint = "/api/z-land"
      } else if (activeMapLevel === "woreda") {
        endpoint = "/api/w-land"
      }

      const response = await fetch(`${endpoint}?year=${year}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (data.success) {
        setLandData(data.data)
        console.log(` Loaded ${data.data.length} land records for ${activeMapLevel} level`)
      }
    } catch (err) {
      console.error(" Error fetching land data:", err)
    } finally {
      setLandLoading(false)
    }
  }

  const fetchCropProductionData = async (year: string) => {
    if (!cropProductionLayerEnabled) {
      setCropProductionData([])
      return
    }

    setCropProductionLoading(true)
    try {
      let endpoint = "/api/cropproduction"
      if (activeMapLevel === "zone") {
        endpoint = "/api/z-cropproduction"
      } else if (activeMapLevel === "woreda") {
        endpoint = "/api/w-cropproduction"
      }

      const response = await fetch(`${endpoint}?year=${year}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (data.success) {
        setCropProductionData(data.data)
        console.log(` Loaded ${data.data.length} crop production records for ${activeMapLevel} level`)
      }
    } catch (err) {
      console.error(" Error fetching crop production data:", err)
    } finally {
      setCropProductionLoading(false)
    }
  }

  const fetchPestData = async (year: string) => {
    if (!pestDataLayerEnabled) {
      setPestData([])
      return
    }

    setPestLoading(true)
    try {
      let endpoint = "/api/pestdata"
      if (activeMapLevel === "zone") {
        endpoint = "/api/z-pestdata"
      } else if (activeMapLevel === "woreda") {
        endpoint = "/api/w_pestdata"
      }

      const response = await fetch(`${endpoint}?year=${year}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (data.success) {
        setPestData(data.data)
        console.log(` Loaded ${data.data.length} pest data records for ${activeMapLevel} level - ${year}`)
        if (data.data.length > 0) {
          const totalIncidence = data.data.reduce(
            (sum: number, item: any) => sum + (Number.parseFloat(item.pest_incidence) || 0),
            0,
          )
          const avgIncidence = totalIncidence / data.data.length
          console.log(` Average pest incidence: ${avgIncidence.toFixed(2)}%`)
        }
      }
    } catch (err) {
      console.error(" Error fetching pest data:", err)
    } finally {
      setPestLoading(false)
    }
  }

  // const getParameterTitle = () => {
  //   switch (activeWeatherDataSource) {
  //     case "r_weather_data":
  //       return "Maximum Temperature (°C)"
  //     case "z_weather_data":
  //       return "Minimum Temperature (°C)"
  //     case "w_weather_data":
  //       return "Precipitation (mm/day)"
  //     default:
  //       return "Temperature Data"
  //   }
  // }

  const getActiveDataForView = useMemo(() => {
    console.log(
      " Determining active data for view - pestDataLayerEnabled:",
      pestDataLayerEnabled,
      "cropProductionLayerEnabled:",
      cropProductionLayerEnabled,
      "landLayerEnabled:",
      landLayerEnabled,
      "showWeatherData:",
      showWeatherData,
    )

    // Priority order: Pest Data > Crop Production > Land Data > Weather Data
    if (pestDataLayerEnabled && pestData.length > 0) {
      console.log(" Using pest data for view:", pestData.length, "records")
      return {
        data: pestData,
        type: "pest",
        title: `Pest Management Data - ${pestParameter.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} - ${selectedYear}`,
        icon: <Bug className="h-4 w-4 text-red-600" />,
        color: pestColorScheme,
      }
    }

    if (cropProductionLayerEnabled && cropProductionData.length > 0) {
      console.log(" Using crop production data for view:", cropProductionData.length, "records")
      return {
        data: cropProductionData,
        type: "crop",
        title: `Crop Production - ${cropParameter.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} - ${selectedYear}`,
        icon: <BarChart3 className="h-4 w-4 text-amber-600" />,
        color: cropColorScheme,
      }
    }

    if (landLayerEnabled && landData.length > 0) {
      console.log(" Using land data for view:", landData.length, "records")
      return {
        data: landData,
        type: "land",
        title: `Land Data - ${landParameter.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} - ${selectedYear}`,
        icon: <Sprout className="h-4 w-4 text-green-600" />,
        color: landColorScheme,
      }
    }

    if (showWeatherData && activeWeatherDataSource) {
      console.log(" Using weather data for view:", weatherData.length, "records")
      return {
        data: weatherData,
        type: "weather",
        title: `Weather Data - ${weatherParameter.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} - ${selectedYear}`,
        icon: <Thermometer className="h-4 w-4 text-blue-600" />,
        color: "blue",
      }
    }

    console.log(" No active data layer found")
    return null
  }, [
    pestDataLayerEnabled,
    pestData,
    pestParameter,
    cropProductionLayerEnabled,
    cropProductionData,
    cropParameter,
    landLayerEnabled,
    landData,
    landParameter,
    showWeatherData,
    weatherData,
    selectedYear,
    activeWeatherDataSource,
  ])

  const filteredDataForView = useMemo(() => {
    const activeData = getActiveDataForView
    if (!activeData || !activeData.data) {
      console.log(" No active data for filtering")
      return []
    }

    let data = activeData.data
    console.log(" Filtering data:", data.length, "records of type:", activeData.type)

    if (activeWeatherDataSource === "w_weather_data") {
      data = data.filter((item: any) => item.adm2_pcode !== null)
      console.log(" After woreda filter:", data.length, "records")
    }

    if (searchQuery) {
      data = data.filter((item: any) =>
        Object.values(item).some((value) => String(value).toLowerCase().includes(searchQuery.toLowerCase())),
      )
      console.log(" After search filter:", data.length, "records")
    }

    if (selectedRegions.length > 0) {
      data = data.filter((item: any) => selectedRegions.includes(item.adm1_pcode))
      console.log(" After region filter:", data.length, "records")
    }

    return data
  }, [getActiveDataForView, searchQuery, selectedRegions, activeWeatherDataSource])

  const exportData = (format: string) => {
    const activeData = getActiveDataForView
    if (!activeData || filteredDataForView.length === 0) return

    const dataToExport = filteredDataForView
    const filename = `${activeData.type}_data_${activeMapLevel}_${selectedYear}.${format}`

    if (format === "csv") {
      const headers = Object.keys(dataToExport[0]).join(",")
      const rows = dataToExport.map((item) =>
        Object.values(item)
          .map((value) => (typeof value === "string" && value.includes(",") ? `"${value}"` : value))
          .join(","),
      )
      const csvContent = [headers, ...rows].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    } else if (format === "json") {
      const jsonContent = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  useEffect(() => {
    fetchWeatherData(selectedYear)
  }, [selectedYear, activeMapLevel, activeWeatherDataSource, showWeatherData, fetchWeatherData])

  useEffect(() => {
    fetchStations()
  }, [showStations])

  useEffect(() => {
    fetchAgricultureLands()
  }, [showAgricultureLands])

  useEffect(() => {
    fetchLandData(selectedYear)
  }, [selectedYear, landLayerEnabled, activeMapLevel])

  useEffect(() => {
    fetchCropProductionData(selectedYear)
  }, [selectedYear, cropProductionLayerEnabled, activeMapLevel])

  useEffect(() => {
    fetchPestData(selectedYear)
  }, [selectedYear, pestDataLayerEnabled, activeMapLevel])

// In your MapContent component in page.tsx, add these state variables:
const [weatherColorScheme, setWeatherColorScheme] = useState("blue")
const [weatherColorRanges, setWeatherColorRanges] = useState(6)

// Update the useEffect that sets weatherControlsProps:
useEffect(() => {
  const weatherControls = {
    selectedYear,
    onYearChange: setSelectedYear,
    weatherParameter: weatherParameter === "avg_annual_max_temperature_c" ? "max_temp" : 
                     weatherParameter === "avg_annual_min_temperature_c" ? "min_temp" : "precipitation",
    onParameterChange: (param: "max_temp" | "min_temp" | "precipitation") => {
      setWeatherParameter(
        param === "max_temp" ? "avg_annual_max_temperature_c" :
        param === "min_temp" ? "avg_annual_min_temperature_c" : "avg_annual_precipitation_mm_day"
      )
    },
    colorScheme: weatherColorScheme, // Use the state
    onColorSchemeChange: setWeatherColorScheme, // Pass the setter
    colorRanges: weatherColorRanges, // Use the state
    onColorRangesChange: setWeatherColorRanges, // Pass the setter
    onRefresh: () => fetchWeatherData(selectedYear),
    loading: weatherLoading,
    showWeatherData,
    onShowWeatherDataChange: setShowWeatherData,
    showWeatherStations: showStations,
    onShowWeatherStationsChange: setShowStations,
  }

  if (typeof setWeatherControlsProps === "function") {
    setWeatherControlsProps(weatherControls)
  }
}, [
  selectedYear, 
  weatherParameter, 
  weatherLoading, 
  showWeatherData, 
  showStations, 
  fetchWeatherData,
  weatherColorScheme, // Add to dependencies
  weatherColorRanges, // Add to dependencies
])





  useEffect(() => {
    const layerControls = {
      landLayerEnabled,
      onLandLayerToggle: setLandLayerEnabled,
      cropProductionLayerEnabled,
      onCropProductionLayerToggle: setCropProductionLayerEnabled,
      pestDataLayerEnabled,
      onPestDataLayerToggle: setPestDataLayerEnabled,
      selectedYear,
      onYearChange: setSelectedYear,
      landParameter,
      onLandParameterChange: setLandParameter,
      cropParameter,
      onCropParameterChange: setCropParameter,
      pestParameter,
      onPestParameterChange: setPestParameter,
      // Individual color controls for each layer
      landColorScheme,
      onLandColorSchemeChange: setLandColorScheme,
      landColorRanges,
      onLandColorRangesChange: setLandColorRanges,
      cropColorScheme,
      onCropColorSchemeChange: setCropColorScheme,
      cropColorRanges,
      onCropColorRangesChange: setCropColorRanges,
      pestColorScheme,
      onPestColorSchemeChange: setPestColorScheme,
      pestColorRanges,
      onPestColorRangesChange: setPestColorRanges,
      showAgricultureLands, // Add this
    onShowAgricultureLandsChange: setShowAgricultureLands, // Add this
      onRefresh: () => {
        if (landLayerEnabled) fetchLandData(selectedYear)
        if (cropProductionLayerEnabled) fetchCropProductionData(selectedYear)
        if (pestDataLayerEnabled) fetchPestData(selectedYear)
        if (showWeatherData) fetchWeatherData(selectedYear)
           if (showAgricultureLands) fetchAgricultureLands() // Add this
      },
      loading: landLoading || cropProductionLoading || pestLoading,
    }

    if (typeof setLayerControlsProps === "function") {
      setLayerControlsProps(layerControls)
    }
  }, [
    landLayerEnabled,
    cropProductionLayerEnabled,
    pestDataLayerEnabled,
    landParameter,
    cropParameter,
    pestParameter,
    landColorScheme,
    landColorRanges,
    cropColorScheme,
    cropColorRanges,
    pestColorScheme,
    pestColorRanges,
    selectedYear,
    landLoading,
    cropProductionLoading,
    pestLoading,
     showAgricultureLands, // Add this
  agricultureLoading, // Add this
  ])

  useEffect(() => {
    setCurrentPage(0)
  }, [getActiveDataForView, searchQuery, selectedRegions, activeMapLevel])

  const [currentPage, setCurrentPage] = useState(0)

  return (
    <div className="h-full p-4 space-y-4 pr-6">
      {/* Map Level Indicator */}
     

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base">
            <Layers className="h-4 w-4" />
            <span>Map Layers</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Weather Data Toggle */}
            <div className="flex items-center justify-between p-3 border-2 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-300 transition-all duration-200">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Thermometer className="h-4 w-4 text-blue-600" />
                </div>
                <Label htmlFor="weather-toggle" className="font-semibold text-sm text-blue-900 cursor-pointer">
                  Weather Data
                </Label>
              </div>
              <Switch
                id="weather-toggle"
                checked={showWeatherData}
                onCheckedChange={setShowWeatherData}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            {/* Land Data Toggle */}
            <div
              className={`flex items-center justify-between p-3 border-2 rounded-xl transition-all duration-200 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300`}
            >
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <Sprout className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <Label htmlFor="land-toggle" className="font-semibold text-sm cursor-pointer text-green-900">
                    Land Data
                  </Label>
                  <div className="text-xs text-green-600">Available for all levels</div>
                </div>
              </div>
              <Switch
                id="land-toggle"
                checked={landLayerEnabled}
                onCheckedChange={setLandLayerEnabled}
                className="data-[state=checked]:bg-green-600"
              />
            </div>

            {/* Crop Production Toggle */}
            <div
              className={`flex items-center justify-between p-3 border-2 rounded-xl transition-all duration-200 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300`}
            >
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <Label htmlFor="crop-toggle" className="font-semibold text-sm cursor-pointer text-amber-900">
                    Crop Production
                  </Label>
                  <div className="text-xs text-amber-600">Available for all levels</div>
                </div>
              </div>
              <Switch
                id="crop-toggle"
                checked={cropProductionLayerEnabled}
                onCheckedChange={setCropProductionLayerEnabled}
                className="data-[state=checked]:bg-amber-600"
              />
            </div>

            {/* Pest Data Toggle */}
            <div
              className={`flex items-center justify-between p-3 border-2 rounded-xl transition-all duration-200 bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:border-red-300`}
            >
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <Bug className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <Label htmlFor="pest-toggle" className="font-semibold text-sm cursor-pointer text-red-900">
                    Pest Data
                  </Label>
                  <div className="text-xs text-red-600">Available for all levels</div>
                </div>
              </div>
              <Switch
                id="pest-toggle"
                checked={pestDataLayerEnabled}
                onCheckedChange={setPestDataLayerEnabled}
                className="data-[state=checked]:bg-red-600"
              />
            </div>

            {/* Stations Toggle */}
            <div className="flex items-center justify-between p-3 border-2 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200 hover:border-teal-300 transition-all duration-200">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-teal-100 rounded-lg">
                  <Radio className="h-4 w-4 text-teal-600" />
                </div>
                <Label htmlFor="stations-toggle" className="font-semibold text-sm text-teal-900 cursor-pointer">
                  Weather Stations
                </Label>
              </div>
              <Switch
                id="stations-toggle"
                checked={showStations}
                onCheckedChange={setShowStations}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            {/* Agriculture Lands Toggle */}
            <div className="flex items-center justify-between p-3 border-2 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 hover:border-orange-300 transition-all duration-200">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <Wheat className="h-4 w-4 text-orange-600" />
                </div>
                <Label htmlFor="agriculture-toggle" className="font-semibold text-sm text-orange-900 cursor-pointer">
                  Agriculture Lands
                </Label>
              </div>
              <Switch
                id="agriculture-toggle"
                checked={showAgricultureLands}
                onCheckedChange={setShowAgricultureLands}
                className="data-[state=checked]:bg-orange-600"
              />
            </div>
          </div>

          {showWeatherData && weatherLoading && (
            <Alert>
              <Loader2 className="h-3 w-3 animate-spin" />
              <AlertDescription className="text-xs">
                Loading weather data for {activeMapLevel} level...
              </AlertDescription>
            </Alert>
          )}

          {showWeatherData && weatherError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">{weatherError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="map" className="space-y-3">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map" className="flex items-center space-x-1.5 text-xs">
            <MapIcon className="h-3 w-3" />
            <span>Map View</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center space-x-1.5 text-xs">
            <BarChart3 className="h-3 w-3" />
            <span>Charts</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center space-x-1.5 text-xs">
            <Layers className="h-3 w-3" />
            <span>Data View</span>
            {getActiveDataForView && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {filteredDataForView.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span>
                  {pestDataLayerEnabled && pestData.length > 0
                    ? `Pest Management Data - ${pestParameter.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} - ${selectedYear}`
                    : cropProductionLayerEnabled && cropProductionData.length > 0
                      ? `Crop Production - ${cropParameter.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} - ${selectedYear}`
                      : landLayerEnabled && landData.length > 0
                        ? `Land Data - ${landParameter.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} - ${selectedYear}`
                        : showWeatherData && activeWeatherDataSource
                           ? `Weather Data - ${weatherParameter.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} - ${selectedYear}`
                          : `${activeMapLevel.charAt(0).toUpperCase() + activeMapLevel.slice(1)} Administrative Boundaries`}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] md:h-[550px]">
              {weatherError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">Error: {weatherError}</p>
                  <Button onClick={() => fetchWeatherData(selectedYear)} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : (




               <EthiopiaMap
  activeLayer={
    pestDataLayerEnabled && pestData.length > 0
      ? "pest"
      : cropProductionLayerEnabled && cropProductionData.length > 0
        ? "crop"
        : landLayerEnabled && landData.length > 0
          ? "land"
          : showWeatherData && activeWeatherDataSource
            ? "weather"
            : "boundaries"
  }
  activeMapLevel={activeMapLevel}
  weatherData={weatherData}
  weatherParameter={
    weatherParameter === "avg_annual_max_temperature_c"
      ? "max_temp"
      : weatherParameter === "avg_annual_min_temperature_c"
        ? "min_temp"
        : weatherParameter === "avg_annual_precipitation_mm_day"
          ? "precipitation"
          : undefined
  }
  baseColor={
    pestDataLayerEnabled && pestData.length > 0
      ? colorSchemes[pestColorScheme as keyof typeof colorSchemes]
      : cropProductionLayerEnabled && cropProductionData.length > 0
        ? colorSchemes[cropColorScheme as keyof typeof colorSchemes]
        : landLayerEnabled && landData.length > 0
          ? colorSchemes[landColorScheme as keyof typeof colorSchemes]
          : showWeatherData // Add this condition for weather
          ? colorSchemes[weatherColorScheme as keyof typeof colorSchemes]
          : colorSchemes.blue
  }
  colorRanges={
    pestDataLayerEnabled && pestData.length > 0
      ? pestColorRanges
      : cropProductionLayerEnabled && cropProductionData.length > 0
        ? cropColorRanges
        : landLayerEnabled && landData.length > 0
          ? landColorRanges
          : showWeatherData // Add this condition for weather
          ? weatherColorRanges
          : 6
  }


                  overlayLayers={{ boundaries: true, pins: false }}
                  layerOpacity={{ boundaries: 0.8, pins: 1.0 }}
                  stations={stations}
                  showStations={showStations}
                  agricultureLands={agricultureLands}
                  showAgricultureLands={showAgricultureLands}
                  onLandSelect={setSelectedLand}
                  landData={landData}
                  landLayerEnabled={landLayerEnabled}
                  cropProductionData={cropProductionData}
                  cropProductionLayerEnabled={cropProductionLayerEnabled}
                  pestData={pestData}
                  pestDataLayerEnabled={pestDataLayerEnabled}
                  landParameter={landParameter}
                  cropParameter={cropParameter}
                  pestParameter={pestParameter}
                  key={`${activeMapLevel}-${selectedYear}-${landLayerEnabled}-${cropProductionLayerEnabled}-${pestDataLayerEnabled}-${showWeatherData}`}
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
          <DataCharts
            landData={landData}
            cropProductionData={cropProductionData}
            pestData={pestData}
            weatherData={weatherData}
            activeDataLayers={[
              ...(landLayerEnabled ? ["Land Data"] : []),
              ...(cropProductionLayerEnabled ? ["Crop Production"] : []),
              ...(pestDataLayerEnabled ? ["Pest Data"] : []),
              ...(showWeatherData ? ["Weather Data"] : []),
            ]}
            selectedYear={selectedYear}
          />
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-2">
                  {getActiveDataForView ? (
                    <>
                      {getActiveDataForView.icon}
                      <CardTitle className="text-sm">{getActiveDataForView.title}</CardTitle>
                      <Badge
                        variant="outline"
                        className={`text-${getActiveDataForView.color}-600 border-${getActiveDataForView.color}-200`}
                      >
                        {activeMapLevel.charAt(0).toUpperCase() + activeMapLevel.slice(1)} Level
                      </Badge>
                    </>
                  ) : (
                    <CardTitle className="text-sm">No Data Layer Active</CardTitle>
                  )}
                </div>

                {getActiveDataForView && (
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search data..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1 text-xs border rounded-md w-32 sm:w-48"
                      />
                    </div>
                    <Button onClick={() => exportData("csv")} size="sm" variant="outline" className="text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      CSV
                    </Button>
                    <Button onClick={() => exportData("json")} size="sm" variant="outline" className="text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      JSON
                    </Button>
                  </div>
                )}
              </div>

              {getActiveDataForView && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {filteredDataForView.length} records
                  </Badge>
                  {searchQuery && (
                    <Badge variant="outline" className="text-xs">
                      <Search className="h-3 w-3 mr-1" />
                      Filtered by: "{searchQuery}"
                    </Badge>
                  )}
                  {selectedRegions.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Filter className="h-3 w-3 mr-1" />
                      {selectedRegions.length} regions selected
                    </Badge>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!getActiveDataForView ? (
                <div className="text-center py-12">
                  <Layers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Layer Active</h3>
                  <p className="text-gray-500 mb-4">
                    Enable a data layer from the controls above to view data in the table.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Weather Data
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Land Data
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Crop Production
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Pest Data
                    </Badge>
                  </div>
                </div>
              ) : filteredDataForView.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto -mx-2 md:mx-0">
                    <table className="w-full text-sm data-table">
                      <thead>
                        <tr className="border-b">
                          {Object.keys(filteredDataForView[0])
                            .filter((key) => key !== "id" && key !== "gid") // Remove ID columns
                            .map((key) => (
                              <th key={key} className="text-left p-3 font-medium bg-muted/50">
                                {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDataForView
                          .slice(currentPage * 20, (currentPage + 1) * 20)
                          .map((item: any, index: number) => (
                            <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                              {Object.entries(item)
                                .filter(([key]) => key !== "id" && key !== "gid") // Remove ID columns
                                .map(([key, value], idx) => (
                                  <td key={idx} className="p-3">
                                    {typeof value === "number" ? (
                                      <span className="font-mono">{value.toLocaleString()}</span>
                                    ) : (
                                      <span className="break-words">{String(value)}</span>
                                    )}
                                  </td>
                                ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredDataForView.length > 20 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {currentPage * 20 + 1} to {Math.min((currentPage + 1) * 20, filteredDataForView.length)}{" "}
                        of {filteredDataForView.length} records
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                          disabled={currentPage === 0}
                          size="sm"
                          variant="outline"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">
                          Page {currentPage + 1} of {Math.ceil(filteredDataForView.length / 20)}
                        </span>
                        <Button
                          onClick={() =>
                            setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredDataForView.length / 20) - 1))
                          }
                          disabled={currentPage === Math.ceil(filteredDataForView.length / 20) - 1}
                          size="sm"
                          variant="outline"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
                  <p className="text-gray-500">
                    {searchQuery
                      ? `No records match your search for "${searchQuery}". Try adjusting your search terms.`
                      : `No data available for ${getActiveDataForView.type} layer at ${activeMapLevel} level for ${selectedYear}.`}
                  </p>
                  {searchQuery && (
                    <Button onClick={() => setSearchQuery("")} variant="outline" size="sm" className="mt-4">
                      Clear Search
                    </Button>
                  )}
                </div>
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
  const [layerControlsProps, setLayerControlsProps] = useState<any>(null)

  return (
    <MainLayout
      title="Ministry of Agriculture - Ethiopia"
      subtitle="ግብርና ሚኒስቴር - ኢትዮጵያ "
      weatherControlsProps={weatherControlsProps}
      layerControlsProps={layerControlsProps}
    >
      <MapContent setWeatherControlsProps={setWeatherControlsProps} setLayerControlsProps={setLayerControlsProps} />
    </MainLayout>
  )
}
