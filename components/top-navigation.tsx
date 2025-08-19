"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Bell, Settings, HelpCircle, Globe, Wheat, Shield, Calendar } from "lucide-react"

interface TopNavigationProps {
  title?: string
  subtitle?: string
}

export function TopNavigation({ title = "Agricultural Data Portal", subtitle }: TopNavigationProps) {
  return (
    <header className="h-16 bg-gradient-to-r from-card via-card to-card/95 border-b border-border/50 flex items-center justify-between px-6 shadow-sm backdrop-blur-sm">
      {/* Left Section - Branding */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-agricultural to-agricultural/80 rounded-lg shadow-sm">
            <Wheat className="h-6 w-6 text-white" />
          </div>
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
      </div>

      {/* Center Section - Enhanced Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search regions, crops, weather data..."
            className="pl-10 bg-gradient-to-r from-input to-input/95 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Right Section - Enhanced Actions */}
      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Calendar className="h-3 w-3 mr-1" />
            2024 Data
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
        >
          <Globe className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">EN</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="relative text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
        >
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-gradient-to-r from-red-500 to-red-600 border-2 border-background">
            3
          </Badge>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
        >
          <Settings className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-2 pl-2 border-l border-border/50">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
              MoA
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-foreground">Ministry User</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}
