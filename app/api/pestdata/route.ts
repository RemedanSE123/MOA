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

    console.log("Fetching regional pest data for year:", year)

    const query = `
      SELECT 
        id,
        adm1_pcode,
        adm1_en,
        year,
        pest_incidence,
        affected_area_ha,
        crop_loss_tons,
        pest_control_cost_etb
      FROM pest_data
      WHERE year = $1
      ORDER BY adm1_en
    `

    const result = await pool.query(query, [Number.parseInt(year)])

    console.log("Pest data fetched successfully:", result.rows.length, "rows")

    return NextResponse.json({
      success: true,
      data: result.rows,
      year: Number.parseInt(year),
      count: result.rows.length,
    })
  } catch (error: any) {
    console.error("Database error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pest data",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
