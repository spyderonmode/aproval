import { sql } from "drizzle-orm";
import { db } from "./db";

export async function runMigrations(): Promise<void> {
  console.log('🔄 Running database migrations...');
  
  try {
    // Add current_win_streak column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS current_win_streak INTEGER DEFAULT 0;
    `);
    
    // Add best_win_streak column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS best_win_streak INTEGER DEFAULT 0;
    `);
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Error running database migrations:', error);
    // Don't throw error to prevent app from crashing
  }
}