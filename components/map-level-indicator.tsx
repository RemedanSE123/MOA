"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Layers, Map, AlertTriangle, CheckCircle, Database } from "lucide-react"
import { useMapSelection } from "./main-layout"

export function MapLevelIndicator() {
  const { activeMapLevel, activeWeatherDataSource } = useMapSelection()

  const getMapLevelInfo = () => {
    switch (activeMapLevel) {
      case "region":
        return {
          icon: <MapPin className="h-4 w-4" />,
          title: "Region Level",
          description: "Administrative regions of Ethiopia",
          weatherSource: "Regional weather data available",
          color: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200",
          iconColor: "text-green-600",
        }
      case "zone":
        return {
          icon: <Layers className="h-4 w-4" />,
          title: "Zone Level",
          description: "Administrative zones within regions",
          weatherSource: "Zone weather data available",
          color: "bg-gradient-to-r from-blue-100 to-sky-100 text-blue-800 border-blue-200",
          iconColor: "text-blue-600",
        }
      case "woreda":
        return {
          icon: <Map className="h-4 w-4" />,
          title: "Woreda Level",
          description: "Administrative woredas within zones",
          weatherSource: "No weather data available",
          color: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200",
          iconColor: "text-orange-600",
        }
    }
  }

  const mapInfo = getMapLevelInfo()

  return (
    <Card className="card-enhanced animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${mapInfo.color} shadow-sm`}>
              <div className={mapInfo.iconColor}>{mapInfo.icon}</div>
              <span className="font-semibold">{mapInfo.title}</span>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{mapInfo.description}</p>
              <div className="flex items-center space-x-2">
                {activeWeatherDataSource ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium flex items-center space-x-1">
                      <Database className="h-3 w-3" />
                      <span>{mapInfo.weatherSource}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 text-orange-600" />
                    <span className="text-xs text-orange-600 font-medium">{mapInfo.weatherSource}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {activeWeatherDataSource && (
              <Badge
                variant="outline"
                className="bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-primary/20"
              >
                <Database className="h-3 w-3 mr-1" />
                {activeWeatherDataSource === "r_weather_data" ? "Regional DB" : "Zone DB"}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-gradient-to-r from-muted to-muted/80">
              Active Level
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
