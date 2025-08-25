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

// const suggestedQueries = [
//   "What are the main crops grown in Ethiopia?",

// ]

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
      content: `Hello!`,
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

  const generateResponse = async (userQuery: string): Promise<string> => {
    // Simulate AI processing with contextual responses
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const query = userQuery.toLowerCase()

    if (query.includes("crop") || query.includes("production")) {
      return `Based on the agricultural data for ${currentYear}, Ethiopia's main crops include teff (indigenous grain), maize, wheat, and barley. Teff production is highest in the central highlands, while maize dominates in the western regions. Current data shows regional variations in production efficiency, with some areas achieving 2-3 tons per hectare. Would you like me to analyze specific crop performance by ${activeMapLevel}?`
    }

    if (query.includes("pest") || query.includes("disease")) {
      return `Pest management data for ${currentYear} shows varying levels of agricultural threats across regions. The most common issues include fall armyworm affecting maize crops, wheat rust in highland areas, and locust swarms in eastern regions. Average pest incidence rates range from 5-15% depending on the region and crop type. I can provide detailed pest pressure analysis for specific areas if needed.`
    }

    if (query.includes("weather") || query.includes("rain") || query.includes("temperature")) {
      return `Weather analysis for ${currentYear} shows Ethiopia's diverse climate patterns. Annual rainfall varies from 200mm in eastern lowlands to over 2000mm in southwestern highlands. Temperature ranges from 15°C in highlands to 35°C in lowland areas. The main rainy season (kiremt) from June-September provides 70-80% of annual precipitation. Climate variability significantly impacts agricultural productivity across different ${activeMapLevel}s.`
    }

    if (query.includes("region") || query.includes("zone") || query.includes("compare")) {
      return `Regional comparison analysis shows significant agricultural diversity across Ethiopia. Oromia region leads in crop production volume, while SNNP shows high productivity per hectare. Amhara region has the largest cultivated area. Each region faces unique challenges: drought in eastern areas, soil degradation in highlands, and market access issues in remote zones. I can provide detailed comparisons for specific metrics.`
    }

    if (query.includes("challenge") || query.includes("problem")) {
      return `Major agricultural challenges in Ethiopia include: 1) Climate variability and drought affecting 60% of farming areas, 2) Soil degradation reducing yields by 10-20%, 3) Pest and disease pressure causing 15-25% crop losses, 4) Limited access to improved seeds and fertilizers, 5) Market access and price volatility. The Ministry is implementing various programs to address these challenges through technology adoption and infrastructure development.`
    }

    return `I understand you're asking about "${userQuery}". Based on the current ${activeMapLevel}-level data for ${currentYear}, I can help analyze various agricultural aspects. The active data layers include ${activeDataLayers.length > 0 ? activeDataLayers.join(", ") : "administrative boundaries"}. Could you be more specific about what agricultural data or trends you'd like me to analyze?`
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
                    className={`p-1.5 rounded-lg text-xs ${
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
{/* 
        {messages.length <= 1 && (
          // <div className="space-y-1.5">
          //   <Separator />
          //   <div className="text-xs font-medium text-muted-foreground">Suggested Questions:</div>
          //   <div className="grid grid-cols-1 gap-0.5">
          //     {suggestedQueries.slice(0, 3).map((query, index) => (
          //       <Button
          //         key={index}
          //         variant="ghost"
          //         size="sm"
          //         className="h-auto p-1.5 text-xs text-left justify-start hover:bg-muted/50"
          //         onClick={() => handleSuggestedQuery(query)}
          //       >
          //         {query}
          //       </Button>
          //     ))}
          //   </div>
          // </div>
        )} */}

        <div className="flex space-x-1.5">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            // placeholder="Ask about crops, weather, pests, or land use..."
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
