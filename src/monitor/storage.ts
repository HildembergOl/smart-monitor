import { dbSqlite } from "../database/sqlite";

export async function saveResult(result: any) {
  const db = await dbSqlite();
  await db.run(`
    INSERT INTO CHECKS_LOG (client_id, check_name, status, details)
    VALUES (?, ?, ?, ?)
  `, [result.client_id, result.check, result.status, result.details]);
}

export async function saveMetrics(metrics: any) {
  const db = await dbSqlite();
  await db.run(`
    INSERT INTO METRICS (client_id, cpu_usage, memory_usage, memory_total, active_sessions, avg_query_time, deadlocks, db_state, free_disk_space, last_backup, failed_logins)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    metrics.client_id, metrics.cpu_usage, metrics.memory_usage, metrics.memory_total,
    metrics.active_sessions, metrics.avg_query_time, metrics.deadlocks, 
    metrics.db_state, metrics.free_disk_space, metrics.last_backup, metrics.failed_logins
  ]);
}

export async function saveBackups(backup: any) {
  const db = await dbSqlite();
  await db.run(`
    INSERT INTO BACKUP_LOG (client_id, database_name, last_backup, backup_type, status)
    VALUES (?, ?, ?, ?, ?)
  `, [backup.client_id, backup.database_name, backup.last_backup, backup.backup_type, backup.status]);
}
