"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface AgriculturalVisualizationProps {
  data: any
  category: string
  subcategory: string
  visualizationType: "choropleth" | "pie" | "bar"
  showLegend: boolean
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export function AgriculturalVisualization({
  data,
  category,
  subcategory,
  visualizationType,
  showLegend,
}: AgriculturalVisualizationProps) {
  const processedData = useMemo(() => {
    if (!data) return null

    if (category === "land-information") {
      if (subcategory === "soilTypes") {
        return data.landInformation?.soilTypes?.map((item: any) => ({
          region: item.region,
          vertisols: item.vertisols,
          cambisols: item.cambisols,
          luvisols: item.luvisols,
          other: item.other,
        }))
      } else if (subcategory === "landUse") {
        return data.landInformation?.landUse?.map((item: any) => ({
          region: item.region,
          cropland: item.cropland,
          pasture: item.pasture,
          forest: item.forest,
          urban: item.urban,
          other: item.other,
        }))
      } else if (subcategory === "elevation") {
        return data.landInformation?.elevation?.map((item: any) => ({
          region: item.region,
          avg_elevation: item.avg_elevation,
          min_elevation: item.min_elevation,
          max_elevation: item.max_elevation,
        }))
      }
    } else if (category === "crop-distribution") {
      if (subcategory === "cerealCrops") {
        return data.cropDistribution?.cerealCrops?.map((item: any) => ({
          region: item.region,
          teff: item.teff,
          wheat: item.wheat,
          barley: item.barley,
          maize: item.maize,
          sorghum: item.sorghum,
        }))
      } else if (subcategory === "cashCrops") {
        return data.cropDistribution?.cashCrops?.map((item: any) => ({
          region: item.region,
          coffee: item.coffee,
          sesame: item.sesame,
          niger_seed: item.niger_seed,
          sunflower: item.sunflower,
          cotton: item.cotton,
        }))
      }
    } else if (category === "livestock-information") {
      return data.livestockInformation?.map((item: any) => ({
        region: item.region,
        cattle: item.cattle,
        sheep: item.sheep,
        goats: item.goats,
        poultry: item.poultry,
      }))
    } else if (category === "infrastructure") {
      return data.infrastructure?.map((item: any) => ({
        region: item.region,
        irrigation_schemes: item.irrigation_schemes,
        storage_facilities: item.storage_facilities,
        markets: item.markets,
        cooperatives: item.cooperatives,
      }))
    }

    return null
  }, [data, category, subcategory])

  const pieChartData = useMemo(() => {
    if (!processedData || visualizationType !== "pie") return null

    // Aggregate data for pie chart
    const firstItem = processedData[0]
    if (!firstItem) return null

    return Object.keys(firstItem)
      .filter((key) => key !== "region" && key !== "adm1_pcode")
      .map((key, index) => ({
        name: key
          .replace(/_/g, " ")
          .replace(/([A-Z])/g, " $1")
          .trim(),
        value: processedData.reduce((sum: number, item: any) => sum + (item[key] || 0), 0),
        color: COLORS[index % COLORS.length],
      }))
  }, [processedData, visualizationType])

  if (!processedData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No data available for the selected category and subcategory.</p>
        </CardContent>
      </Card>
    )
  }

  if (visualizationType === "pie" && pieChartData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {category.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} - Pie Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {showLegend && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {pieChartData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm">{entry.name}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (visualizationType === "bar") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {category.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} - Bar Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                {Object.keys(processedData[0])
                  .filter((key) => key !== "region" && key !== "adm1_pcode")
                  .map((key, index) => (
                    <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
                  ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default table view for choropleth
  return (
    <div className="space-y-4">
      {processedData.map((item: any, index: number) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{item.region}</span>
              <Badge variant="outline">{category.replace(/-/g, " ")}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(item)
                .filter(([key]) => key !== "region" && key !== "adm1_pcode")
                .map(([key, value], idx) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{key.replace(/_/g, " ")}</span>
                      <span className="font-medium">
                        {typeof value === "number" ? value.toLocaleString() : value}
                        {key.includes("elevation") ? "m" : key.includes("percentage") ? "%" : ""}
                      </span>
                    </div>
                    {typeof value === "number" && value <= 100 && <Progress value={value} className="h-2" />}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
