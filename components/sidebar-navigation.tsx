"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { WeatherControls } from "@/components/weather-controls"
import { LayerControls } from "@/components/layer-controls"
import { AIAssistant } from "@/components/ai-assistant"

import {
  Map,
  CloudRain,
  Wheat,
  Tractor,
  Cog as Cow,
  Building,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  MapPin,
  Layers,
  Thermometer,
  Droplets,
  Settings,
  Bug,
  Sprout,
  BarChart3,
  Bot,
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
    id: "map-layers",
    title: "Map Layers",
    icon: Layers,
    children: [
      { id: "land-layer", title: "Land Data Controls", icon: Sprout },
     
    ],
  },
  {
    id: "weather-data",
    title: "Weather Data",
    icon: CloudRain,
    children: [{ id: "weather-data-controls", title: "Weather Data Controls", icon: Thermometer }],
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    icon: Bot,
    children: [{ id: "ai-chat", title: "Agricultural AI Chat", icon: Bot }],
  },
  // {
  //   id: "land-information",
  //   title: "Land Information",
  //   icon: Wheat,
  //   children: [{ id: "land-use", title: "Land Use", icon: Map }],
  // },
  // {
  //   id: "crop-distribution",
  //   title: "Crop Distribution",
  //   icon: Tractor,
  //   children: [{ id: "cereal-crops", title: "Cereal Crops", icon: Wheat }],
  // },
  // {
  //   id: "livestock-information",
  //   title: "Livestock Information",
  //   icon: Cow,
  //   children: [{ id: "cattle", title: "Cattle", icon: Cow }],
  // },
  // {
  //   id: "infrastructure",
  //   title: "Infrastructure",
  //   icon: Building,
  //   children: [
  //     { id: "irrigation", title: "Irrigation Systems", icon: Droplets },
  //     { id: "storage", title: "Storage Facilities", icon: Building },
  //     { id: "markets", title: "Markets", icon: MapPin },
  //   ],
  // },
  // {
  //   id: "other",
  //   title: "Other",
  //   icon: MoreHorizontal,
  //   children: [{ id: "other", title: "other", icon: Settings }],
  // },
]

interface SidebarNavigationProps {
  activeItem?: string
  onItemSelect?: (itemId: string) => void
  className?: string
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
    colorScheme: string
    onColorSchemeChange: (scheme: string) => void
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
}

export function SidebarNavigation({
  activeItem,
  onItemSelect,
  className,
  layerControlsProps,
  weatherControlsProps,
  agriculturalControlsProps,
}: SidebarNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
 

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
  }

  const handleItemClick = (itemId: string, hasChildren: boolean) => {
    if (hasChildren) {
      toggleExpanded(itemId)
      // Auto-expand sidebar when clicking on parent items with children
      if (isCollapsed) {
        setIsCollapsed(false)
      }
    } else {
      onItemSelect?.(itemId)
    }
  }

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
    // Close all expanded items when collapsing
    if (!isCollapsed) {
      setExpandedItems([])
    }
  }
  // Get active data layers for AI context
  const getActiveDataLayers = () => {
    const layers = []
    if (layerControlsProps?.landLayerEnabled) layers.push("Land Data")
    if (layerControlsProps?.cropProductionLayerEnabled) layers.push("Crop Production")
    if (layerControlsProps?.pestDataLayerEnabled) layers.push("Pest Data")
    if (weatherControlsProps && activeItem?.includes("weather")) layers.push("Weather Data")
    return layers
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border",
        isCollapsed ? "w-16" : isMobile ? "w-64" : "w-72",
        className,
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-sm font-semibold text-sidebar-foreground truncate">Ministry of Agriculture</h2>
              <p className="text-xs text-sidebar-foreground/70 truncate">Ethiopia Agricultural Data Portal</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleCollapse}
            className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8 p-0 flex-shrink-0"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Map className={cn("h-4 w-4 transition-transform duration-200", isCollapsed && "rotate-180")} />
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
                    activeItem === item.id && "bg-sidebar-primary text-sidebar-primary-foreground",
                    isCollapsed && "justify-center px-2",
                  )}
                  onClick={() => handleItemClick(item.id, !!hasChildren)}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className={cn("h-4 w-4 flex-shrink-0", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      {hasChildren &&
                        (isExpanded ? <ChevronDown className="h-4 w-4 transition-transform duration-200" /> : <ChevronRight className="h-4 w-4 transition-transform duration-200" />)}
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
                            activeItem === child.id && "bg-sidebar-primary text-sidebar-primary-foreground",
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

                {/* Layer Controls */}
                {item.id === "map-layers" && isExpanded && !isCollapsed && layerControlsProps && (
                  <div className="ml-4 mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <LayerControls {...layerControlsProps} />
                  </div>
                )}

                {/* Weather Controls */}
                {item.id === "weather-data" && isExpanded && !isCollapsed && weatherControlsProps && (
                  <div className="ml-4 mt-2 animate-in slide-in-from-top-2 duration-200">
                    <WeatherControls {...weatherControlsProps} />
                  </div>
                )}

                {/* AI Assistant */}
                {item.id === "ai-assistant" && isExpanded && !isCollapsed && (
                  <div className="ml-4 mt-2 animate-in slide-in-from-top-2 duration-200">
                    <AIAssistant
                      activeMapLevel={
                        activeItem?.includes("region") ? "region" : activeItem?.includes("zone") ? "zone" : "woreda"
                      }
                      activeDataLayers={getActiveDataLayers()}
                      currentYear={layerControlsProps?.selectedYear || weatherControlsProps?.selectedYear || "2020"}
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
