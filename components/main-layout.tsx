"use client"

import type React from "react"

import { useState, createContext, useContext } from "react"
import { SidebarNavigation } from "./sidebar-navigation"
import { TopNavigation } from "./top-navigation"

interface MapSelectionContextType {
  activeMapLevel: "region" | "zone" | "woreda"
  setActiveMapLevel: (level: "region" | "zone" | "woreda") => void
  activeWeatherDataSource: "r_weather_data" | "z_weather_data" | null
}

const MapSelectionContext = createContext<MapSelectionContextType | undefined>(undefined)

export const useMapSelection = () => {
  const context = useContext(MapSelectionContext)
  if (!context) {
    throw new Error("useMapSelection must be used within MapSelectionProvider")
  }
  return context
}

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  weatherControlsProps?: any
  agriculturalControlsProps?: any
}

export function MainLayout({
  children,
  title,
  subtitle,
  weatherControlsProps,
  agriculturalControlsProps,
}: MainLayoutProps) {
  const [activeItem, setActiveItem] = useState<string>("region-map")
  const [activeMapLevel, setActiveMapLevel] = useState<"region" | "zone" | "woreda">("region")

  const getWeatherDataSource = (mapLevel: "region" | "zone" | "woreda") => {
    switch (mapLevel) {
      case "region":
        return "r_weather_data"
      case "zone":
        return "z_weather_data"
      case "woreda":
        return null // No weather data available for woreda
      default:
        return "r_weather_data"
    }
  }

  const handleItemSelect = (itemId: string) => {
    setActiveItem(itemId)
    console.log(" Selected navigation item:", itemId)

    if (itemId === "region-map") {
      setActiveMapLevel("region")
      console.log(" Switched to region map with r_weather_data")
    } else if (itemId === "zone-map") {
      setActiveMapLevel("zone")
      console.log(" Switched to zone map with z_weather_data")
    } else if (itemId === "woreda-map") {
      setActiveMapLevel("woreda")
      console.log(" Switched to woreda map - no weather data available")
    }
  }

  const mapSelectionValue = {
    activeMapLevel,
    setActiveMapLevel,
    activeWeatherDataSource: getWeatherDataSource(activeMapLevel),
  }

  return (
    <MapSelectionContext.Provider value={mapSelectionValue}>
      <div className="h-screen flex flex-col bg-background">
        {/* Top Navigation */}
        <TopNavigation title={title} subtitle={subtitle} />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <SidebarNavigation
            activeItem={activeItem}
            onItemSelect={handleItemSelect}
            weatherControlsProps={weatherControlsProps}
            agriculturalControlsProps={agriculturalControlsProps}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-muted/30">
            <div className="h-full">{children}</div>
          </main>
        </div>
      </div>
    </MapSelectionContext.Provider>
  )
}
