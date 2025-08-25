import { NextResponse } from "next/server"
import pkg from "pg"
const { Pool } = pkg

// Use DATABASE_URL in production, individual vars locally
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

export async function GET() {
  try {
    // ✅ Smarter check
    if (!process.env.DATABASE_URL && (!process.env.DB_USER || !process.env.DB_HOST)) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
          details: "Missing connection variables",
        },
        { status: 500 },
      )
    }

    console.log("Fetching region data...")

    const query = `
      SELECT 
        gid,
        adm1_en as name,
        adm1_pcode as code,
        ST_AsGeoJSON(geom) as geometry
      FROM region 
      ORDER BY adm1_en
    `

    const result = await pool.query(query)

    const data = result.rows.map(row => ({
      ...row,
      geometry: JSON.parse(row.geometry),
    }))

    console.log("Region data fetched successfully:", data.length, "regions")

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    })
  } catch (error: any) {
    console.error("Database error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch region data",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
