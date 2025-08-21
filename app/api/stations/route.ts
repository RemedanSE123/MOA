import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME || !process.env.DB_PASS) {
      console.error("Missing required database environment variables");
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
      );
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