import { type NextRequest, NextResponse } from "next/server"
import pkg from "pg"
const { Pool } = pkg

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT) || 5432,
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") || "2024"

    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME || !process.env.DB_PASS) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
          details: "Please set DB_HOST, DB_USER, DB_NAME, DB_PASS, and DB_PORT in your .env.local",
        },
        { status: 500 },
      )
    }

    console.log("Fetching land data for year:", year)

    const query = `
      SELECT 
        id,
        adm1_en,
        adm1_pcode,
        year,
        total_agri_land,
        plowed_area,
        sowed_land,
        harvested_land
      FROM land
      WHERE year = $1
      ORDER BY adm1_en
    `

    const result = await pool.query(query, [Number.parseInt(year)])

    console.log("Land data fetched successfully:", result.rows.length, "rows")

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      year: Number.parseInt(year),
    })
  } catch (error: any) {
    console.error("Database error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch land data",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
