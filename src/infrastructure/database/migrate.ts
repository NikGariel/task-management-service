import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/taskdb";

// Extract database name and connection info from connection string
function parseConnectionString(connString: string): {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
} {
  const match = connString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) {
    throw new Error("Invalid connection string format");
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

async function ensureDatabaseExists(): Promise<void> {
  const connInfo = parseConnectionString(connectionString);
  
  // Connect to default postgres database
  const adminConnectionString = `postgresql://${connInfo.user}:${connInfo.password}@${connInfo.host}:${connInfo.port}/postgres`;
  
  try {
    const adminClient = postgres(adminConnectionString);
    
    // Check if database exists
    const result = await adminClient`
      SELECT 1 FROM pg_database WHERE datname = ${connInfo.database}
    `;
    
    if (result.length === 0) {
      console.log(`📦 Creating database "${connInfo.database}"...`);
      // Terminate existing connections if any
      await adminClient.unsafe(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${connInfo.database}' AND pid <> pg_backend_pid()`
      ).catch(() => {
        // Ignore errors if no connections exist
      });
      
      // Create database
      await adminClient.unsafe(`CREATE DATABASE "${connInfo.database}"`);
      console.log(`✅ Database "${connInfo.database}" created successfully.`);
    } else {
      console.log(`✅ Database "${connInfo.database}" already exists.`);
    }
    
    await adminClient.end();
  } catch (error) {
    console.error(`❌ Error ensuring database exists:`, error);
    throw error;
  }
}

async function runMigrations() {
  try {
    console.log("🔍 Checking database connection...");
    
    // Ensure database exists
    await ensureDatabaseExists();
    
    // Connect to target database
    console.log("🔌 Connecting to database...");
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    console.log("🚀 Running migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations completed successfully");
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
