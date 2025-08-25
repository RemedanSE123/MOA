"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { RefreshCw, Sprout, BarChart3, Bug, Palette, Calendar, AlertTriangle } from "lucide-react"

interface LayerControlsProps {
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
  colorRanges?: number
  onColorRangesChange?: (ranges: number) => void
  onRefresh: () => void
  loading: boolean
}

const landParameters = [
  { value: "total_agri_land", label: "Total Agricultural Land" },
  { value: "plowed_area", label: "Plowed Area" },
  { value: "sowed_land", label: "Sowed Land" },
  { value: "harvested_land", label: "Harvested Land" },
]

const cropParameters = [
  { value: "teff_production_mt", label: "Teff Production (MT)" },
  { value: "maize_production_mt", label: "Maize Production (MT)" },
  { value: "wheat_production_mt", label: "Wheat Production (MT)" },
  { value: "barley_production_mt", label: "Barley Production (MT)" },
]

const pestParameters = [
  { value: "pest_incidence", label: "Pest Incidence (%)" },
  { value: "affected_area_ha", label: "Affected Area (Ha)" },
  { value: "crop_loss_tons", label: "Crop Loss (Tons)" },
  { value: "pest_control_cost_etb", label: "Control Cost (ETB)" },
]

const colorSchemes = [
  { value: "red", label: "Red", color: "#dc2626" },
  { value: "blue", label: "Blue", color: "#2563eb" },
  { value: "green", label: "Green", color: "#16a34a" },
  { value: "orange", label: "Orange", color: "#ea580c" },
  { value: "purple", label: "Purple", color: "#9333ea" },
]

const years = ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"]

export function LayerControls({
  landLayerEnabled,
  onLandLayerToggle,
  cropProductionLayerEnabled,
  onCropProductionLayerToggle,
  pestDataLayerEnabled,
  onPestDataLayerToggle,
  selectedYear,
  onYearChange,
  landParameter,
  onLandParameterChange,
  cropParameter,
  onCropParameterChange,
  pestParameter,
  onPestParameterChange,
  colorScheme,
  onColorSchemeChange,
  colorRanges = 5,
  onColorRangesChange,
  onRefresh,
  loading,
}: LayerControlsProps) {
  const [localColorRanges, setLocalColorRanges] = useState(colorRanges)

  useEffect(() => {
    setLocalColorRanges(colorRanges)
  }, [colorRanges])

  const handleColorRangeChange = (value: number[]) => {
    const newRange = value[0]
    setLocalColorRanges(newRange)
    if (onColorRangesChange) {
      onColorRangesChange(newRange)
    }
  }

  return (
    <div className="space-y-2">
      {/* Year Selection */}
      <div className="space-y-1.5">
        <div className="flex items-center space-x-1.5">
          <Calendar className="h-2.5 w-2.5 text-gray-600" />
          <Label className="text-xs font-medium">Year Selection</Label>
        </div>
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="h-6 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year} className="text-xs">
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Land Data Layer */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Sprout className="h-2.5 w-2.5 text-green-600" />
            <Label className="text-xs font-medium">Land Data</Label>
          </div>
          <Switch checked={landLayerEnabled} onCheckedChange={onLandLayerToggle} />
        </div>
        {landLayerEnabled && (
          <div className="ml-3 space-y-1.5">
            <Label className="text-xs text-gray-600">Parameter</Label>
            <Select value={landParameter} onValueChange={onLandParameterChange}>
              <SelectTrigger className="h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {landParameters.map((param) => (
                  <SelectItem key={param.value} value={param.value} className="text-xs">
                    {param.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator />

      {/* Crop Production Layer */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <BarChart3 className="h-2.5 w-2.5 text-blue-600" />
            <Label className="text-xs font-medium">Crop Production</Label>
          </div>
          <Switch checked={cropProductionLayerEnabled} onCheckedChange={onCropProductionLayerToggle} />
        </div>
        {cropProductionLayerEnabled && (
          <div className="ml-3 space-y-1.5">
            <Label className="text-xs text-gray-600">Crop Type</Label>
            <Select value={cropParameter} onValueChange={onCropParameterChange}>
              <SelectTrigger className="h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cropParameters.map((param) => (
                  <SelectItem key={param.value} value={param.value} className="text-xs">
                    {param.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator />

      {/* Pest Data Layer */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Bug className="h-2.5 w-2.5 text-red-600" />
            <Label className="text-xs font-medium">Pest Data</Label>
          </div>
          <Switch checked={pestDataLayerEnabled} onCheckedChange={onPestDataLayerToggle} />
        </div>
        {pestDataLayerEnabled && (
          <div className="ml-3 space-y-1.5">
            <Label className="text-xs text-gray-600">Metric</Label>
            <Select value={pestParameter} onValueChange={onPestParameterChange}>
              <SelectTrigger className="h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pestParameters.map((param) => (
                  <SelectItem key={param.value} value={param.value} className="text-xs">
                    {param.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-500 bg-red-50 p-1.5 rounded border-l-2 border-red-200">
              <div className="flex items-center space-x-1 mb-0.5">
                <AlertTriangle className="h-2.5 w-2.5 text-red-600" />
                <div className="font-medium">Pest Management Data</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Color Scheme */}
      <div className="space-y-1.5">
        <div className="flex items-center space-x-1.5">
          <Palette className="h-2.5 w-2.5 text-gray-600" />
          <Label className="text-xs font-medium">Color Scheme</Label>
        </div>
        <Select value={colorScheme} onValueChange={onColorSchemeChange}>
          <SelectTrigger className="h-6 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {colorSchemes.map((scheme) => (
              <SelectItem key={scheme.value} value={scheme.value} className="text-xs">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: scheme.color }} />
                  <span>{scheme.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Color Ranges Slider - Fixed functionality */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Color Ranges: {localColorRanges}</Label>
        <Slider
          value={[localColorRanges]}
          onValueChange={handleColorRangeChange}
          min={3}
          max={20}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>3 ranges</span>
          <span>20 ranges</span>
        </div>
      </div>

      <Separator />

      {/* Refresh Button */}
      <Button
        onClick={onRefresh}
        disabled={loading}
        size="sm"
        variant="outline"
        className="w-full h-6 text-xs bg-transparent"
      >
        <RefreshCw className={`h-2.5 w-2.5 mr-1 ${loading ? "animate-spin" : ""}`} />
        Refresh Data
      </Button>
    </div>
  )
}
