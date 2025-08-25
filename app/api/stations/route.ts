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
    console.log("Fetching weather station data...");

    // Query to get station data with geometry 
    const query = `
      SELECT 
        id,
        ST_AsGeoJSON(geom) as geometry
        
      FROM public.stations
      ORDER BY id ASC
    `;

    const result = await pool.query(query);

    // Parse geometry JSON for each row
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
  } catch (error) {
    console.error("Database error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as any)?.code,
      detail: (error as any)?.detail,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch weather station data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}