"use client";

import type React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WeatherControls } from "./weather-controls";

import {
  Map,
  CloudRain,
  Wheat,
  Tractor,
  MilkIcon as Cow,
  Building,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  MapPin,
  Layers,
  Thermometer,
  Droplets,
  Palette,
  Settings,
} from "lucide-react";

interface SidebarItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
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
      { id: "weather-data-controls", title: "Weather Data Controls", icon: Thermometer },
    ],
  },
  {
    id: "land-information",
    title: "Land Information",
    icon: Wheat,
    children: [
      { id: "land-use", title: "Land Use", icon: Map },
    ],
  },
  {
    id: "crop-distribution",
    title: "Crop Distribution",
    icon: Tractor,
    children: [
      { id: "cereal-crops", title: "Cereal Crops", icon: Wheat },
    ],
  },
  {
    id: "livestock-information",
    title: "Livestock Information",
    icon: Cow,
    children: [
      { id: "cattle", title: "Cattle", icon: Cow },
    ],
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    icon: Building,
    children: [
      { id: "irrigation", title: "Irrigation Systems", icon: Droplets },
      { id: "storage", title: "Storage Facilities", icon: Building },
      { id: "markets", title: "Markets", icon: MapPin },
    ],
  },
  {
    id: "other",
    title: "Other",
    icon: MoreHorizontal,
    children: [
      { id: "other", title: "other", icon: Settings },
    ],
  },
];

interface SidebarNavigationProps {
  activeItem?: string;
  onItemSelect?: (itemId: string) => void;
  className?: string;
  weatherControlsProps?: {
    selectedYear: string;
    onYearChange: (year: string) => void;
    weatherParameter: "max_temp" | "min_temp" | "precipitation";
    onParameterChange: (parameter: "max_temp" | "min_temp" | "precipitation") => void;
    colorScheme: string;
    onColorSchemeChange: (scheme: string) => void;
    colorRanges: number;
    onColorRangesChange: (ranges: number) => void;
    customRange: { min: number; max: number } | null;
    onCustomRangeChange: (range: { min: number; max: number } | null) => void;
    useCustomRange: boolean;
    onUseCustomRangeChange: (use: boolean) => void;
    showPrecipitationIcons: boolean;
    onShowPrecipitationIconsChange: (show: boolean) => void;
    dataRange: { min: number; max: number };
    onRefresh: () => void;
    loading: boolean;
  };
  agriculturalControlsProps?: {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    activeSubcategory: string;
    onSubcategoryChange: (subcategory: string) => void;
    visualizationType: "choropleth" | "pie" | "bar";
    onVisualizationTypeChange: (type: "choropleth" | "pie" | "bar") => void;
    showLegend: boolean;
    onShowLegendChange: (show: boolean) => void;
    onRefresh: () => void;
    loading: boolean;
    dataStats?: any;
  };
}

export function SidebarNavigation({
  activeItem,
  onItemSelect,
  className,
  weatherControlsProps,
  agriculturalControlsProps,
}: SidebarNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleItemClick = (itemId: string, hasChildren: boolean) => {
    if (hasChildren) {
      toggleExpanded(itemId);
    } else {
      onItemSelect?.(itemId);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border",
        isCollapsed ? "w-16" : "w-96",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">Ministry of Agriculture</h2>
              <p className="text-sm text-sidebar-foreground/70">Ethiopia Agricultural Data Portal</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Map className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <ScrollArea className="flex-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-sidebar">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const isExpanded = expandedItems.includes(item.id);
            const hasChildren = item.children && item.children.length > 0;
            const Icon = item.icon;

            return (
              <div key={item.id}>
                {/* Parent Item */}
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    activeItem === item.id && "bg-sidebar-primary text-sidebar-primary-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  onClick={() => handleItemClick(item.id, !!hasChildren)}
                >
                  <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      {hasChildren &&
                        (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                    </>
                  )}
                </Button>

                {/* Children Items */}
                {hasChildren && isExpanded && !isCollapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <Button
                          key={child.id}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            activeItem === child.id && "bg-sidebar-primary text-sidebar-primary-foreground"
                          )}
                          onClick={() => handleItemClick(child.id, false)}
                        >
                          <ChildIcon className="h-3 w-3 mr-3" />
                          <span className="flex-1 text-left">{child.title}</span>
                        </Button>
                      );
                    })}
                  </div>
                )}

                {item.id === "weather-data" && isExpanded && !isCollapsed && weatherControlsProps && (
                  <div className="ml-4 mt-2">
                    <WeatherControls {...weatherControlsProps} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-gray-500 text-center">
            © 2024 Kukunet Digital. All rights reserved.
          </div>
        </div>
      )}
    </div>
  );
}