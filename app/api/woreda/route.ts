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
      geometry: JSON.parse(row.geometry),
    }))

    console.log("🗺️ Woreda data processed successfully:", woredas.length, "woredas")

    return NextResponse.json({
      success: true,
      data: woredas,
      count: woredas.length,
    })
  } catch (error: any) {
    console.error("🗺️ Error fetching woreda data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch woreda data",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
