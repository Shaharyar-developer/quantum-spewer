import "dotenv/config";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle({
      connection: { source: process.env.DB_FILE_NAME! || "sqlite.db" },
      schema,
    });
  }
  return dbInstance;
}

export default getDb();
