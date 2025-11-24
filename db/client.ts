import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

let db: Pool | null = null;
export function getDb() {
  if (!db) {
    db = new Pool({ connectionString: process.env.DATABASE_URL });
    attachDatabasePool(db);
  }
  return db;
}

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
    const db = getDb();
    const result = await db.query("SELECT version()");
    console.log("Pg version:", result);
    return "Database connected";
  } catch (error) {
    console.error("Error connecting to the database:", error);
    return "Database not connected";
  }
}
