"use client"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { RefreshCw, Thermometer, Palette, Calendar, Sun, CloudRain } from "lucide-react"

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

const weatherParameters = [
  { value: "max_temp", label: "Maximum Temperature", icon: Sun },
  { value: "min_temp", label: "Minimum Temperature", icon: Thermometer },
  { value: "precipitation", label: "Precipitation", icon: CloudRain },
]

const colorSchemes = [
  { value: "red", label: "Red", color: "#dc2626" },
  { value: "blue", label: "Blue", color: "#2563eb" },
  { value: "green", label: "Green", color: "#16a34a" },
  { value: "orange", label: "Orange", color: "#ea580c" },
  { value: "purple", label: "Purple", color: "#9333ea" },
]

const years = ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"]

export function WeatherControls({
  selectedYear,
  onYearChange,
  weatherParameter,
  onParameterChange,
  colorScheme,
  onColorSchemeChange,
  colorRanges,
  onColorRangesChange,
  dataRange,
  onRefresh,
  loading,
}: WeatherControlsProps) {
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

      {/* Weather Parameter Selection */}
      <div className="space-y-1.5">
        <div className="flex items-center space-x-1.5">
          <Thermometer className="h-2.5 w-2.5 text-blue-600" />
          <Label className="text-xs font-medium">Weather Parameter</Label>
        </div>
        <div className="space-y-1">
          {weatherParameters.map((param) => {
            const Icon = param.icon
            const isActive = weatherParameter === param.value
            return (
              <button
                key={param.value}
                onClick={() => onParameterChange(param.value as "max_temp" | "min_temp" | "precipitation")}
                className={`w-full flex items-center space-x-2 p-2 rounded-lg border text-xs transition-all ${
                  isActive
                    ? "bg-blue-50 border-blue-200 text-blue-900"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className={`h-3 w-3 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                <span className="font-medium">{param.label}</span>
                {isActive && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>}
              </button>
            )
          })}
        </div>
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

      {/* Color Ranges Slider */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Color Ranges: {colorRanges}</Label>
        <Slider
          value={[colorRanges]}
          onValueChange={(value) => onColorRangesChange(value[0])}
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

      {/* Data Range Info */}
      {dataRange.min !== dataRange.max && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-gray-600">Current Data Range</Label>
          <div className="text-xs text-gray-500 bg-blue-50 p-1.5 rounded border-l-2 border-blue-200">
            <div className="flex justify-between">
              <span>Min: {dataRange.min.toFixed(1)}</span>
              <span>Max: {dataRange.max.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}

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
