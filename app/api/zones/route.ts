import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    console.log("[v0] Fetching zone data from database")

    const query = `
      SELECT 
        gid,
        shape_leng,
        shape_area,
        adm2_en,
        adm2_pcode,
        adm1_en,
        adm1_pcode,
        adm0_en,
        adm0_pcode,
        ST_AsGeoJSON(geom) as geojson
      FROM zone
      ORDER BY adm2_en
    `

    const result = await pool.query(query)
    console.log("[v0] Zone query completed, rows:", result.rows.length)

    const zones = result.rows.map((row) => ({
      ...row,
      geojson: JSON.parse(row.geojson),
    }))

    return NextResponse.json({
      success: true,
      data: zones,
      count: zones.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching zone data:", error)
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
