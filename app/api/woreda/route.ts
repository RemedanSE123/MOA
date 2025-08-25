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
    console.log("🗺️ Fetching woreda data from database")

    const query = `
      SELECT 
        gid,
        adm3_en as name,
        adm3_pcode as code,
        adm2_en as zone_name,
        adm2_pcode as zone_code,
        adm1_en as region_name,
        adm1_pcode as region_code,
        ST_AsGeoJSON(geom) as geometry
      FROM woreda
      ORDER BY adm3_en
      LIMIT 1100
    `

    const result = await pool.query(query)
    console.log("🗺️ Woreda query completed, rows:", result.rows.length)

    const woredas = result.rows.map((row) => ({
      gid: row.gid,
      name: row.name,
      code: row.code,
      zone_name: row.zone_name,
      zone_code: row.zone_code,
      region_name: row.region_name,
      region_code: row.region_code,
      geometry: JSON.parse(row.geometry), // Parse the GeoJSON geometry
    }))

    console.log("🗺️ Woreda data processed successfully:", woredas.length, "woredas")
 

    return NextResponse.json({
      success: true,
      data: woredas,
      count: woredas.length,
    })
  } catch (error) {
    console.error("🗺️ Error fetching woreda data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch woreda data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
