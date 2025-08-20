import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
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
