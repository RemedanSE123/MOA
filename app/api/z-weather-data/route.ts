import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") || "2020"

    console.log(" Fetching zone weather data for year:", year)

    const query = `
      SELECT 
        id,
        adm2_en,
        adm2_pcode,
        year,
        avg_annual_precipitation_mm_day,
        avg_annual_max_temperature_c,
        avg_annual_min_temperature_c
      FROM z_weather_data
      WHERE year = $1
      ORDER BY adm2_en
    `

    const result = await pool.query(query, [Number.parseInt(year)])
    console.log(" Zone weather query completed, rows:", result.rows.length)

    return NextResponse.json({
      success: true,
      data: result.rows,
      year: Number.parseInt(year),
      count: result.rows.length,
    })
  } catch (error) {
    console.error(" Error fetching zone weather data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch zone weather data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
