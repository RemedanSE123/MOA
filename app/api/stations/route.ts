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

    console.log("Fetching weather station data...");

    const query = `
      SELECT 
        id,
        ST_AsGeoJSON(geom) as geometry
      FROM public.stations
      ORDER BY id ASC
    `;

    const result = await pool.query(query);

    const data = result.rows.map((row) => ({
      ...row,
      geometry: JSON.parse(row.geometry),
    }));

    console.log("Weather station data fetched successfully:", data.length, "stations");

    return NextResponse.json({
      success: true,
      data: data,
      count: data.length,
    });
  } catch (error: any) {
    console.error("Database error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch weather station data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
