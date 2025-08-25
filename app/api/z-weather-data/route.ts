import { NextResponse } from "next/server"
import pkg from "pg"
const { Pool } = pkg

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: Number(process.env.DB_PORT) || 5432,
      }
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") || "2020"

    if (!process.env.DATABASE_URL && (!process.env.DB_USER || !process.env.DB_HOST)) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
          details: "Missing connection variables",
        },
        { status: 500 }
      )
    }

    console.log("Fetching zone weather data for year:", year)

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
    console.log("Zone weather query completed, rows:", result.rows.length)

    return NextResponse.json({
      success: true,
      data: result.rows,
      year: Number.parseInt(year),
      count: result.rows.length,
    })
  } catch (error: any) {
    console.error("Error fetching zone weather data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch zone weather data",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
