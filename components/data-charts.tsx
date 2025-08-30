"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useMapSelection } from "@/components/main-layout"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts"
import {
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  TrendingUp,
  Download,
  ScanTextIcon as ScatterIcon,
  AreaChartIcon,
  Search,
  MapPin,
} from "lucide-react"

interface DataChartsProps {
  landData?: any[]
  cropProductionData?: any[]
  pestData?: any[]
  weatherData?: any[]
  activeDataLayers: string[]
  selectedYear: string
  className?: string
}

const chartTypes = [
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "line", label: "Line Chart", icon: LineChartIcon },
  { value: "area", label: "Area Chart", icon: AreaChartIcon },
  { value: "pie", label: "Pie Chart", icon: PieChartIcon },
  { value: "scatter", label: "Scatter Plot", icon: ScatterIcon },
]

const colors = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#8dd1e1",
  "#d084d0",
  "#ffb347",
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
]

export function DataCharts({
  landData = [],
  cropProductionData = [],
  pestData = [],
  weatherData = [],
  activeDataLayers,
  selectedYear,
  className,
}: DataChartsProps) {
  const { activeMapLevel } = useMapSelection()
  const [chartType, setChartType] = useState("bar")
  const [yAxes, setYAxes] = useState<string[]>([])
  const [filterYear, setFilterYear] = useState(selectedYear)
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [maxDisplayItems, setMaxDisplayItems] = useState(15)

  const availableData = useMemo(() => {
    console.log("[v0] Processing chart data for level:", activeMapLevel, "Active layers:", activeDataLayers)

    // Priority: Pest > Crop > Land > Weather (same as data view)
    if (activeDataLayers.includes("Pest Data") && pestData.length > 0) {
      console.log("[v0] Using pest data for charts:", pestData.length, "records")
      return pestData.map((item) => ({ ...item, dataType: "pest" }))
    }

    if (activeDataLayers.includes("Crop Production") && cropProductionData.length > 0) {
      console.log("[v0] Using crop production data for charts:", cropProductionData.length, "records")
      return cropProductionData.map((item) => ({ ...item, dataType: "crop" }))
    }

    if (activeDataLayers.includes("Land Data") && landData.length > 0) {
      console.log("[v0] Using land data for charts:", landData.length, "records")
      return landData.map((item) => ({ ...item, dataType: "land" }))
    }

    if (activeDataLayers.includes("Weather Data") && weatherData.length > 0) {
      console.log("[v0] Using weather data for charts:", weatherData.length, "records")
      return weatherData.map((item) => ({ ...item, dataType: "weather" }))
    }

    return []
  }, [activeDataLayers, landData, cropProductionData, pestData, weatherData, activeMapLevel])

  const xAxisField = useMemo(() => {
    switch (activeMapLevel) {
      case "region":
        return "adm1_en"
      case "zone":
        return "adm2_en"
      case "woreda":
        return "adm3_en"
      default:
        return "adm1_en"
    }
  }, [activeMapLevel])

  const availableFields = useMemo(() => {
    if (availableData.length === 0) return { numeric: [], administrative: [] }

    const sample = availableData[0]
    const numericFields = Object.keys(sample).filter(
      (key) =>
        key !== "id" &&
        key !== "gid" &&
        key !== "dataType" &&
        key !== "year" &&
        !key.includes("pcode") &&
        typeof sample[key] === "number",
    )

    const administrativeFields = Object.keys(sample).filter(
      (key) => key === "adm1_en" || key === "adm2_en" || key === "adm3_en",
    )

    console.log("[v0] Available numeric fields:", numericFields)
    console.log("[v0] Available administrative fields:", administrativeFields)

    return { numeric: numericFields, administrative: administrativeFields }
  }, [availableData])

  useEffect(() => {
    if (availableData.length === 0) return

    const dataType = availableData[0]?.dataType
    let defaultYAxes: string[] = []

    switch (dataType) {
      case "land":
        defaultYAxes = ["total_agri_land", "cultivated_land", "pasture_land", "forest_land"]
        break
      case "crop":
        defaultYAxes = ["teff_production_mt", "maize_production_mt", "wheat_production_mt", "barley_production_mt"]
        break
      case "pest":
        defaultYAxes = ["pest_incidence", "crop_damage", "treatment_coverage", "yield_loss"]
        break
      case "weather":
        defaultYAxes = [
          "avg_annual_max_temperature_c",
          "avg_annual_min_temperature_c",
          "avg_annual_precipitation_mm_day",
        ]
        break
    }

    // Filter to only include available fields and limit to 3
    const validYAxes = defaultYAxes.filter((axis) => availableFields.numeric.includes(axis)).slice(0, 3)
    setYAxes(validYAxes)
    console.log("[v0] Auto-selected Y axes:", validYAxes)
  }, [availableData, availableFields])

  const filteredAndLimitedData = useMemo(() => {
    let data = availableData

    // Filter by year if different from selected
    if (filterYear !== selectedYear) {
      data = data.filter((item) => String(item.year) === filterYear)
    }

    // Filter by search query
    if (searchQuery) {
      data = data.filter((item) => {
        const searchableValue = item[xAxisField]
        return searchableValue && String(searchableValue).toLowerCase().includes(searchQuery.toLowerCase())
      })
    }

    // Filter by selected regions (for zone/woreda levels)
    if (selectedRegions.length > 0) {
      if (activeMapLevel === "zone") {
        data = data.filter((item) => selectedRegions.includes(item.adm1_pcode))
      } else if (activeMapLevel === "woreda") {
        data = data.filter((item) => selectedRegions.includes(item.adm2_pcode))
      }
    }

    // Sort by the first Y-axis value for consistent ordering
    if (yAxes.length > 0) {
      data = data.sort((a, b) => {
        const aVal = a[yAxes[0]] || 0
        const bVal = b[yAxes[0]] || 0
        return bVal - aVal // Descending order
      })
    }

    // Limit display items for zone and woreda levels
    if (activeMapLevel === "zone" || activeMapLevel === "woreda") {
      data = data.slice(0, maxDisplayItems)
    }

    console.log("[v0] Filtered and limited data:", data.length, "records")
    return data
  }, [
    availableData,
    filterYear,
    selectedYear,
    searchQuery,
    selectedRegions,
    activeMapLevel,
    xAxisField,
    yAxes,
    maxDisplayItems,
  ])

  const availableParentRegions = useMemo(() => {
    if (activeMapLevel === "region") return []

    const parentField = activeMapLevel === "zone" ? "adm1_pcode" : "adm2_pcode"
    const parentNameField = activeMapLevel === "zone" ? "adm1_en" : "adm2_en"

    const uniqueParents = [
      ...new Set(
        availableData.map((item) => ({
          code: item[parentField],
          name: item[parentNameField],
        })),
      ),
    ]

    return uniqueParents.filter((parent) => parent.code && parent.name)
  }, [availableData, activeMapLevel])

  const chartData = useMemo(() => {
    return filteredAndLimitedData.map((item) => {
      const chartItem: any = {
        name: item[xAxisField] || `Unknown ${activeMapLevel}`,
        fullName: item[xAxisField] || `Unknown ${activeMapLevel}`,
      }

      yAxes.forEach((yAxis) => {
        chartItem[yAxis] = typeof item[yAxis] === "number" ? item[yAxis] : 0
      })

      return chartItem
    })
  }, [filteredAndLimitedData, xAxisField, yAxes, activeMapLevel])

  const pieData = useMemo(() => {
    if (yAxes.length === 0) return []

    const yAxis = yAxes[0]
    return filteredAndLimitedData
      .map((item, index) => ({
        name: item[xAxisField] || `Item ${index + 1}`,
        value: typeof item[yAxis] === "number" ? item[yAxis] : 0,
        fullName: item[xAxisField] || `Item ${index + 1}`,
      }))
      .slice(0, 10) // Limit to top 10 for readability
  }, [filteredAndLimitedData, yAxes, xAxisField])

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No data available for charting</p>
            <p className="text-sm">
              {availableData.length === 0
                ? "Enable a data layer to see charts"
                : "Try adjusting your filters or search criteria"}
            </p>
          </div>
        </div>
      )
    }

    const commonProps = {
      data: chartType === "pie" ? pieData : chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 },
    }

    // Enhanced tooltip with better formatting
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 border rounded-lg shadow-lg">
            <p className="font-semibold">{label}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
              </p>
            ))}
          </div>
        )
      }
      return null
    }

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {yAxes.map((yAxis, index) => (
                <Bar
                  key={yAxis}
                  dataKey={yAxis}
                  fill={colors[index % colors.length]}
                  name={yAxis.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {yAxes.map((yAxis, index) => (
                <Line
                  key={yAxis}
                  type="monotone"
                  dataKey={yAxis}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  name={yAxis.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {yAxes.map((yAxis, index) => (
                <Area
                  key={yAxis}
                  type="monotone"
                  dataKey={yAxis}
                  stackId="1"
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.6}
                  name={yAxis.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )

      case "scatter":
        if (yAxes.length < 2) {
          return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Scatter plot requires at least 2 Y-axis variables</p>
            </div>
          )
        }
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart {...commonProps}>
              <CartesianGrid />
              <XAxis dataKey={yAxes[0]} name={yAxes[0]} />
              <YAxis dataKey={yAxes[1]} name={yAxes[1]} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter name="Data Points" data={chartData} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const exportData = () => {
    const exportData = {
      metadata: {
        level: activeMapLevel,
        year: filterYear,
        dataType: availableData[0]?.dataType,
        totalRecords: chartData.length,
        yAxes: yAxes,
        exportDate: new Date().toISOString(),
      },
      data: chartData,
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `chart-data-${activeMapLevel}-${filterYear}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (activeDataLayers.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Data Layers Active</h3>
          <p className="text-muted-foreground">
            Enable data layers from the sidebar to view interactive charts and visualizations.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Data Visualization - {activeMapLevel.charAt(0).toUpperCase() + activeMapLevel.slice(1)} Level</span>
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {activeDataLayers.map((layer) => (
                <Badge key={layer} variant="secondary" className="text-xs">
                  {layer}
                </Badge>
              ))}
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {chartData.length} {activeMapLevel}s
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={exportData} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="settings">Chart Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            {/* Chart Type Selector */}
            <div className="flex flex-wrap gap-2">
              {chartTypes.map((type) => {
                const Icon = type.icon
                return (
                  <Button
                    key={type.value}
                    variant={chartType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType(type.value)}
                    className="flex items-center space-x-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{type.label}</span>
                  </Button>
                )
              })}
            </div>

            {/* Chart */}
            <div className="border rounded-lg p-4 bg-white">{renderChart()}</div>

            {/* Data Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{chartData.length}</div>
                <div className="text-sm text-blue-600">
                  {activeMapLevel.charAt(0).toUpperCase() + activeMapLevel.slice(1)}s
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{availableParentRegions.length || "N/A"}</div>
                <div className="text-sm text-green-600">Parent Regions</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{yAxes.length}</div>
                <div className="text-sm text-orange-600">Variables</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{filterYear}</div>
                <div className="text-sm text-purple-600">Year</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Year Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Filter by Year</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["2020", "2021", "2022", "2023", "2024"].map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Search {activeMapLevel.charAt(0).toUpperCase() + activeMapLevel.slice(1)}s
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={`Search ${activeMapLevel}s...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Parent Region Filter (for zone/woreda) */}
              {availableParentRegions.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Filter by {activeMapLevel === "zone" ? "Region" : "Zone"}
                  </Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                    {availableParentRegions.map((parent) => (
                      <div key={parent.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={parent.code}
                          checked={selectedRegions.includes(parent.code)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRegions([...selectedRegions, parent.code])
                            } else {
                              setSelectedRegions(selectedRegions.filter((code) => code !== parent.code))
                            }
                          }}
                        />
                        <Label htmlFor={parent.code} className="text-sm">
                          {parent.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Display Limit (for zone/woreda) */}
              {(activeMapLevel === "zone" || activeMapLevel === "woreda") && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Max Display Items</Label>
                  <Select value={String(maxDisplayItems)} onValueChange={(value) => setMaxDisplayItems(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Y-Axes Selection */}
              <div className="space-y-3 md:col-span-2">
                <Label className="text-sm font-medium">Y-Axes Variables (Select up to 5)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded p-3">
                  {availableFields.numeric.map((field) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={field}
                        checked={yAxes.includes(field)}
                        onCheckedChange={(checked) => {
                          if (checked && yAxes.length < 5) {
                            setYAxes([...yAxes, field])
                          } else if (!checked) {
                            setYAxes(yAxes.filter((axis) => axis !== field))
                          }
                        }}
                      />
                      <Label htmlFor={field} className="text-sm">
                        {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">Selected: {yAxes.length}/5 variables</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
