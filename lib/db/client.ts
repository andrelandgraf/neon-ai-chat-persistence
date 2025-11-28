import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
attachDatabasePool(pool);

export const db = drizzle({ client: pool, schema });

/**
 * Helper function to check if the database is connected.
 * This can be removed. We use it here to showcase a helpful message on the landing page
 * and make sure you're not greeted with an error when trying to run the app for the first time without a DATABASE_URL environment variable.
 */
export async function checkDbConnection() {
  if (!process.env.DATABASE_URL) {
    return "No DATABASE_URL environment variable";
  }
  try {
    const result = await db.execute("SELECT version()");
    console.log("Pg version:", result);
    return "Database connected";
  } catch (error) {
    console.error("Error connecting to the database:", error);
    return "Database not connected";
  }
}
