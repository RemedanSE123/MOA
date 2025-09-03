"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { AIAssistant } from "@/components/ai-assistant"

import {
  Map,
  CloudRain,
  Wheat,
  ChevronDown,
  ChevronRight,
  Thermometer,
  Settings,
  Bug,
  Sprout,
  BarChart3,
  Bot,
  Radio,
  RefreshCw,
} from "lucide-react"

interface SidebarItem {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  children?: {
    id: string
    title: string
    icon: React.ComponentType<{ className?: string }>
  }[]
}
interface WeatherControlsProps {
  selectedYear: string
  onYearChange: (year: string) => void
  weatherParameter: "max_temp" | "min_temp" | "precipitation"
  onParameterChange: (parameter: "max_temp" | "min_temp" | "precipitation") => void
  colorScheme: string
  onColorSchemeChange: (scheme: string) => void
  colorRanges: number
  onColorRangesChange: (ranges: number) => void
  onRefresh: () => void
  loading: boolean
  showWeatherData?: boolean // Add this
  onShowWeatherDataChange?: (show: boolean) => void // Add this
  showWeatherStations?: boolean // Add this
  onShowWeatherStationsChange?: (show: boolean) => void // Add this
}
const sidebarItems: SidebarItem[] = [
  {
    id: "map-selection",
    title: "Map Selection",
    icon: Map,
    children: [
      { id: "region-map", title: "Region Map", icon: Map },
      { id: "zone-map", title: "Zone Map", icon: Map },
      { id: "woreda-map", title: "Woreda Map", icon: Map },
    ],
  },
  {
    id: "weather-data",
    title: "Weather Data",
    icon: CloudRain,
    children: [
      { id: "weather-controls", title: "Weather Controls", icon: Thermometer },

    ],
  },
  {
    id: "land-data",
    title: "Land Data",
    icon: Sprout,
    children: [
      { id: "land-controls", title: "Land Controls", icon: Sprout },
     
    ],
  },
  {
    id: "crop-production",
    title: "Crop Production",
    icon: BarChart3,
    children: [
      { id: "crop-controls", title: "Crop Controls", icon: BarChart3 },
    
    ],
  },
  {
    id: "pest-data",
    title: "Pest Data",
    icon: Bug,
    children: [
      { id: "pest-controls", title: "Pest Controls", icon: Bug },
      
    ],
  },
  {
    id: "agriculture-lands",
    title: "Agriculture Lands",
    icon: Wheat,
    children: [{ id: "agriculture-controls", title: "Agriculture Controls", icon: Wheat }],
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    icon: Bot,
    children: [{ id: "ai-chat", title: "Agricultural AI Chat", icon: Bot }],
  },
]

interface SidebarNavigationProps {
  activeItem?: string
  onItemSelect?: (itemId: string) => void
  className?: string
  onCollapseChange?: (collapsed: boolean) => void
  layerControlsProps?: {
    landLayerEnabled: boolean
    onLandLayerToggle: (enabled: boolean) => void
    cropProductionLayerEnabled: boolean
    onCropProductionLayerToggle: (enabled: boolean) => void
    pestDataLayerEnabled: boolean
    onPestDataLayerToggle: (enabled: boolean) => void
    selectedYear: string
    onYearChange: (year: string) => void
    landParameter: string
    onLandParameterChange: (parameter: string) => void
    cropParameter: string
    onCropParameterChange: (parameter: string) => void
    pestParameter: string
    onPestParameterChange: (parameter: string) => void
    landColorScheme: string
    onLandColorSchemeChange: (scheme: string) => void
    landColorRanges: number
    onLandColorRangesChange: (ranges: number) => void
    cropColorScheme: string
    onCropColorSchemeChange: (scheme: string) => void
    cropColorRanges: number
    onCropColorRangesChange: (ranges: number) => void
    pestColorScheme: string
    onPestColorSchemeChange: (scheme: string) => void
    pestColorRanges: number
    onPestColorRangesChange: (ranges: number) => void
      showWeatherData?: boolean
  onShowWeatherDataChange?: (show: boolean) => void
  showWeatherStations?: boolean
  onShowWeatherStationsChange?: (show: boolean) => void
   showAgricultureLands?: boolean // Add this
    onShowAgricultureLandsChange?: (show: boolean) => void // Add this
    onRefresh: () => void
    loading: boolean
  }
  weatherControlsProps?: {
    selectedYear: string
    onYearChange: (year: string) => void
    weatherParameter: "max_temp" | "min_temp" | "precipitation"
    onParameterChange: (parameter: "max_temp" | "min_temp" | "precipitation") => void
    colorScheme: string
    onColorSchemeChange: (scheme: string) => void
    colorRanges: number
    onColorRangesChange: (ranges: number) => void
    customRange: { min: number; max: number } | null
    onCustomRangeChange: (range: { min: number; max: number } | null) => void
    useCustomRange: boolean
    onUseCustomRangeChange: (use: boolean) => void
    showPrecipitationIcons: boolean
    onShowPrecipitationIconsChange: (show: boolean) => void
    dataRange: { min: number; max: number }
    onRefresh: () => void
    loading: boolean
    showWeatherData?: boolean
    onShowWeatherDataChange?: (show: boolean) => void
  }
  agriculturalControlsProps?: {
    activeCategory: string
    onCategoryChange: (category: string) => void
    activeSubcategory: string
    onSubcategoryChange: (subcategory: string) => void
    visualizationType: "choropleth" | "pie" | "bar"
    onVisualizationTypeChange: (type: "choropleth" | "pie" | "bar") => void
    showLegend: boolean
    onShowLegendChange: (show: boolean) => void
    onRefresh: () => void
    loading: boolean
    dataStats?: any
  }
  showWeatherData?: boolean
  onShowWeatherDataChange?: (show: boolean) => void
  showWeatherStations?: boolean
  onShowWeatherStationsChange?: (show: boolean) => void
  showAgricultureLands?: boolean
  onShowAgricultureLandsChange?: (show: boolean) => void
}

export function SidebarNavigation({
  activeItem,
  onItemSelect,
  className,
  onCollapseChange,
  layerControlsProps,
  weatherControlsProps,
  agriculturalControlsProps,
  showWeatherData = false,
  onShowWeatherDataChange,
  showWeatherStations = false,
  onShowWeatherStationsChange,
  showAgricultureLands = false,
  onShowAgricultureLandsChange,
}: SidebarNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(["map-selection"])
  const [isMobile, setIsMobile] = useState(false)

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
  }

  const handleItemClick = (itemId: string, hasChildren: boolean) => {
    if (hasChildren) {
      toggleExpanded(itemId)
      if (isCollapsed) {
        setIsCollapsed(false)
      }
    } else {
      onItemSelect?.(itemId)
    }
  }

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onCollapseChange?.(newCollapsed)
    if (newCollapsed) {
      setExpandedItems([])
    }
  }

  const getActiveDataLayers = () => {
    const layers = []
    if (layerControlsProps?.landLayerEnabled) layers.push("Land Data")
    if (layerControlsProps?.cropProductionLayerEnabled) layers.push("Crop Production")
    if (layerControlsProps?.pestDataLayerEnabled) layers.push("Pest Data")
    if (showWeatherData) layers.push("Weather Data")
      
    return layers
  }

const renderWeatherControls = () => (
  <div className="space-y-4 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium text-blue-900">Weather Data Layer</Label>
      <Switch
        checked={weatherControlsProps?.showWeatherData || false}
        onCheckedChange={weatherControlsProps?.onShowWeatherDataChange}
        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200 border-2 border-blue-300"
      />
    </div>

    {weatherControlsProps?.showWeatherData && (
      <div className="space-y-3">
          <div>
            <Label className="text-xs text-blue-700">Year Selection</Label>
            <Select value={weatherControlsProps.selectedYear} onValueChange={weatherControlsProps.onYearChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["2014","2015","2016","2017","2018","2019","2020", "2021", "2022", "2023", "2024"].map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-blue-700">Parameter</Label>
            <Select
              value={weatherControlsProps.weatherParameter}
              onValueChange={weatherControlsProps.onParameterChange}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="max_temp">Max Temperature</SelectItem>
                <SelectItem value="min_temp">Min Temperature</SelectItem>
                <SelectItem value="precipitation">Precipitation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-blue-700">Color Scheme</Label>
            <Select value={weatherControlsProps.colorScheme} onValueChange={weatherControlsProps.onColorSchemeChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-blue-700">Color Ranges: {weatherControlsProps.colorRanges}</Label>
            <Slider
              value={[weatherControlsProps.colorRanges]}
              onValueChange={([value]) => weatherControlsProps.onColorRangesChange(value)}
              min={3}
              max={10}
              step={1}
              className="mt-1"
            />
          </div>

         
        </div>
      )}

         
  </div>
)
  const renderLandControls = () => (
    <div className="space-y-4 p-3 bg-green-50/50 rounded-lg border border-green-200">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-green-900">Land Data Layer</Label>
        <Switch
          checked={layerControlsProps?.landLayerEnabled || false}
          onCheckedChange={layerControlsProps?.onLandLayerToggle}
          className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-200 border-2 border-green-300"
        />
      </div>

      {layerControlsProps?.landLayerEnabled && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-green-700">Year Selection</Label>
            <Select value={layerControlsProps.selectedYear} onValueChange={layerControlsProps.onYearChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["2014","2015","2016","2017","2018","2019","2020", "2021", "2022", "2023", "2024"].map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-green-700">Parameter</Label>
            <Select value={layerControlsProps.landParameter} onValueChange={layerControlsProps.onLandParameterChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total_agri_land">Total Agricultural Land</SelectItem>
                <SelectItem value="plowed_area">Plowed Land</SelectItem>
                <SelectItem value="sowed_land">Sowed Land</SelectItem>
                <SelectItem value="harvested_land">Harvested Land</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-green-700">Color Scheme</Label>
            <Select
              value={layerControlsProps.landColorScheme}
              onValueChange={layerControlsProps.onLandColorSchemeChange}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-green-700">Color Ranges: {layerControlsProps.landColorRanges}</Label>
            <Slider
              value={[layerControlsProps.landColorRanges]}
              onValueChange={([value]) => layerControlsProps.onLandColorRangesChange(value)}
              min={3}
              max={10}
              step={1}
              className="mt-1"
            />
          </div>
        </div>
      )}
    </div>
  )

  const renderCropControls = () => (
    <div className="space-y-4 p-3 bg-amber-50/50 rounded-lg border border-amber-200">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-amber-900">Crop Production Layer</Label>
        <Switch
          checked={layerControlsProps?.cropProductionLayerEnabled || false}
          onCheckedChange={layerControlsProps?.onCropProductionLayerToggle}
          className="data-[state=checked]:bg-amber-600 data-[state=unchecked]:bg-gray-200 border-2 border-amber-300"
        />
      </div>

      {layerControlsProps?.cropProductionLayerEnabled && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-amber-700">Year Selection</Label>
            <Select value={layerControlsProps.selectedYear} onValueChange={layerControlsProps.onYearChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["2014","2015","2016","2017","2018","2019","2020", "2021", "2022", "2023", "2024"].map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-amber-700">Crop Parameter</Label>
            <Select value={layerControlsProps.cropParameter} onValueChange={layerControlsProps.onCropParameterChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teff_production_mt">Teff Production (MT)</SelectItem>
                <SelectItem value="wheat_production_mt">Wheat Production (MT)</SelectItem>
                <SelectItem value="barley_production_mt">Barley Production (MT)</SelectItem>
                <SelectItem value="maize_production_mt">Maize Production (MT)</SelectItem>
              
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-amber-700">Color Scheme</Label>
            <Select
              value={layerControlsProps.cropColorScheme}
              onValueChange={layerControlsProps.onCropColorSchemeChange}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-amber-700">Color Ranges: {layerControlsProps.cropColorRanges}</Label>
            <Slider
              value={[layerControlsProps.cropColorRanges]}
              onValueChange={([value]) => layerControlsProps.onCropColorRangesChange(value)}
              min={3}
              max={10}
              step={1}
              className="mt-1"
            />
          </div>
        </div>
      )}
    </div>
  )

  const renderPestControls = () => (
    <div className="space-y-4 p-3 bg-red-50/50 rounded-lg border border-red-200">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-red-900">Pest Data Layer</Label>
        <Switch
          checked={layerControlsProps?.pestDataLayerEnabled || false}
          onCheckedChange={layerControlsProps?.onPestDataLayerToggle}
          className="data-[state=checked]:bg-red-600 data-[state=unchecked]:bg-gray-200 border-2 border-red-300"
        />
      </div>

      {layerControlsProps?.pestDataLayerEnabled && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-red-700">Year Selection</Label>
            <Select value={layerControlsProps.selectedYear} onValueChange={layerControlsProps.onYearChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["2014","2015","2016","2017","2018","2019","2020", "2021", "2022", "2023", "2024"].map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-red-700">Pest Parameter</Label>
            <Select value={layerControlsProps.pestParameter} onValueChange={layerControlsProps.onPestParameterChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pest_incidence">Pest Incidence (%)</SelectItem>
                <SelectItem value="affected_area_ha">Affected Area (ha)</SelectItem>
                <SelectItem value="crop_loss_tons">Crop Loss (Tons)</SelectItem>
                <SelectItem value="pest_control_cost_etb">Control Cost (ETB)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-red-700">Color Scheme</Label>
            <Select
              value={layerControlsProps.pestColorScheme}
              onValueChange={layerControlsProps.onPestColorSchemeChange}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-red-700">Color Ranges: {layerControlsProps.pestColorRanges}</Label>
            <Slider
              value={[layerControlsProps.pestColorRanges]}
              onValueChange={([value]) => layerControlsProps.onPestColorRangesChange(value)}
              min={3}
              max={10}
              step={1}
              className="mt-1"
            />
          </div>
        </div>
      )}
    </div>
  )

const renderAgricultureControls = () => (
  <div className="space-y-4 p-3 bg-orange-50/50 rounded-lg border border-orange-200">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium text-orange-900">Agriculture Lands</Label>
      <Switch
        checked={layerControlsProps?.showAgricultureLands || false}
        onCheckedChange={layerControlsProps?.onShowAgricultureLandsChange}
        className="data-[state=checked]:bg-orange-600 data-[state=unchecked]:bg-gray-200 border-2 border-orange-300"
      />
    </div>
  </div>
)

return (
  <div
    className={cn(
      "flex flex-col h-full bg-sidebar border-r border-sidebar-border",
      isCollapsed ? "w-16" : isMobile ? "w-80" : "w-96",
      className,
    )}
  >
    {/* Header */}
    <div className="p-3 border-b border-sidebar-border">
      <div className="flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground truncate">
              Ministry of Agriculture
            </h2>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              Ethiopia Agricultural Data Portal
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleCollapse}
          className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8 p-0 flex-shrink-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Map
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isCollapsed && "rotate-180",
            )}
          />
        </Button>
      </div>
    </div>

    {/* Navigation Items */}
    <ScrollArea className="flex-1 p-2 overflow-y-auto">
      <div className="space-y-1">
        {sidebarItems.map((item) => {
          const isExpanded = expandedItems.includes(item.id)
          const hasChildren = item.children && item.children.length > 0
          const Icon = item.icon

          return (
            <div key={item.id}>
              {/* Parent Item */}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm h-10 transition-all duration-200",
                  activeItem === item.id &&
                    "bg-sidebar-primary text-sidebar-primary-foreground",
                  isCollapsed && "justify-center px-2",
                )}
                // 🔹 If sidebar is collapsed, first expand it instead of just toggling
                onClick={() => {
                  if (isCollapsed) {
                    handleToggleCollapse()
                  } else {
                    handleItemClick(item.id, !!hasChildren)
                  }
                }}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    !isCollapsed && "mr-3",
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.title}</span>
                    {hasChildren &&
                      (isExpanded ? (
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                      ))}
                  </>
                )}
              </Button>

              {/* Children Items */}
              {hasChildren && isExpanded && !isCollapsed && (
                <div className="ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  {item.children?.map((child) => {
                    const ChildIcon = child.icon
                    return (
                      <Button
                        key={child.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-9 transition-all duration-200",
                          activeItem === child.id &&
                            "bg-sidebar-primary text-sidebar-primary-foreground",
                        )}
                        onClick={() => handleItemClick(child.id, false)}
                      >
                        <ChildIcon className="h-3.5 w-3.5 mr-2.5 flex-shrink-0" />
                        <span className="flex-1 text-left">{child.title}</span>
                      </Button>
                    )
                  })}
                </div>
              )}

              {/* Weather Data Controls */}
              {item.id === "weather-data" && isExpanded && !isCollapsed && (
                <div className="ml-4 mt-2 animate-in slide-in-from-top-2 duration-200">
                  {renderWeatherControls()}
                </div>
              )}

              {/* Land Data Controls */}
              {item.id === "land-data" && isExpanded && !isCollapsed && (
                <div className="ml-4 mt-2 animate-in slide-in-from-top-2 duration-200">
                  {renderLandControls()}
                </div>
              )}

              {/* Crop Production Controls */}
              {item.id === "crop-production" && isExpanded && !isCollapsed && (
                <div className="ml-4 mt-2 animate-in slide-in-from-top-2 duration-200">
                  {renderCropControls()}
                </div>
              )}

              {/* Pest Data Controls */}
              {item.id === "pest-data" && isExpanded && !isCollapsed && (
                <div className="ml-4 mt-2 animate-in slide-in-from-top-2 duration-200">
                  {renderPestControls()}
                </div>
              )}

              {/* Agriculture Lands Controls */}
              {item.id === "agriculture-lands" &&
                isExpanded &&
                !isCollapsed && (
                  <div className="ml-4 mt-2 animate-in slide-in-from-top-2 duration-200">
                    {renderAgricultureControls()}
                  </div>
                )}

              {/* AI Assistant */}
              {item.id === "ai-assistant" && isExpanded && !isCollapsed && (
                <div className="ml-4 mt-2 animate-in slide-in-from-top-2 duration-200">
                  <AIAssistant
                    activeMapLevel={
                      activeItem?.includes("region")
                        ? "region"
                        : activeItem?.includes("zone")
                        ? "zone"
                        : "woreda"
                    }
                    activeDataLayers={getActiveDataLayers()}
                    currentYear={
                      layerControlsProps?.selectedYear ||
                      weatherControlsProps?.selectedYear ||
                      "2020"
                    }
                    className={isMobile ? "h-64" : "h-80"}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </ScrollArea>

    {/* Footer */}
    {!isCollapsed && (
      <div className="p-3 border-t border-sidebar-border bg-green-600">
        <div className="text-xs text-center">
          <a
            href="https://www.kukunetdigital.com"
            className="text-white transition-colors duration-300 hover:text-green-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            © 2025 Powered by: KUKUNET digital.
          </a>
        </div>
      </div>
    )}

    {/* Collapsed state tooltip */}
    {isCollapsed && (
      <div className="absolute left-full top-4 ml-2 px-2 py-1 bg-sidebar-primary text-sidebar-primary-foreground text-xs rounded opacity-0 pointer-events-none transition-opacity duration-200 hover:opacity-100 z-50">
        Click to expand
      </div>
    )}
  </div>
)

}
