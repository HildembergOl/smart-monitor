import sqlite3 from "@journeyapps/sqlcipher";
import { open, Database } from "sqlite";

export const DB_PASSWORD = process.env.SQLITE_PASSWORD || "DevSmart@MS9";

export async function dbSqlite(): Promise<Database> {
  const dbPath = "smart-monitor-v2.db";
  const db = await open({
    filename: dbPath,
    driver: sqlite3.verbose().Database,
  });

  // Aplica a chave de criptografia de forma definitiva
  await db.run(`PRAGMA key = '${DB_PASSWORD}';`);
  await db.get("SELECT count(*) FROM sqlite_master"); // Garante que a senha está OK

  return db;
}
