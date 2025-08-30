"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, User, Sparkles, Database, TrendingUp, AlertCircle, Loader2 } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  type?: "query" | "insight" | "alert"
}

interface AIAssistantProps {
  activeMapLevel?: string
  activeDataLayers?: string[]
  currentYear?: string
  className?: string
}

export function AIAssistant({
  activeMapLevel = "region",
  activeDataLayers = [],
  currentYear = "2020",
  className,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello! I'm your AI Agricultural Assistant. `,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch real data from database
  const fetchDatabaseData = async (query: string) => {
    try {
      // Determine which API endpoint to call based on query
      let endpoint = ""
      let params = `?year=${currentYear}`
      
      if (query.includes("crop") || query.includes("production") || query.includes("teff") || query.includes("maize") || query.includes("wheat")) {
        endpoint = "/api/cropproduction"
      } else if (query.includes("land") || query.includes("agricultural") || query.includes("farming")) {
        endpoint = "/api/land"
      } else if (query.includes("pest") || query.includes("disease") || query.includes("insect")) {
        endpoint = "/api/pestdata"
      } else if (query.includes("weather") || query.includes("rain") || query.includes("temperature") || query.includes("climate")) {
        endpoint = activeMapLevel === "zone" ? "/api/z-weather-data" : "/api/r-weather-data"
      } else if (query.includes("region") || query.includes("area") || query.includes("location")) {
        endpoint = "/api/regions"
        params = ""
      }
      
      if (endpoint) {
        const response = await fetch(endpoint + params)
        const data = await response.json()
        return data.success ? data.data : null
      }
      
      return null
    } catch (error) {
      console.error("Error fetching database data:", error)
      return null
    }
  }

  const generateResponse = async (userQuery: string): Promise<string> => {
    // Fetch real data from database
    const dbData = await fetchDatabaseData(userQuery)
    
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 800))

    const query = userQuery.toLowerCase()

    // Handle general questions
    if (query.includes("hello") || query.includes("hi") || query.includes("help")) {
      return `Hello! I'm here to help you analyze Ethiopia's agricultural data. I can provide insights on:

🌾 **Crop Production** - Teff, maize, wheat, barley production by region
🌍 **Land Use** - Agricultural land, plowed areas, sowed and harvested land
🦗 **Pest Management** - Pest incidence rates, affected areas, crop losses
🌤️ **Weather Data** - Temperature and precipitation patterns
📊 **Regional Analysis** - Compare different regions and zones

Try asking: "What are the top crop producing regions?" or "Show me pest data for ${currentYear}"`
    }

    // Handle crop/production queries with real data
    if (query.includes("crop") || query.includes("production")) {
      if (dbData && dbData.length > 0) {
        // Analyze real crop data
        const totalTeff = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.teff_production_mt) || 0), 0)
        const totalMaize = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.maize_production_mt) || 0), 0)
        const totalWheat = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.wheat_production_mt) || 0), 0)
        const totalBarley = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.barley_production_mt) || 0), 0)
        
        const topTeffRegion = dbData.reduce((max: any, item: any) => 
          (parseFloat(item.teff_production_mt) || 0) > (parseFloat(max.teff_production_mt) || 0) ? item : max, dbData[0])
        
        const topMaizeRegion = dbData.reduce((max: any, item: any) => 
          (parseFloat(item.maize_production_mt) || 0) > (parseFloat(max.maize_production_mt) || 0) ? item : max, dbData[0])

        return `**Crop Production Analysis for ${currentYear}:**

📊 **Total Production (Metric Tons):**
• Teff: ${totalTeff.toLocaleString()} MT
• Maize: ${totalMaize.toLocaleString()} MT  
• Wheat: ${totalWheat.toLocaleString()} MT
• Barley: ${totalBarley.toLocaleString()} MT

🏆 **Top Producing Regions:**
• Teff: ${topTeffRegion.adm1_en} (${parseFloat(topTeffRegion.teff_production_mt).toLocaleString()} MT)
• Maize: ${topMaizeRegion.adm1_en} (${parseFloat(topMaizeRegion.maize_production_mt).toLocaleString()} MT)

📈 **Key Insights:**
• ${dbData.length} regions reported production data
• Teff remains Ethiopia's staple crop with ${((totalTeff/(totalTeff+totalMaize+totalWheat+totalBarley))*100).toFixed(1)}% of total production
• Regional variations show diverse agricultural potential across Ethiopia`
      } else {
        return `Based on Ethiopia's agricultural patterns, the main crops include teff (indigenous grain), maize, wheat, and barley. Teff production is typically highest in the central highlands, while maize dominates in western regions. Would you like me to analyze specific crop performance data for ${currentYear}?`
      }
    }

    // Handle pest queries with real data
    if (query.includes("pest") || query.includes("disease")) {
      if (dbData && dbData.length > 0) {
        const avgIncidence = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.pest_incidence) || 0), 0) / dbData.length
        const totalAffectedArea = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.affected_area_ha) || 0), 0)
        const totalCropLoss = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.crop_loss_tons) || 0), 0)
        const totalControlCost = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.pest_control_cost_etb) || 0), 0)
        
        const highestIncidenceRegion = dbData.reduce((max: any, item: any) => 
          (parseFloat(item.pest_incidence) || 0) > (parseFloat(max.pest_incidence) || 0) ? item : max, dbData[0])

        return `**Pest Management Analysis for ${currentYear}:**

⚠️ **Overall Situation:**
• Average pest incidence: ${avgIncidence.toFixed(1)}%
• Total affected area: ${totalAffectedArea.toLocaleString()} hectares
• Total crop losses: ${totalCropLoss.toLocaleString()} tons
• Control costs: ${totalControlCost.toLocaleString()} ETB

🎯 **Highest Risk Region:**
• ${highestIncidenceRegion.adm1_en}: ${parseFloat(highestIncidenceRegion.pest_incidence).toFixed(1)}% incidence rate

📋 **Recommendations:**
• Focus pest control efforts on high-incidence regions
• Implement integrated pest management strategies
• Monitor seasonal patterns for early intervention`
      } else {
        return `Pest management data for ${currentYear} shows varying levels of agricultural threats across regions. Common issues include fall armyworm affecting maize crops, wheat rust in highland areas, and locust swarms in eastern regions. Average pest incidence rates typically range from 5-15% depending on the region and crop type.`
      }
    }

    // Handle weather queries with real data
    if (query.includes("weather") || query.includes("rain") || query.includes("temperature")) {
      if (dbData && dbData.length > 0) {
        const avgMaxTemp = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.avg_annual_max_temperature_c) || 0), 0) / dbData.length
        const avgMinTemp = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.avg_annual_min_temperature_c) || 0), 0) / dbData.length
        const avgPrecipitation = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.avg_annual_precipitation_mm_day) || 0), 0) / dbData.length
        
        const hottestRegion = dbData.reduce((max: any, item: any) => 
          (parseFloat(item.avg_annual_max_temperature_c) || 0) > (parseFloat(max.avg_annual_max_temperature_c) || 0) ? item : max, dbData[0])
        
        const wettestRegion = dbData.reduce((max: any, item: any) => 
          (parseFloat(item.avg_annual_precipitation_mm_day) || 0) > (parseFloat(max.avg_annual_precipitation_mm_day) || 0) ? item : max, dbData[0])

        return `**Weather Analysis for ${currentYear}:**

🌡️ **Temperature Patterns:**
• Average maximum: ${avgMaxTemp.toFixed(1)}°C
• Average minimum: ${avgMinTemp.toFixed(1)}°C
• Hottest region: ${hottestRegion.adm1_en} (${parseFloat(hottestRegion.avg_annual_max_temperature_c).toFixed(1)}°C)

🌧️ **Precipitation Patterns:**
• Average rainfall: ${avgPrecipitation.toFixed(1)} mm/day
• Wettest region: ${wettestRegion.adm1_en} (${parseFloat(wettestRegion.avg_annual_precipitation_mm_day).toFixed(1)} mm/day)

🌾 **Agricultural Impact:**
• Climate diversity supports varied crop production
• Regional variations create different growing conditions
• Weather patterns directly influence crop yields and pest pressure`
      } else {
        return `Weather analysis for ${currentYear} shows Ethiopia's diverse climate patterns. Annual rainfall varies from 200mm in eastern lowlands to over 2000mm in southwestern highlands. Temperature ranges from 15°C in highlands to 35°C in lowland areas. The main rainy season (kiremt) from June-September provides 70-80% of annual precipitation.`
      }
    }

    // Handle land use queries with real data
    if (query.includes("land") || query.includes("agricultural") || query.includes("farming")) {
      if (dbData && dbData.length > 0) {
        const totalAgriLand = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.total_agri_land) || 0), 0)
        const totalPlowed = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.plowed_area) || 0), 0)
        const totalSowed = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.sowed_land) || 0), 0)
        const totalHarvested = dbData.reduce((sum: number, item: any) => sum + (parseFloat(item.harvested_land) || 0), 0)
        
        const largestAgriRegion = dbData.reduce((max: any, item: any) => 
          (parseFloat(item.total_agri_land) || 0) > (parseFloat(max.total_agri_land) || 0) ? item : max, dbData[0])

        return `**Land Use Analysis for ${currentYear}:**

🌾 **Agricultural Land Statistics:**
• Total agricultural land: ${totalAgriLand.toLocaleString()} hectares
• Plowed area: ${totalPlowed.toLocaleString()} hectares
• Sowed land: ${totalSowed.toLocaleString()} hectares  
• Harvested land: ${totalHarvested.toLocaleString()} hectares

📊 **Efficiency Metrics:**
• Land utilization rate: ${((totalSowed/totalAgriLand)*100).toFixed(1)}%
• Harvest success rate: ${((totalHarvested/totalSowed)*100).toFixed(1)}%

🏆 **Largest Agricultural Region:**
• ${largestAgriRegion.adm1_en}: ${parseFloat(largestAgriRegion.total_agri_land).toLocaleString()} hectares

💡 **Insights:**
• ${dbData.length} regions contribute to Ethiopia's agricultural sector
• Land use efficiency varies significantly across regions`
      } else {
        return `Land use analysis shows Ethiopia has significant agricultural potential. The country's diverse topography supports various farming systems, from highland cereals to lowland pastoralism. Agricultural land utilization and efficiency vary considerably across different regions.`
      }
    }

    if (query.includes("region") || query.includes("zone") || query.includes("compare")) {
      if (dbData && dbData.length > 0) {
        const regionCount = dbData.length
        const sampleRegions = dbData.slice(0, 3).map((item: any) => item.adm1_en || item.name).join(", ")
        
        return `**Regional Analysis for ${currentYear}:**

🗺️ **Coverage:**
• Analyzing ${regionCount} regions/zones
• Sample regions: ${sampleRegions}${regionCount > 3 ? ` and ${regionCount - 3} more` : ''}

📊 **Regional Diversity:**
• Each region shows unique agricultural characteristics
• Production patterns vary based on climate and topography
• Different regions specialize in different crops

🔍 **Available Comparisons:**
• Crop production by region
• Land use efficiency
• Weather patterns
• Pest pressure levels

Ask me to "compare crop production between regions" for detailed analysis!`
      } else {
        return `Regional comparison analysis shows significant agricultural diversity across Ethiopia. Oromia region typically leads in crop production volume, while SNNP shows high productivity per hectare. Amhara region has large cultivated areas. Each region faces unique challenges: drought in eastern areas, soil degradation in highlands, and market access issues in remote zones.`
      }
    }

    if (query.includes("challenge") || query.includes("problem")) {
      return `Major agricultural challenges in Ethiopia include: 1) Climate variability and drought affecting 60% of farming areas, 2) Soil degradation reducing yields by 10-20%, 3) Pest and disease pressure causing 15-25% crop losses, 4) Limited access to improved seeds and fertilizers, 5) Market access and price volatility. The Ministry is implementing various programs to address these challenges through technology adoption and infrastructure development.`
    }

    // Default response with context
    return `I understand you're asking about "${userQuery}". Based on the current ${activeMapLevel}-level data for ${currentYear}, I can help analyze various agricultural aspects. 

**Currently Active:** ${activeDataLayers.length > 0 ? activeDataLayers.join(", ") : "Administrative boundaries"}

**I can help with:**
• Crop production analysis and trends
• Weather and climate impact assessment  
• Land use and agricultural efficiency
• Pest management and crop protection
• Regional comparisons and insights

Try asking more specific questions like:
• "What crops are most productive in ${currentYear}?"
• "Which regions have the highest pest problems?"
• "Compare weather patterns across regions"`
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await generateResponse(input.trim())

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        type: "insight",
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I'm having trouble processing your request right now. Please try again or rephrase your question.",
        timestamp: new Date(),
        type: "alert",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuery = (query: string) => {
    setInput(query)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getMessageIcon = (message: Message) => {
    if (message.role === "user") return <User className="h-3 w-3" />

    switch (message.type) {
      case "insight":
        return <Sparkles className="h-3 w-3 text-blue-600" />
      case "alert":
        return <AlertCircle className="h-3 w-3 text-red-600" />
      default:
        return <Bot className="h-3 w-3 text-green-600" />
    }
  }

  const getMessageBadge = (message: Message) => {
    if (message.role === "user") return null

    switch (message.type) {
      case "insight":
        return (
          <Badge variant="secondary" className="text-xs">
            Insight
          </Badge>
        )
      case "alert":
        return (
          <Badge variant="destructive" className="text-xs">
            Alert
          </Badge>
        )
      default:
        return (
          <Badge variant="default" className="text-xs">
            Assistant
          </Badge>
        )
    }
  }


  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className="pb-2 p-2">
        <CardTitle className="flex items-center space-x-2 text-xs">
          <Bot className="h-3 w-3 text-green-600" />
          <span>AI Agricultural Assistant</span>
        </CardTitle>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Database className="h-2.5 w-2.5" />
          <span>Connected to Ethiopia Agricultural Database</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-2 p-2">
        <div className="bg-muted/50 p-1.5 rounded-lg text-xs">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="h-2.5 w-2.5 text-blue-600" />
            <span className="font-medium">Current Context</span>
          </div>
          <div className="space-y-0.5 text-muted-foreground">
            <div>Map Level: {activeMapLevel}</div>
            <div>Year: {currentYear}</div>
            <div>Active Layers: {activeDataLayers.length > 0 ? activeDataLayers.join(", ") : "None"}</div>
          </div>
        </div>

        <ScrollArea ref={scrollAreaRef} className="flex-1 pr-1">
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex space-x-1.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && <div className="flex-shrink-0 mt-0.5">{getMessageIcon(message)}</div>}
                <div className={`max-w-[85%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    {getMessageBadge(message)}
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div
                    className={`p-1.5 rounded-lg text-xs whitespace-pre-wrap ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-auto"
                        : message.type === "alert"
                          ? "bg-red-50 border border-red-200 text-red-800"
                          : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 mt-0.5 order-3">{getMessageIcon(message)}</div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex space-x-1.5 justify-start">
                <div className="flex-shrink-0 mt-0.5">
                  <Bot className="h-3 w-3 text-green-600" />
                </div>
                <div className="bg-muted p-1.5 rounded-lg text-xs flex items-center space-x-2">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  <span>Analyzing agricultural data...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        

        <div className="flex space-x-1.5">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about crops, weather, pests, or land use..."
            className="text-xs h-7"
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} size="sm" disabled={!input.trim() || isLoading} className="px-2 h-7">
            <Send className="h-2.5 w-2.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
