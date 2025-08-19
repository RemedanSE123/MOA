import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME || !process.env.DB_PASS) {
      console.error("[v0] Missing required database environment variables")
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
          details: "Please set DB_HOST, DB_USER, DB_NAME, DB_PASS, and DB_PORT environment variables",
          missingVars: {
            DB_HOST: !process.env.DB_HOST,
            DB_USER: !process.env.DB_USER,
            DB_NAME: !process.env.DB_NAME,
            DB_PASS: !process.env.DB_PASS,
            DB_PORT: !process.env.DB_PORT,
          },
        },
        { status: 500 },
      )
    }

    console.log("[v0] Fetching region data...")

    // Query to get region data with geometry
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

    // Parse geometry JSON for each row
    const data = result.rows.map((row) => ({
      ...row,
      geometry: JSON.parse(row.geometry),
    }))

    console.log("[v0] Region data fetched successfully:", data.length, "regions")

    return NextResponse.json({
      success: true,
      data: data,
      count: data.length,
    })
  } catch (error) {
    console.error("[v0] Database error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as any)?.code,
      detail: (error as any)?.detail,
    })

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch region data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
