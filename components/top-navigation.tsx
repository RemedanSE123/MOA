"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Globe, Home } from "lucide-react"
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
    <header className="h-16 bg-gradient-to-r from-card via-card to-card/95 border-b border-border/50 flex items-center justify-between px-6 shadow-sm backdrop-blur-sm">

      {/* Left Section - Branding */}
      <div className="flex items-center space-x-4">
        <Image 
          src="/moe.webp"
          alt="Logo"
          width={40}
          height={40}
          className="rounded-none"
        />
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground flex items-center space-x-2">
              <Shield className="h-3 w-3" />
              <span>{subtitle}</span>
            </p>
          )}
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Input
            placeholder="Search regions, crops, weather data..."
            className="pl-10 bg-gradient-to-r from-input to-input/95 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Right Section - Date & Language */}
      <div className="flex items-center space-x-6">

  {/* Date/Time Panel */}
  <div className="flex flex-col items-center justify-center text-xs font-medium text-black-500">
    <div>{dateStr}</div>
    <div className="mt-0.5 font-mono">{timeStr}</div>
  </div>




  {/* Home Button */}
  <a href="https://kukunetdigital.com/" className="flex items-center text-muted-foreground hover:text-foreground hover:bg-muted/50 px-2 py-1 rounded transition-all duration-200">
    <Home className="h-4 w-4 mr-2" />
   
  </a>
</div>
    </header>
  )
}
