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

    const query = `
      SELECT 
        id,
        name,
        region,
        major_crops,
        land_size,
        soil_type,
        suitability,
        challenges,
        image,
        ST_AsGeoJSON(geom) AS geometry
      FROM agricultural_lands
      ORDER BY id
    `

    const result = await pool.query(query)

    const data = result.rows.map((row) => ({
      ...row,
      geometry: JSON.parse(row.geometry),
    }))

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch agricultural lands data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
