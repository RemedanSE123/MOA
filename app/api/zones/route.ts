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

export async function GET() {
  try {
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
      geometry: JSON.parse(row.geometry),
    }))

    console.log("🗺️ Zone data processed successfully:", zones.length, "zones")

    return NextResponse.json({
      success: true,
      data: zones,
      count: zones.length,
    })
  } catch (error: any) {
    console.error("🗺️ Error fetching zone data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch zone data",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
