import { type NextRequest, NextResponse } from "next/server"
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") || "2024"

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

    console.log("Fetching land data for year:", year)

    const query = `
      SELECT 
        adm1_en,
        adm1_pcode,
        adm2_en,
        adm2_pcode,
        adm3_en,
        adm3_pcode,
        year,
        total_agri_land,
        harvested_land,
        plowed_area,
        sowed_land
      FROM w_land
      WHERE year = $1
      ORDER BY adm1_en, adm2_en, adm3_en
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
      { status: 500 }
    )
  }
}
