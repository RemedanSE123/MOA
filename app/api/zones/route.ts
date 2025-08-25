import { NextResponse } from "next/server"
import pkg from "pg"
const { Pool } = pkg

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT) || 5432,
})

export async function GET() {
  try {
    if (!process.env.DB_USER || !process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_PASS) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
          details: "Please set DB_HOST, DB_USER, DB_NAME, DB_PASS, and DB_PORT in your .env.local",
        },
        { status: 500 },
      )
    }
    console.log("🗺️ Fetching zone data from database")

    const query = `
      SELECT 
        gid,
        adm2_en as name,
        adm2_pcode as code,
        adm1_en as region_name,
        adm1_pcode as region_code,
        ST_AsGeoJSON(geom) as geometry
      FROM zone
      ORDER BY adm2_en
    `

    const result = await pool.query(query)
    console.log("🗺️ Zone query completed, rows:", result.rows.length)

    const zones = result.rows.map((row) => ({
      gid: row.gid,
      name: row.name,
      code: row.code,
      region_name: row.region_name,
      region_code: row.region_code,
      geometry: JSON.parse(row.geometry), // Parse the GeoJSON geometry
    }))

    console.log("🗺️ Zone data processed successfully:", zones.length, "zones")


    return NextResponse.json({
      success: true,
      data: zones,
      count: zones.length,
    })
  } catch (error) {
    console.error("🗺️ Error fetching zone data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch zone data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
