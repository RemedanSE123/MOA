"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  Wheat,
  Tractor,
  MilkIcon as Cow,
  Building,
  Layers,
  Map,
  MapPin,
  BarChart3,
  PieChart,
  TrendingUp,
} from "lucide-react"

interface AgriculturalControlsProps {
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

const agriculturalCategories = [
  {
    id: "land-information",
    name: "Land Information",
    icon: Wheat,
    subcategories: [
      { id: "soilTypes", name: "Soil Types", description: "Distribution of soil types" },
      { id: "landUse", name: "Land Use", description: "Agricultural land use patterns" },
      { id: "elevation", name: "Elevation", description: "Elevation and topography" },
    ],
  },
  {
    id: "crop-distribution",
    name: "Crop Distribution",
    icon: Tractor,
    subcategories: [
      { id: "cerealCrops", name: "Cereal Crops", description: "Teff, wheat, barley, maize, sorghum" },
      { id: "cashCrops", name: "Cash Crops", description: "Coffee, sesame, niger seed, cotton" },
    ],
  },
  {
    id: "livestock-information",
    name: "Livestock Information",
    icon: Cow,
    subcategories: [
      { id: "cattle", name: "Cattle", description: "Cattle population distribution" },
      { id: "small-ruminants", name: "Small Ruminants", description: "Sheep and goat populations" },
      { id: "poultry", name: "Poultry", description: "Poultry farming distribution" },
    ],
  },
  {
    id: "infrastructure",
    name: "Infrastructure",
    icon: Building,
    subcategories: [
      { id: "irrigation", name: "Irrigation Systems", description: "Irrigation infrastructure" },
      { id: "storage", name: "Storage Facilities", description: "Agricultural storage facilities" },
      { id: "markets", name: "Markets", description: "Agricultural markets and cooperatives" },
    ],
  },
]

const visualizationTypes = [
  { id: "choropleth", name: "Map Visualization", icon: Map, description: "Color-coded regional map" },
  { id: "pie", name: "Pie Charts", icon: PieChart, description: "Proportional distribution" },
  { id: "bar", name: "Bar Charts", icon: BarChart3, description: "Comparative analysis" },
]

export function AgriculturalControls({
  activeCategory,
  onCategoryChange,
  activeSubcategory,
  onSubcategoryChange,
  visualizationType,
  onVisualizationTypeChange,
  showLegend,
  onShowLegendChange,
  onRefresh,
  loading,
  dataStats,
}: AgriculturalControlsProps) {
  const selectedCategory = agriculturalCategories.find((cat) => cat.id === activeCategory)
  const selectedSubcategory = selectedCategory?.subcategories.find((sub) => sub.id === activeSubcategory)

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <span>Agricultural Data Categories</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {agriculturalCategories.map((category) => {
            const IconComponent = category.icon
            const isActive = activeCategory === category.id

            return (
              <div
                key={category.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
                onClick={() => onCategoryChange(category.id)}
              >
                <IconComponent className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{category.name}</div>
                  <div className="text-xs text-muted-foreground">{category.subcategories.length} subcategories</div>
                </div>
                {isActive && <Badge variant="secondary">Active</Badge>}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Subcategory Selection */}
      {selectedCategory && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>{selectedCategory.name} - Subcategories</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedCategory.subcategories.map((subcategory) => {
              const isActive = activeSubcategory === subcategory.id

              return (
                <div
                  key={subcategory.id}
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => onSubcategoryChange(subcategory.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{subcategory.name}</div>
                      <div className="text-xs text-muted-foreground">{subcategory.description}</div>
                    </div>
                    {isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Visualization Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Visualization Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Visualization Type</Label>
            {visualizationTypes.map((type) => {
              const IconComponent = type.icon
              const isActive = visualizationType === type.id

              return (
                <div
                  key={type.id}
                  className={`flex items-center space-x-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                    isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => onVisualizationTypeChange(type.id as "choropleth" | "pie" | "bar")}
                >
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{type.name}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                  {isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Show Legend</Label>
            <Switch checked={showLegend} onCheckedChange={onShowLegendChange} />
          </div>

          <Button onClick={onRefresh} variant="outline" disabled={loading} className="w-full bg-transparent">
            {loading ? "Loading..." : "Refresh Data"}
          </Button>
        </CardContent>
      </Card>

      {/* Data Statistics */}
      {dataStats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Data Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground">
              {selectedCategory?.name} - {selectedSubcategory?.name}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Regions with Data</span>
                <span className="font-medium">{dataStats.regionCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Updated</span>
                <span className="font-medium">2024</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Data Quality</span>
                <div className="flex items-center space-x-2">
                  <Progress value={85} className="w-12 h-2" />
                  <span className="font-medium text-xs">85%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
