"use client"

import type React from "react"

import { useState, createContext, useContext } from "react"
import { SidebarNavigation } from "./sidebar-navigation"
import { TopNavigation } from "./top-navigation"
import { Button } from "./ui/button"
import { Menu, X } from "lucide-react"

interface MapSelectionContextType {
  activeMapLevel: "region" | "zone" | "woreda"
  setActiveMapLevel: React.Dispatch<React.SetStateAction<"region" | "zone" | "woreda">>
  activeWeatherDataSource: "r_weather_data" | "z_weather_data" | "w_weather_data" | null
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
  layerControlsProps?: any
}

export function MainLayout({
  children,
  title,
  subtitle,
  weatherControlsProps,
  agriculturalControlsProps,
  layerControlsProps,
}: MainLayoutProps) {
  const [activeItem, setActiveItem] = useState<string>("region-map")
  const [activeMapLevel, setActiveMapLevel] = useState<"region" | "zone" | "woreda">("region")
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const [showWeatherData, setShowWeatherData] = useState(false)
  const [showWeatherStations, setShowWeatherStations] = useState(false)
  const [showAgricultureLands, setShowAgricultureLands] = useState(false)

  const getWeatherDataSource = (mapLevel: "region" | "zone" | "woreda") => {
    switch (mapLevel) {
      case "region":
        return "r_weather_data"
      case "zone":
        return "z_weather_data"
      case "woreda":
        return "w_weather_data" // Fixed woreda weather data source
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
      console.log(" Switched to woreda map with w_weather_data") // Updated log message
    }

    setIsMobileSidebarOpen(false)
  }

  const mapSelectionValue: MapSelectionContextType = {
    activeMapLevel,
    setActiveMapLevel,
    activeWeatherDataSource: getWeatherDataSource(activeMapLevel) as
      | "r_weather_data"
      | "z_weather_data"
      | "w_weather_data"
      | null,
  }

  return (
    <MapSelectionContext.Provider value={mapSelectionValue}>
      <div className="w-full h-screen flex flex-col bg-background overflow-hidden">
        <TopNavigation title={title} subtitle={subtitle} />

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center justify-between p-2 border-b bg-background/95">
          <Button variant="ghost" size="sm" onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}>
            {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {activeMapLevel.charAt(0).toUpperCase() + activeMapLevel.slice(1)} Map
          </span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Mobile Sidebar Overlay */}
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
          )}

          <div
            className={`
            ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0 transition-all duration-300 ease-in-out
            fixed md:relative z-50 md:z-auto
            ${isSidebarCollapsed ? "md:w-16" : "w-80 md:w-96"}
            h-full bg-background border-r flex-shrink-0
          `}
          >
            <SidebarNavigation
              activeItem={activeItem}
              onItemSelect={handleItemSelect}
              weatherControlsProps={weatherControlsProps}
              agriculturalControlsProps={agriculturalControlsProps}
              layerControlsProps={layerControlsProps}
              className="h-full"
              onCollapseChange={setIsSidebarCollapsed}
              showWeatherData={showWeatherData}
              onShowWeatherDataChange={setShowWeatherData}
              showWeatherStations={showWeatherStations}
              onShowWeatherStationsChange={setShowWeatherStations}
              showAgricultureLands={showAgricultureLands}
              onShowAgricultureLandsChange={setShowAgricultureLands}
            />
          </div>

          <main
            className={`
            flex-1 overflow-auto bg-muted/30 min-w-0 transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? "md:ml-0" : ""}
          `}
          >
            <div className="h-full w-full p-2 md:p-4 lg:p-6">{children}</div>
          </main>
        </div>
      </div>
    </MapSelectionContext.Provider>
  )
}
