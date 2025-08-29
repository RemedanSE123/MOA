"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp, Filter, Download, RefreshCw, ChartScatter as ScatterIcon, AreaChart as AreaChartIcon } from "lucide-react"

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

const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", "#d084d0", "#ffb347"]

export function DataCharts({
  landData = [],
  cropProductionData = [],
  pestData = [],
  weatherData = [],
  activeDataLayers,
  selectedYear,
  className,
}: DataChartsProps) {
  const [chartType, setChartType] = useState("bar")
  const [xAxis, setXAxis] = useState("adm1_en")
  const [yAxes, setYAxes] = useState<string[]>([])
  const [filterRegion, setFilterRegion] = useState("all")
  const [autoMode, setAutoMode] = useState(true)

  // Get available data based on active layers
  const availableData = useMemo(() => {
    const data: any[] = []
    
    if (activeDataLayers.includes("Land Data") && landData.length > 0) {
      return landData.map(item => ({ ...item, dataType: "land" }))
    }
    
    if (activeDataLayers.includes("Crop Production") && cropProductionData.length > 0) {
      return cropProductionData.map(item => ({ ...item, dataType: "crop" }))
    }
    
    if (activeDataLayers.includes("Pest Data") && pestData.length > 0) {
      return pestData.map(item => ({ ...item, dataType: "pest" }))
    }
    
    if (activeDataLayers.includes("Weather Data") && weatherData.length > 0) {
      return weatherData.map(item => ({ ...item, dataType: "weather" }))
    }
    
    return data
  }, [activeDataLayers, landData, cropProductionData, pestData, weatherData])

  // Get available fields for axes
  const availableFields = useMemo(() => {
    if (availableData.length === 0) return []
    
    const sample = availableData[0]
    return Object.keys(sample).filter(key => 
      key !== 'id' && 
      key !== 'dataType' && 
      key !== 'adm1_pcode' && 
      key !== 'adm2_pcode' &&
      typeof sample[key] === 'number' || key === 'adm1_en' || key === 'adm2_en'
    )
  }, [availableData])

  // Auto-select appropriate Y axes based on data type
  useMemo(() => {
    if (!autoMode || availableData.length === 0) return

    const dataType = availableData[0]?.dataType
    let defaultYAxes: string[] = []

    switch (dataType) {
      case "land":
        defaultYAxes = ["total_agri_land", "plowed_area", "sowed_land"]
        break
      case "crop":
        defaultYAxes = ["teff_production_mt", "maize_production_mt", "wheat_production_mt"]
        break
      case "pest":
        defaultYAxes = ["pest_incidence", "affected_area_ha", "crop_loss_tons"]
        break
      case "weather":
        defaultYAxes = ["avg_annual_max_temperature_c", "avg_annual_min_temperature_c", "avg_annual_precipitation_mm_day"]
        break
    }

    // Filter to only include available fields
    const validYAxes = defaultYAxes.filter(axis => availableFields.includes(axis))
    setYAxes(validYAxes.slice(0, 3)) // Limit to 3 for readability
  }, [availableData, availableFields, autoMode])

  // Filter data based on region selection
  const filteredData = useMemo(() => {
    if (filterRegion === "all") return availableData
    return availableData.filter(item => item.adm1_pcode === filterRegion)
  }, [availableData, filterRegion])

  // Get unique regions for filter
  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(availableData.map(item => ({ 
      code: item.adm1_pcode, 
      name: item.adm1_en 
    })))]
    return uniqueRegions.filter(region => region.code && region.name)
  }, [availableData])

  // Prepare chart data
  const chartData = useMemo(() => {
    return filteredData.map(item => {
      const chartItem: any = { name: item[xAxis] || item.adm1_en }
      yAxes.forEach(yAxis => {
        chartItem[yAxis] = typeof item[yAxis] === 'number' ? item[yAxis] : 0
      })
      return chartItem
    })
  }, [filteredData, xAxis, yAxes])

  // Prepare pie chart data
  const pieData = useMemo(() => {
    if (yAxes.length === 0) return []
    
    const yAxis = yAxes[0]
    return filteredData.map((item, index) => ({
      name: item.adm1_en || `Item ${index + 1}`,
      value: typeof item[yAxis] === 'number' ? item[yAxis] : 0,
    })).slice(0, 10) // Limit to top 10 for readability
  }, [filteredData, yAxes])

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No data available for charting</p>
            <p className="text-sm">Enable a data layer to see charts</p>
          </div>
        </div>
      )
    }

    const commonProps = {
      data: chartType === "pie" ? pieData : chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    }

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              {yAxes.map((yAxis, index) => (
                <Bar
                  key={yAxis}
                  dataKey={yAxis}
                  fill={colors[index % colors.length]}
                  name={yAxis.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
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
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              {yAxes.map((yAxis, index) => (
                <Line
                  key={yAxis}
                  type="monotone"
                  dataKey={yAxis}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  name={yAxis.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
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
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
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
                  name={yAxis.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
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
              <Tooltip />
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
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                name="Data Points"
                data={chartData}
                fill={colors[0]}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const exportData = () => {
    const dataStr = JSON.stringify(chartData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chart-data-${selectedYear}.json`
    link.click()
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
              <span>Data Visualization</span>
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {activeDataLayers.map(layer => (
                <Badge key={layer} variant="secondary" className="text-xs">
                  {layer}
                </Badge>
              ))}
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
              {chartTypes.map(type => {
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
            <div className="border rounded-lg p-4 bg-white">
              {renderChart()}
            </div>

            {/* Data Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{filteredData.length}</div>
                <div className="text-sm text-blue-600">Data Points</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{regions.length}</div>
                <div className="text-sm text-green-600">Regions</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{yAxes.length}</div>
                <div className="text-sm text-orange-600">Variables</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{selectedYear}</div>
                <div className="text-sm text-purple-600">Year</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Auto/Manual Mode */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Chart Configuration</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={autoMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoMode(true)}
                  >
                    Auto
                  </Button>
                  <Button
                    variant={!autoMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoMode(false)}
                  >
                    Manual
                  </Button>
                </div>
              </div>

              {/* Region Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter by Region</span>
                </Label>
                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions.map(region => (
                      <SelectItem key={region.code} value={region.code}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!autoMode && (
                <>
                  {/* X-Axis Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">X-Axis</Label>
                    <Select value={xAxis} onValueChange={setXAxis}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.filter(field => 
                          field === 'adm1_en' || field === 'adm2_en'
                        ).map(field => (
                          <SelectItem key={field} value={field}>
                            {field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Y-Axes Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Y-Axes (Select up to 3)</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableFields.filter(field => 
                        typeof availableData[0]?.[field] === 'number'
                      ).map(field => (
                        <div key={field} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={field}
                            checked={yAxes.includes(field)}
                            onChange={(e) => {
                              if (e.target.checked && yAxes.length < 3) {
                                setYAxes([...yAxes, field])
                              } else if (!e.target.checked) {
                                setYAxes(yAxes.filter(axis => axis !== field))
                              }
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={field} className="text-sm">
                            {field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}