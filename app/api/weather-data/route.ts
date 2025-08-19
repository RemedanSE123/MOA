import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") || "2020"

    console.log("[v0] Fetching weather data for year:", year)

    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME || !process.env.DB_PASS) {
      console.error("[v0] Missing required database environment variables")
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
          details: "Please set DB_HOST, DB_USER, DB_NAME, DB_PASS, and DB_PORT environment variables",
          missingVars: {
            DB_HOST: !process.env.DB_HOST,
            DB_USER: !process.env.DB_USER,
            DB_NAME: !process.env.DB_NAME,
            DB_PASS: !process.env.DB_PASS,
            DB_PORT: !process.env.DB_PORT,
          },
        },
        { status: 500 },
      )
    }

    const query = `
      SELECT 
        id,
        adm1_en,
        adm1_pcode,
        year,
        avg_annual_precipitation_mm_day,
        avg_annual_max_temperature_c,
        avg_annual_min_temperature_c
      FROM r_weather_data 
      WHERE year = $1
      ORDER BY adm1_en
    `

    const result = await pool.query(query, [Number.parseInt(year)])

    console.log("[v0] Weather data fetched successfully:", result.rows.length, "rows")

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error("[v0] Database error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as any)?.code,
      detail: (error as any)?.detail,
    })

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch weather data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
