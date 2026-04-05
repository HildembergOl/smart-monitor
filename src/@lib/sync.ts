import { dbSqlite } from "../database/sqlite";
import { db } from "../database/sqlserver";

/**
 * Sincroniza os registros de Checks_Log, Metrics_15min e Backups_Log
 * do banco auxiliar local para o banco central.
 */
export async function syncResults() {
  await syncTable("Checks_Log", [
    "client_id",
    "check_name",
    "status",
    "details",
    "created_at",
  ]);
  await syncTable("Metrics_15min", [
    "client_id",
    "cpu_usage",
    "memory_usage",
    "active_sessions",
    "avg_query_time",
    "deadlocks",
    "db_state",
    "free_disk_space",
    "last_backup",
    "failed_logins",
    "created_at",
  ]);
  await syncTable("Backups_Log", [
    "client_id",
    "database_name",
    "last_backup",
    "backup_type",
    "status",
    "created_at",
  ]);
  await syncTable("Alerts", [
    "client_id",
    "severity",
    "message",
    "created_at",
    "resolved",
  ]);
}

/**
 * Função genérica para sincronizar uma tabela.
 */
async function syncTable(tableName: string, columns: string[]) {
  try {
    const sqlite = await dbSqlite();
    const pool = await db("remote");

    const unsynced = await sqlite.all(
      `SELECT * FROM ${tableName} WHERE synced = 0`,
    );

    for (const row of unsynced) {
      const values = columns.map((col) => formatValue(row[col]));
      const colNames = columns.join(", ");
      const colValues = values.join(", ");

      const insertQuery = `INSERT INTO ${tableName} (${colNames}) VALUES (${colValues})`;

      try {
        await pool.request().query(insertQuery);

        // Marca como sincronizado
        await sqlite.run(
          `UPDATE ${tableName} SET synced = 1 WHERE id = ${row.id}`,
        );
        console.log(`✅ Registro sincronizado em ${tableName}, ID: ${row.id}`);
      } catch (err) {
        if (err instanceof Error) {
          console.error(
            `❌ Erro ao sincronizar registro ${row.id} em ${tableName}:`,
            err.message,
          );
        }
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(
        `❌ Erro ao buscar registros não sincronizados em ${tableName}:`,
        err.message,
      );
    }
  }
}

/**
 * Formata valores para inserção SQL (strings com aspas, null sem aspas).
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
  if (value instanceof Date) return `'${value.toISOString()}'`;
  return value.toString();
}
