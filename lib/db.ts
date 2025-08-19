import { Pool } from "pg"

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "moa_map_db",
  password: process.env.DB_PASS || "admin",
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
})

export async function testConnection() {
  try {
    console.log("[v0] Testing database connection...")
    console.log("[v0] Connection config:", {
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "moa_map_db",
      user: process.env.DB_USER || "postgres",
      port: process.env.DB_PORT || "5432",
      hasEnvVars: {
        DB_HOST: !!process.env.DB_HOST,
        DB_NAME: !!process.env.DB_NAME,
        DB_USER: !!process.env.DB_USER,
        DB_PASS: !!process.env.DB_PASS,
        DB_PORT: !!process.env.DB_PORT,
      },
    })

    const client = await pool.connect()
    await client.query("SELECT NOW()")
    client.release()
    console.log("[v0] Database connection successful")
    return { success: true, message: "Database connection successful" }
  } catch (error) {
    console.error("[v0] Database connection failed:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown connection error",
      config: {
        host: process.env.DB_HOST || "localhost",
        database: process.env.DB_NAME || "moa_map_db",
        user: process.env.DB_USER || "postgres",
        port: process.env.DB_PORT || "5432",
      },
    }
  }
}

export { pool }
