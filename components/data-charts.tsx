"use client"

import { useState, useMemo, useEffect, useRef } from "react"
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
  // { value: "scatter", label: "Scatter Plot" },
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
  const [imageFormat, setImageFormat] = useState<"png" | "jpg">("png")
  const [exportError, setExportError] = useState<string | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

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

  // Prepare data for pie chart (one pie per Y-axis)
  const pieData = useMemo(() => {
    if (yAxes.length === 0 || chartData.length === 0) return []
    
    return yAxes.map((yAxis, index) => ({
      id: yAxis,
      label: yAxis.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      data: chartData
        .map(item => ({
          id: item.id,
          label: item.id,
          value: item[yAxis] || 0
        }))
        .sort((a, b) => b.value - a.value) // Sort descending
    }))
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

  // Format field name for display
  const formatFieldName = (field: string) => {
    return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Format Y-axis values with units
  const formatYAxisValue = (value: number, field: string) => {
    const unit = getMeasurementUnit(field)
    return `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`
  }

  // Export chart as image - UPDATED implementation with better error handling
  const exportChartAsImage = async () => {
    setExportError(null);
    
    if (!chartContainerRef.current) {
      setExportError("Chart container not found");
      return;
    }
    
    const svgElement = chartContainerRef.current.querySelector('svg');
    if (!svgElement) {
      setExportError("SVG element not found in chart container");
      return;
    }
    
    try {
      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Ensure the SVG has proper dimensions
      const svgWidth = clonedSvg.getAttribute('width') || clonedSvg.getBoundingClientRect().width;
      const svgHeight = clonedSvg.getAttribute('height') || clonedSvg.getBoundingClientRect().height;
      
      if (!svgWidth || !svgHeight || svgWidth === "0" || svgHeight === "0") {
        setExportError("SVG has invalid dimensions");
        return;
      }
      
      // Set explicit width and height if not already set
      clonedSvg.setAttribute('width', svgWidth.toString());
      clonedSvg.setAttribute('height', svgHeight.toString());
      
      // Serialize SVG to string
      const svgString = new XMLSerializer().serializeToString(clonedSvg);
      
      // Create a Blob from the SVG string
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create an image element to load the SVG
      const img = new Image();
      
      // Wait for the image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load SVG as image"));
        img.src = svgUrl;
      });
      
      // Create a canvas with the same dimensions as the SVG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw white background first
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `chart-${activeMapLevel}-${filterYear}.${imageFormat}`;
      link.href = canvas.toDataURL(`image/${imageFormat}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(svgUrl);
    } catch (error) {
      console.error('Error exporting chart as image:', error);
      setExportError(`Failed to export chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const CustomTooltip = ({ id, value, color, indexValue, serieId }: any) => {
    const displayName = formatFieldName(serieId || id);
    const displayValue = value.toLocaleString();
    const unit = getMeasurementUnit(serieId || id);
    
    return (
      <div style={{ 
        padding: '10px 12px', 
        background: '#fff', 
        border: '1px solid #ccc', 
        borderRadius: '4px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          backgroundColor: color,
          borderRadius: '2px',
          flexShrink: 0
        }}></div>
        <div style={{ color, fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
          {indexValue}:
        </div>
        <div style={{ flexShrink: 0 }}>
          <span style={{ color: '#555' }}>{displayName}</span>
        </div>
        <div style={{ fontWeight: 'bold', color: '#000', flexShrink: 0 }}>
          {displayValue}
          {unit && <span style={{ marginLeft: '2px', fontWeight: 'normal' }}>{unit}</span>}
        </div>
      </div>
    )
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
          <div className="h-96" ref={chartContainerRef}>
            <ResponsiveBar
              data={chartData}
              keys={yAxes}
              indexBy="id"
              margin={{ top: 50, right: 130, bottom: 100, left: 80 }}
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
                // legend: 'Value',
                legendPosition: 'middle',
                legendOffset: -50,
                format: value => formatYAxisValue(value, yAxes[0])
              }}
              enableLabel={false}
              labelSkipWidth={12}
              labelSkipHeight={12}
              tooltip={({ id, value, color, indexValue }) => (
                <CustomTooltip id={id} value={value} color={color} indexValue={indexValue} serieId={id} />
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
              theme={{
                axis: {
                  ticks: {
                    text: {
                      fontSize: 12,
                      fill: '#555'
                    }
                  },
                  legend: {
                    text: {
                      fontSize: 14,
                      fontWeight: 'bold',
                      fill: '#333'
                    }
                  }
                },
                tooltip: {
                  container: {
                    background: '#fff',
                    color: '#333',
                    fontSize: '14px',
                    borderRadius: '4px',
                    boxShadow: '0 3px 9px rgba(0, 0, 0, 0.15)'
                  }
                }
              }}
            />
          </div>
        )

      case "clustered":
        return (
          <div className="h-96" ref={chartContainerRef}>
            <ResponsiveBar
              data={chartData}
              keys={yAxes}
              indexBy="id"
              margin={{ top: 50, right: 130, bottom: 100, left: 80 }}
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
                // legend: 'Value',
                legendPosition: 'middle',
                legendOffset: -50,
                format: value => formatYAxisValue(value, yAxes[0])
              }}
              enableLabel={false}
              labelSkipWidth={12}
              labelSkipHeight={12}
              tooltip={({ id, value, color, indexValue }) => (
                <CustomTooltip id={id} value={value} color={color} indexValue={indexValue} serieId={id} />
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
              theme={{
                axis: {
                  ticks: {
                    text: {
                      fontSize: 12,
                      fill: '#555'
                    }
                  },
                  legend: {
                    text: {
                      fontSize: 14,
                      fontWeight: 'bold',
                      fill: '#333'
                    }
                  }
                }
              }}
            />
          </div>
        )

      case "line":
        return (
          <div className="h-96" ref={chartContainerRef}>
            <ResponsiveLine
              data={yAxes.map((yAxis, i) => ({
                id: yAxis,
                color: colors[i % colors.length],
                data: chartData.map(item => ({
                  x: item.id,
                  y: item[yAxis] || 0
                }))
              }))}
              margin={{ top: 50, right: 110, bottom: 100, left: 80 }}
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
                // legend: 'Value',
                legendPosition: 'middle',
                legendOffset: -50,
                format: value => formatYAxisValue(value, yAxes[0])
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
                <CustomTooltip 
                  id={point.seriesId} 
                  value={point.data.y} 
                  color={point.seriesColor} 
                  indexValue={point.data.xFormatted} 
                  serieId={point.seriesId} 
                />
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
              theme={{
                axis: {
                  ticks: {
                    text: {
                      fontSize: 12,
                      fill: '#555'
                    }
                  },
                  legend: {
                    text: {
                      fontSize: 14,
                      fontWeight: 'bold',
                      fill: '#333'
                    }
                  }
                }
              }}
            />
          </div>
        )

      case "pie":
        return (
          <div className={`h-96 grid ${pieData.length === 1 ? 'grid-cols-1' : pieData.length === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-4`} ref={chartContainerRef}>
            {pieData.map((pie, index) => (
              <div key={pie.id} className="relative h-full">
                <ResponsivePie
                  data={pie.data}
                  margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
                  innerRadius={0.5}
                  padAngle={1}
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
                  arcLabelsTextColor="#fff"
                  arcLabelsComponent={({ datum, label }) => (
                    <g>
                      {/* <text
                        // textAnchor="middle"
                        // dominantBaseline="central"
                        // style={{
                        //   fontSize: '10px',
                        //   fontWeight: 'bold',
                        //   fill: '#fff',
                        //   textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                        // }}
                      >
                        {Math.round(datum.value)}
                      </text> */}
                    </g>
                  )}
                  tooltip={({ datum }) => (
                    <CustomTooltip 
                      id={pie.id} 
                      value={datum.value} 
                      color={datum.color} 
                      indexValue={datum.label} 
                      serieId={pie.id} 
                    />
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
                  // legends={[
                  //   {
                  //     anchor: 'bottom',
                  //     direction: 'row',
                  //     justify: false,
                  //     translateX: 0,
                  //     translateY: 40,
                  //     itemsSpacing: 0,
                  //     itemWidth: 80,
                  //     itemHeight: 18,
                  //     itemTextColor: '#999',
                  //     itemDirection: 'left-to-right',
                  //     itemOpacity: 1,
                  //     symbolSize: 14,
                  //     symbolShape: 'circle',
                  //     effects: [
                  //       {
                  //         on: 'hover',
                  //         style: {
                  //           itemTextColor: '#000'
                  //         }
                  //       }
                  //     ]
                  //   }
                  // ]}
                  theme={{
                    tooltip: {
                      container: {
                        background: '#fff',
                        color: '#333',
                        fontSize: '14px',
                        borderRadius: '4px',
                        boxShadow: '0 3px 9px rgba(0, 0, 0, 0.15)'
                      }
                    }
                  }}
                />
                <div className="absolute top-0 left-0 right-0 text-center font-semibold text-sm text-gray-700 bg-white/80 py-1">
                  {pie.label}
                </div>
              </div>
            ))}
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
          <div className="h-96" ref={chartContainerRef}>
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
                legend: formatFieldName(yAxes[0]),
                legendPosition: 'middle',
                legendOffset: 46,
                format: value => formatYAxisValue(value, yAxes[0])
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: formatFieldName(yAxes[1]),
                legendPosition: 'middle',
                legendOffset: -60,
                format: value => formatYAxisValue(value, yAxes[1])
              }}
              colors={colors}
              nodeSize={9}
              useMesh={true}
              tooltip={({ node }) => (
                <div style={{ 
                  padding: '12px', 
                  background: '#fff', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <div style={{ color: node.color, fontWeight: 'bold', marginBottom: '6px', fontSize: '15px' }}>
                    {node.data.name}
                  </div>
                  <div>
                    <span style={{ color: '#555' }}>
                      {formatFieldName(yAxes[0])}: 
                    </span>{' '}
                    <span style={{ fontWeight: 'bold', color: '#000' }}>
                      {node.data.x.toLocaleString()} {getMeasurementUnit(yAxes[0])}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#555' }}>
                      {formatFieldName(yAxes[1])}: 
                    </span>{' '}
                    <span style={{ fontWeight: 'bold', color: '#000' }}>
                      {node.data.y.toLocaleString()} {getMeasurementUnit(yAxes[1])}
                    </span>
                  </div>
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
              theme={{
                axis: {
                  ticks: {
                    text: {
                      fontSize: 12,
                      fill: '#555'
                    }
                  },
                  legend: {
                    text: {
                      fontSize: 14,
                      fontWeight: 'bold',
                      fill: '#333'
                    }
                  }
                }
              }}
            />
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Select a chart type to visualize data</p>
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
                <Badge key={layer} variant="secondary">
                  {layer}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm" onClick={exportChartAsImage}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Export Image
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Filters and controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chart-type">Chart Type</Label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger id="chart-type">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year-filter">Year</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger id="year-filter">
                  <SelectValue placeholder="Select year" />
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

            <div className="space-y-2">
              <Label htmlFor="image-format">Image Format</Label>
              <Select value={imageFormat} onValueChange={(value: "png" | "jpg") => setImageFormat(value)}>
                <SelectTrigger id="image-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpg">JPG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeMapLevel !== "region" && (
              <div className="space-y-2">
                <Label htmlFor="max-items">Max Items to Display</Label>
                <Input
                  id="max-items"
                  type="number"
                  min="1"
                  max="50"
                  value={maxDisplayItems}
                  onChange={(e) => setMaxDisplayItems(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* Y-axis selection */}
          {availableFields.length > 0 && (
            <div className="space-y-2">
              <Label>Y-Axis Variables</Label>
              <div className="flex flex-wrap gap-3">
                {availableFields.map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={field}
                      checked={yAxes.includes(field)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setYAxes([...yAxes, field])
                        } else {
                          setYAxes(yAxes.filter((y) => y !== field))
                        }
                      }}
                    />
                    <Label
                      htmlFor={field}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {formatFieldName(field)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Region/Zone/Woreda selection */}
          {availableItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>
                  Select {activeMapLevel.charAt(0).toUpperCase() + activeMapLevel.slice(1)}s to Display
                </Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (activeMapLevel === "region") {
                        setSelectedRegions([])
                      } else if (activeMapLevel === "zone") {
                        setSelectedZones([])
                      } else {
                        setSelectedWoredas([])
                      }
                    }}
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (activeMapLevel === "region") {
                        setSelectedRegions(availableItems.map(item => item.name))
                      } else if (activeMapLevel === "zone") {
                        setSelectedZones(availableItems.map(item => item.name))
                      } else {
                        setSelectedWoredas(availableItems.map(item => item.name))
                      }
                    }}
                  >
                    Select All
                  </Button>
                </div>
              </div>

              {/* Search and filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${activeMapLevel}s...`}
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {activeMapLevel !== "region" && availableParentRegions.length > 0 && (
                  <Select
                    onValueChange={(value) => {
                      // Filter items by selected region
                      const filtered = availableItems.filter(item => item.parentCode === value)
                      if (activeMapLevel === "zone") {
                        setSelectedZones(filtered.map(item => item.name))
                      } else {
                        setSelectedWoredas(filtered.map(item => item.name))
                      }
                    }}
                  >
                    {/* <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by region" />
                    </SelectTrigger> */}
                    <SelectContent>
                      {availableParentRegions.map((region) => (
                        <SelectItem key={region.code} value={region.code}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Selection checkboxes */}
              <div className="max-h-40 overflow-y-auto border rounded-md p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredAvailableItems.map((item) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.name}
                        checked={
                          activeMapLevel === "region"
                            ? selectedRegions.includes(item.name)
                            : activeMapLevel === "zone"
                            ? selectedZones.includes(item.name)
                            : selectedWoredas.includes(item.name)
                        }
                        onCheckedChange={(checked) => {
                          if (activeMapLevel === "region") {
                            if (checked) {
                              setSelectedRegions([...selectedRegions, item.name])
                            } else {
                              setSelectedRegions(selectedRegions.filter(r => r !== item.name))
                            }
                          } else if (activeMapLevel === "zone") {
                            if (checked) {
                              setSelectedZones([...selectedZones, item.name])
                            } else {
                              setSelectedZones(selectedZones.filter(z => z !== item.name))
                            }
                          } else {
                            if (checked) {
                              setSelectedWoredas([...selectedWoredas, item.name])
                            } else {
                              setSelectedWoredas(selectedWoredas.filter(w => w !== item.name))
                            }
                          }
                        }}
                      />
                      <Label
                        htmlFor={item.name}
                        className="text-sm font-normal cursor-pointer truncate"
                        title={item.name}
                      >
                        {item.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chart display */}
          <div className="border rounded-md p-4">
            {renderChart()}
          </div>

          {/* Export error display */}
          {exportError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{exportError}</p>
            </div>
          )}

          {/* Data summary */}
          {chartData.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing {chartData.length} of {availableItems.length} {activeMapLevel}s for {filterYear}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}