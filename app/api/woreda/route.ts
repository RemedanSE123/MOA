import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
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
      LIMIT 1000
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
