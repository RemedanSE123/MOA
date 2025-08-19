"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Thermometer,
  Droplets,
  Palette,
  Settings,
  Calendar,
  BarChart3,
  Cloud,
  CloudRain,
  CloudSnow,
} from "lucide-react"

interface WeatherControlsProps {
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

const colorSchemes = [
  { id: "red", name: "Red (Temperature)", color: "#dc2626", description: "Best for temperature data" },
  { id: "blue", name: "Blue (Cool)", color: "#2563eb", description: "Cool color scheme" },
  { id: "green", name: "Green (Natural)", color: "#16a34a", description: "Natural/agricultural theme" },
  { id: "orange", name: "Orange (Warm)", color: "#ea580c", description: "Warm color scheme" },
  { id: "purple", name: "Purple (Contrast)", color: "#9333ea", description: "High contrast" },
]

const precipitationIcons = [
  { range: [0, 5], icon: Cloud, label: "Very Low", color: "#f3f4f6" },
  { range: [5, 15], icon: Cloud, label: "Low", color: "#e5e7eb" },
  { range: [15, 30], icon: CloudRain, label: "Moderate", color: "#3b82f6" },
  { range: [30, 50], icon: CloudRain, label: "High", color: "#1d4ed8" },
  { range: [50, 100], icon: CloudSnow, label: "Very High", color: "#1e3a8a" },
]

export function WeatherControls({
  selectedYear,
  onYearChange,
  weatherParameter,
  onParameterChange,
  colorScheme,
  onColorSchemeChange,
  colorRanges,
  onColorRangesChange,
  customRange,
  onCustomRangeChange,
  useCustomRange,
  onUseCustomRangeChange,
  showPrecipitationIcons,
  onShowPrecipitationIconsChange,
  dataRange,
  onRefresh,
  loading,
}: WeatherControlsProps) {
  const [tempCustomRange, setTempCustomRange] = useState({
    min: customRange?.min ?? dataRange.min,
    max: customRange?.max ?? dataRange.max,
  })

  const selectedColorScheme = colorSchemes.find((scheme) => scheme.id === colorScheme) || colorSchemes[0]

  const handleCustomRangeApply = () => {
    onCustomRangeChange(tempCustomRange)
  }

  const handleCustomRangeReset = () => {
    setTempCustomRange({ min: dataRange.min, max: dataRange.max })
    onCustomRangeChange(null)
  }

  return (
    <div className="space-y-4">
      {/* Basic Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Weather Data Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Year Selection */}
          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Year:</Label>
            <Select value={selectedYear} onValueChange={onYearChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => 2014 + i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parameter Selection */}
          <div className="flex items-center space-x-3">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Parameter:</Label>
            <Select
              value={weatherParameter}
              onValueChange={(value: "max_temp" | "min_temp" | "precipitation") => onParameterChange(value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="max_temp">Max Temperature</SelectItem>
                <SelectItem value="min_temp">Min Temperature</SelectItem>
                <SelectItem value="precipitation">Precipitation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={onRefresh} variant="outline" disabled={loading} className="w-full bg-transparent">
            {loading ? "Loading..." : "Refresh Data"}
          </Button>
        </CardContent>
      </Card>

      {/* Color Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Color Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {colorSchemes.map((scheme) => (
              <div
                key={scheme.id}
                className={`flex items-center space-x-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                  colorScheme === scheme.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
                onClick={() => onColorSchemeChange(scheme.id)}
              >
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: scheme.color }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{scheme.name}</div>
                  <div className="text-xs text-muted-foreground">{scheme.description}</div>
                </div>
                {colorScheme === scheme.id && <Badge variant="secondary">Active</Badge>}
              </div>
            ))}
          </div>

          <Separator />

          {/* Color Ranges */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Color Ranges: {colorRanges}</Label>
            <Slider
              value={[colorRanges]}
              onValueChange={(value) => onColorRangesChange(value[0])}
              min={3}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>3 ranges</span>
              <span>10 ranges</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Range Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Range Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Use Custom Range</Label>
            <Switch checked={useCustomRange} onCheckedChange={onUseCustomRangeChange} />
          </div>

          {useCustomRange && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Min Value</Label>
                  <Input
                    type="number"
                    value={tempCustomRange.min}
                    onChange={(e) =>
                      setTempCustomRange((prev) => ({ ...prev, min: Number.parseFloat(e.target.value) }))
                    }
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max Value</Label>
                  <Input
                    type="number"
                    value={tempCustomRange.max}
                    onChange={(e) =>
                      setTempCustomRange((prev) => ({ ...prev, max: Number.parseFloat(e.target.value) }))
                    }
                    className="h-8"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleCustomRangeApply} size="sm" className="flex-1">
                  Apply Range
                </Button>
                <Button onClick={handleCustomRangeReset} size="sm" variant="outline" className="flex-1 bg-transparent">
                  Reset
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Data Range: {dataRange.min.toFixed(1)} - {dataRange.max.toFixed(1)}
            {weatherParameter === "precipitation" ? " mm" : "°C"}
          </div>
        </CardContent>
      </Card>

      {/* Precipitation Icons */}
      {weatherParameter === "precipitation" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Droplets className="h-4 w-4" />
              <span>Precipitation Visualization</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Show Icons Instead of Colors</Label>
              <Switch checked={showPrecipitationIcons} onCheckedChange={onShowPrecipitationIconsChange} />
            </div>

            {showPrecipitationIcons && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Icon Legend</Label>
                {precipitationIcons.map((item, index) => {
                  const IconComponent = item.icon
                  return (
                    <div key={index} className="flex items-center space-x-3 text-xs">
                      <IconComponent className="h-4 w-4" style={{ color: item.color }} />
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground">
                        {item.range[0]} - {item.range[1]} mm
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
