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
import { Download, Search, MapPin, Filter, ImageIcon } from "lucide-react"
import { ResponsiveBar } from '@nivo/bar'
import { ResponsiveLine } from '@nivo/line'
import { ResponsivePie } from '@nivo/pie'
import { ResponsiveScatterPlot } from '@nivo/scatterplot'
// import { ResponsiveArea } from '@nivo/area'

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
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "scatter", label: "Scatter Plot" },
  // { value: "area", label: "Area Chart" },
  { value: "clustered", label: "Clustered Bar" },
]

const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']

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
  const [selectedZones, setSelectedZones] = useState<string[]>([])
  const [selectedWoredas, setSelectedWoredas] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [maxDisplayItems, setMaxDisplayItems] = useState(14)

  // Get all available years from data
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    
    // Add years from all data sources
    landData.forEach(item => years.add(String(item.year)))
    cropProductionData.forEach(item => years.add(String(item.year)))
    pestData.forEach(item => years.add(String(item.year)))
    weatherData.forEach(item => years.add(String(item.year)))
    
    return Array.from(years).sort().reverse()
  }, [landData, cropProductionData, pestData, weatherData])

  // Determine which data to use based on active layers
  const availableData = useMemo(() => {
    // Priority: Pest > Crop > Land > Weather
    if (activeDataLayers.includes("Pest Data") && pestData.length > 0) {
      return pestData.map((item) => ({ ...item, dataType: "pest" }))
    }

    if (activeDataLayers.includes("Crop Production") && cropProductionData.length > 0) {
      return cropProductionData.map((item) => ({ ...item, dataType: "crop" }))
    }

    if (activeDataLayers.includes("Land Data") && landData.length > 0) {
      return landData.map((item) => ({ ...item, dataType: "land" }))
    }

    if (activeDataLayers.includes("Weather Data") && weatherData.length > 0) {
      return weatherData.map((item) => ({ ...item, dataType: "weather" }))
    }

    return []
  }, [activeDataLayers, landData, cropProductionData, pestData, weatherData])

  // Get X-axis field based on map level
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

  // Get parent field for filtering
  const parentField = useMemo(() => {
    switch (activeMapLevel) {
      case "zone":
        return "adm1_pcode"
      case "woreda":
        return "adm2_pcode"
      default:
        return ""
    }
  }, [activeMapLevel])

  // Get available fields for Y-axis
  const availableFields = useMemo(() => {
    if (availableData.length === 0) return []

    const sample = availableData[0]
    const dataType = sample.dataType
    
    // Define available fields based on data type
    let fields: string[] = []
    
    switch (dataType) {
      case "weather":
        fields = ["avg_annual_min_temperature_c", "avg_annual_max_temperature_c", "avg_annual_precipitation_mm_day"]
        break
      case "land":
        fields = ["harvested_land", "sowed_land", "plowed_area", "total_agri_land"]
        break
      case "crop":
        fields = ["barley_production_mt", "wheat_production_mt", "maize_production_mt", "teff_production_mt"]
        break
      case "pest":
        fields = ["pest_control_cost_etb", "crop_loss_tons", "affected_area_ha", "pest_incidence"]
        break
    }
    
    // Filter to only include fields that exist in the data
    return fields.filter(field => field in sample)
  }, [availableData])

  // Get unique regions/zones/woredas for selection
  const availableItems = useMemo(() => {
    if (availableData.length === 0) return []
    
    const uniqueItems = new Map()
    
    availableData.forEach(item => {
      const key = item[xAxisField]
      const code = item[parentField] || item.adm1_pcode || item.adm2_pcode || item.adm3_pcode
      if (key && !uniqueItems.has(key)) {
        uniqueItems.set(key, {
          name: key,
          code: code || key,
          parent: item.adm1_en || item.adm2_en || ""
        })
      }
    })
    
    return Array.from(uniqueItems.values())
  }, [availableData, xAxisField, parentField])

  // Filter available items based on search query
  const filteredAvailableItems = useMemo(() => {
    if (!searchQuery) return availableItems
    
    return availableItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.parent && item.parent.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [availableItems, searchQuery])

  // Get parent regions for zone/woreda filtering
  const availableParentRegions = useMemo(() => {
    if (activeMapLevel === "region") return []
    
    const uniqueRegions = new Map()
    
    availableData.forEach(item => {
      if (item.adm1_en && item.adm1_pcode) {
        uniqueRegions.set(item.adm1_pcode, {
          code: item.adm1_pcode,
          name: item.adm1_en
        })
      }
    })
    
    return Array.from(uniqueRegions.values())
  }, [availableData, activeMapLevel])

  // Auto-select Y-axes when data changes
  useEffect(() => {
    if (availableFields.length > 0 && yAxes.length === 0) {
      // Select first 3 available fields by default
      setYAxes(availableFields.slice(0, 3))
    }
  }, [availableFields, yAxes.length])

  // Filter and prepare data for charts
  const chartData = useMemo(() => {
    if (availableData.length === 0) return []
    
    // Filter by year
    let data = availableData.filter(item => String(item.year) === filterYear)
    
    // Filter by selected items (regions/zones/woredas)
    let selectedItems: string[] = []
    if (activeMapLevel === "region") selectedItems = selectedRegions
    if (activeMapLevel === "zone") selectedItems = selectedZones
    if (activeMapLevel === "woreda") selectedItems = selectedWoredas
    
    if (selectedItems.length > 0) {
      data = data.filter(item => selectedItems.includes(item[xAxisField]))
    }
    
    // Limit display items
    if (activeMapLevel !== "region") {
      data = data.slice(0, maxDisplayItems)
    }
    
    // Group by xAxisField and aggregate Y-axis values
    const groupedData = new Map()
    
    data.forEach(item => {
      const key = item[xAxisField]
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          id: key,
          ...Object.fromEntries(yAxes.map(yAxis => [yAxis, 0]))
        })
      }
      
      const group = groupedData.get(key)
      yAxes.forEach(yAxis => {
        if (item[yAxis] !== undefined && item[yAxis] !== null) {
          // Extract numeric value from strings like "25°C" or "100 mm"
          let value = item[yAxis]
          if (typeof value === 'string') {
            const numericMatch = value.match(/([\d.]+)/)
            if (numericMatch) {
              value = parseFloat(numericMatch[1])
            } else {
              value = parseFloat(value) || 0
            }
          }
          group[yAxis] += Number(value)
        }
      })
    })
    
    return Array.from(groupedData.values())
  }, [
    availableData, 
    filterYear, 
    activeMapLevel, 
    selectedRegions, 
    selectedZones, 
    selectedWoredas, 
    xAxisField, 
    yAxes, 
    maxDisplayItems
  ])

  // Prepare data for pie chart (uses first Y-axis only)
  const pieData = useMemo(() => {
    if (yAxes.length === 0 || chartData.length === 0) return []
    
    const yAxis = yAxes[0]
    return chartData
      .map(item => ({
        id: item.id,
        label: item.id,
        value: item[yAxis] || 0
      }))
      .sort((a, b) => b.value - a.value) // Sort descending
  }, [chartData, yAxes])

  // Prepare data for scatter plot (uses first two Y-axes)
  const scatterData = useMemo(() => {
    if (yAxes.length < 2 || chartData.length === 0) return []
    
    return [
      {
        id: "Data Points",
        data: chartData.map(item => ({
          x: item[yAxes[0]] || 0,
          y: item[yAxes[1]] || 0,
          name: item.id
        }))
      }
    ]
  }, [chartData, yAxes])

  // Prepare data for area chart
  const areaData = useMemo(() => {
    if (yAxes.length === 0 || chartData.length === 0) return []
    
    return yAxes.map((yAxis, i) => ({
      id: yAxis,
      data: chartData.map((item, index) => ({
        x: item.id,
        y: item[yAxis] || 0
      }))
    }))
  }, [chartData, yAxes])

  // Get measurement unit for tooltips
  const getMeasurementUnit = (field: string) => {
    if (field.includes('temperature')) return '°C'
    if (field.includes('precipitation')) return 'mm'
    if (field.includes('_mt')) return 'MT'
    if (field.includes('_ha')) return 'ha'
    if (field.includes('_etb')) return 'ETB'
    if (field.includes('_tons')) return 'tons'
    if (field.includes('_land') || field.includes('_area')) return 'ha'
    if (field.includes('incidence')) return '%'
    return ''
  }

  // Export chart as image
  const exportChartAsImage = () => {
    const chartElement = document.querySelector('.nivo-chart-container')
    if (!chartElement) return

    // Create a canvas element
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = chartElement.clientWidth
    canvas.height = chartElement.clientHeight

    // Draw the chart onto the canvas
    const svgElement = chartElement.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = function () {
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      // Create download link
      const link = document.createElement('a')
      link.download = `chart-${activeMapLevel}-${filterYear}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    img.src = url
  }

  // Render appropriate chart based on type
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
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

    switch (chartType) {
      case "bar":
        return (
          <div className="h-96">
            <ResponsiveBar
              data={chartData}
              keys={yAxes}
              indexBy="id"
              margin={{ top: 50, right: 130, bottom: 100, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={colors}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: activeMapLevel.charAt(0).toUpperCase() + activeMapLevel.slice(1),
                legendPosition: 'middle',
                legendOffset: 80
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Value',
                legendPosition: 'middle',
                legendOffset: -40
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              tooltip={({ id, value, color }) => (
                <div style={{ padding: '12px', color, background: '#fff', border: '1px solid #ccc' }}>
                  <strong>{id}</strong>: {value} {getMeasurementUnit(id as string)}
                </div>
              )}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20,
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
              animate={true}
            />
          </div>
        )

      case "clustered":
        return (
          <div className="h-96">
            <ResponsiveBar
              data={chartData}
              keys={yAxes}
              indexBy="id"
              margin={{ top: 50, right: 130, bottom: 100, left: 60 }}
              padding={0.1}
              groupMode="grouped"
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={colors}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: activeMapLevel.charAt(0).toUpperCase() + activeMapLevel.slice(1),
                legendPosition: 'middle',
                legendOffset: 80
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Value',
                legendPosition: 'middle',
                legendOffset: -40
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              tooltip={({ id, value, color, indexValue }) => (
                <div style={{ padding: '12px', color, background: '#fff', border: '1px solid #ccc' }}>
                  <strong>{indexValue}</strong> - <strong>{id}</strong>: {value} {getMeasurementUnit(id as string)}
                </div>
              )}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20,
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
              animate={true}
            />
          </div>
        )

      case "line":
        return (
          <div className="h-96">
            <ResponsiveLine
              data={yAxes.map((yAxis, i) => ({
                id: yAxis,
                color: colors[i % colors.length],
                data: chartData.map(item => ({
                  x: item.id,
                  y: item[yAxis] || 0
                }))
              }))}
              margin={{ top: 50, right: 110, bottom: 100, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
              curve="linear"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: activeMapLevel.charAt(0).toUpperCase() + activeMapLevel.slice(1),
                legendPosition: 'middle',
                legendOffset: 80
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Value',
                legendPosition: 'middle',
                legendOffset: -40
              }}
              colors={colors}
              pointSize={10}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              enableArea={false}
              useMesh={true}
              tooltip={({ point }) => (
                <div style={{ padding: '12px', background: '#fff', border: '1px solid #ccc' }}>
                  <strong>{point.data.xFormatted}</strong>: {point.data.yFormatted} {getMeasurementUnit(point.seriesId)}
                </div>
              )}
              legends={[
                {
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 100,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemWidth: 80,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: 'circle',
                  symbolBorderColor: 'rgba(0, 0, 0, .5)',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemBackground: 'rgba(0, 0, 0, .03)',
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
            />
          </div>
        )

      case "pie":
        return (
          <div className="h-96">
            <ResponsivePie
              data={pieData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={colors}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              tooltip={({ datum }) => (
                <div style={{ padding: '12px', background: '#fff', border: '1px solid #ccc' }}>
                  <strong>{datum.label}</strong>: {datum.value} {getMeasurementUnit(yAxes[0])}
                </div>
              )}
              defs={[
                {
                  id: 'dots',
                  type: 'patternDots',
                  background: 'inherit',
                  color: 'rgba(255, 255, 255, 0.3)',
                  size: 4,
                  padding: 1,
                  stagger: true
                },
                {
                  id: 'lines',
                  type: 'patternLines',
                  background: 'inherit',
                  color: 'rgba(255, 255, 255, 0.3)',
                  rotation: -45,
                  lineWidth: 6,
                  spacing: 10
                }
              ]}
              fill={[
                { match: { id: 'ruby' }, id: 'dots' },
                { match: { id: 'c' }, id: 'dots' },
                { match: { id: 'go' }, id: 'lines' },
                { match: { id: 'python' }, id: 'lines' },
                { match: { id: 'scala' }, id: 'lines' },
                { match: { id: 'lisp' }, id: 'lines' },
                { match: { id: 'elixir' }, id: 'lines' },
                { match: { id: 'javascript' }, id: 'lines' }
              ]}
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: 56,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: '#999',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemTextColor: '#000'
                      }
                    }
                  ]
                }
              ]}
            />
          </div>
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
          <div className="h-96">
            <ResponsiveScatterPlot
              data={scatterData}
              margin={{ top: 60, right: 140, bottom: 70, left: 90 }}
              xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
              blendMode="multiply"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: yAxes[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                legendPosition: 'middle',
                legendOffset: 46
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: yAxes[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                legendPosition: 'middle',
                legendOffset: -60
              }}
              colors={colors}
              nodeSize={9}
              useMesh={true}
              tooltip={({ node }) => (
                <div style={{ padding: '12px', background: '#fff', border: '1px solid #ccc' }}>
                  <strong>{node.data.name}</strong><br />
                  {yAxes[0]}: {node.data.x} {getMeasurementUnit(yAxes[0])}<br />
                  {yAxes[1]}: {node.data.y} {getMeasurementUnit(yAxes[1])}
                </div>
              )}
              legends={[
                {
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 130,
                  translateY: 0,
                  itemWidth: 100,
                  itemHeight: 12,
                  itemsSpacing: 5,
                  itemDirection: 'left-to-right',
                  symbolSize: 12,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
            />
          </div>
        )


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
              Export Data
            </Button>
            {/* <Button onClick={exportChartAsImage} size="sm" variant="outline">
              <ImageIcon className="h-4 w-4 mr-1" />
              Export Image
            </Button> */}
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
              {chartTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={chartType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType(type.value)}
                >
                  {type.label}
                </Button>
              ))}
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
                <div className="text-2xl font-bold text-green-600">{availableItems.length || "N/A"}</div>
                <div className="text-sm text-green-600">Available Items</div>
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
                    {availableYears.map((year) => (
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

              {/* Item Selection (regions/zones/woredas) */}
              {filteredAvailableItems.length > 0 && (
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-sm font-medium">
                    Select {activeMapLevel}s to Display (Max {maxDisplayItems})
                  </Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                    {filteredAvailableItems.map((item) => (
                      <div key={`${item.code}-${item.name}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`item-${item.code}`}
                          checked={
                            activeMapLevel === "region" 
                              ? selectedRegions.includes(item.name)
                              : activeMapLevel === "zone"
                                ? selectedZones.includes(item.name)
                                : selectedWoredas.includes(item.name)
                          }
                          onCheckedChange={(checked) => {
                            if (activeMapLevel === "region") {
                              if (checked && selectedRegions.length < maxDisplayItems) {
                                setSelectedRegions([...selectedRegions, item.name])
                              } else if (!checked) {
                                setSelectedRegions(selectedRegions.filter((name) => name !== item.name))
                              }
                            } else if (activeMapLevel === "zone") {
                              if (checked && selectedZones.length < maxDisplayItems) {
                                setSelectedZones([...selectedZones, item.name])
                              } else if (!checked) {
                                setSelectedZones(selectedZones.filter((name) => name !== item.name))
                              }
                            } else if (activeMapLevel === "woreda") {
                              if (checked && selectedWoredas.length < maxDisplayItems) {
                                setSelectedWoredas([...selectedWoredas, item.name])
                              } else if (!checked) {
                                setSelectedWoredas(selectedWoredas.filter((name) => name !== item.name))
                              }
                            }
                          }}
                        />
                        <Label htmlFor={`item-${item.code}`} className="text-sm">
                          {item.name}
                          {item.parent && <span className="text-muted-foreground ml-1">({item.parent})</span>}
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
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="14">14</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Y-Axis Selection */}
              {availableFields.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Y-Axis Variables</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                    {availableFields.map((field) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${field}`}
                          checked={yAxes.includes(field)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setYAxes([...yAxes, field])
                            } else {
                              setYAxes(yAxes.filter((y) => y !== field))
                            }
                          }}
                        />
                        <Label htmlFor={`field-${field}`} className="text-sm">
                          {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}