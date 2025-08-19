import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    console.log("[v0] Fetching woreda data from database")

    const query = `
      SELECT 
        gid,
        shape_leng,
        shape_area,
        adm3_en,
        adm3_pcode,
        adm2_en,
        adm2_pcode,
        adm1_en,
        adm1_pcode,
        adm0_en,
        adm0_pcode,
        ST_AsGeoJSON(geom) as geojson
      FROM woreda
      ORDER BY adm3_en
    `

    const result = await pool.query(query)
    console.log("[v0] Woreda query completed, rows:", result.rows.length)

    const woredas = result.rows.map((row) => ({
      ...row,
      geojson: JSON.parse(row.geojson),
    }))

    return NextResponse.json({
      success: true,
      data: woredas,
      count: woredas.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching woreda data:", error)
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
