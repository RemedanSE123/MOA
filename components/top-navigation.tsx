"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Home, Search } from "lucide-react"
import Image from "next/image"

interface TopNavigationProps {
  title?: string
  subtitle?: string
}

export function TopNavigation({ title = "Agricultural Data Portal", subtitle }: TopNavigationProps) {
  const [dateStr, setDateStr] = useState("")
  const [timeStr, setTimeStr] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const dateOptions: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
      setDateStr(now.toLocaleDateString("en-US", dateOptions))
      setTimeStr(now.toLocaleTimeString("en-US", timeOptions))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="w-full h-14 md:h-16 bg-gradient-to-r from-card via-card to-card/95 border-b border-border/50 flex items-center justify-between px-4 md:px-6 shadow-sm backdrop-blur-sm">
      {/* Left Section - Branding */}
      <div className="flex items-center space-x-3 md:space-x-4 flex-shrink-0">
        <Image src="/moe.webp" alt="Logo" width={32} height={32} className="rounded-none" />
        <div className="min-w-0">
          <h1 className="text-sm md:text-lg lg:text-xl font-bold text-foreground tracking-tight truncate">
            Ministry of Agriculture - Ethiopia
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground flex items-center space-x-2">
              <Shield className="h-3 w-3 flex-shrink-0" />
              <span className="hidden sm:inline truncate">{subtitle}</span>
            </p>
          )}
        </div>
      </div>

      {/* Center Section - Search (Desktop Only) */}
      <div className="flex-1 max-w-md mx-4 md:mx-8 hidden lg:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search regions, crops, weather data..."
            className="pl-10 bg-gradient-to-r from-input to-input/95 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Right Section - Home Icon, Date & Time */}
      <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground"
          title="Home"
        >
          <Home className="h-4 w-4" />
        </Button>

        <div className="hidden xl:flex flex-col items-center justify-center text-xs font-medium text-foreground/70">
          <div>{dateStr}</div>
          <div className="mt-0.5 font-mono">{timeStr}</div>
        </div>

        {/* Medium screens - show only time */}
        <div className="hidden lg:flex xl:hidden text-xs font-medium text-foreground/70">
          <div className="font-mono">{timeStr}</div>
        </div>
      </div>
    </header>
  )
}
