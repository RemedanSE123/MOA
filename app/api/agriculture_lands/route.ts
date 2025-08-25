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
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch agricultural lands data",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
