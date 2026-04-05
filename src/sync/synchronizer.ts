import { dbSqlite } from "../database/sqlite";
import { db } from "../database/sqlserver";
import sql from "mssql";

export async function synchronizeData() {
  try {
    const localDb = await dbSqlite();

    // 1. Tenta inicializar pool de produção
    const pool = await db("remote").catch(async (e) => {
      // Registra o erro no banco SQLite (sem encher de duplicatas)
      const existing = await localDb.get("SELECT id FROM ALERTS WHERE message LIKE 'Banco da nuvem inacessível%' AND resolved = 0");
      if (!existing) {
        await localDb.run("INSERT INTO ALERTS (severity, message) VALUES (?, ?)", [
          "WARNING",
          `Banco da nuvem inacessível (${e instanceof Error ? e.message : String(e)}). Tentando novamente no próximo ciclo...`
        ]);
      }
      return null;
    });

    if (!pool) {
      console.log("☁️ [Sincronização] Banco cloud inacessível. O erro foi registrado nos logs do SQLite. Retentando depois...");
      return;
    }

    let recordsSynced = 0;

    // -------------------------------------------------------------
    // Sincronização METRICS
    // -------------------------------------------------------------
    const metrics = await localDb.all(`SELECT * FROM METRICS WHERE synced = 0`);
    if (metrics && metrics.length > 0) {
      for (const row of metrics) {
        const ps = new sql.PreparedStatement(pool);
        ps.input("client_id", sql.Int);
        ps.input("cpu", sql.Float);
        ps.input("mem", sql.Float);
        ps.input("sess", sql.Int);
        ps.input("query", sql.Float);
        ps.input("dead", sql.Int);
        ps.input("state", sql.VarChar);
        ps.input("disk", sql.Float);
        ps.input("bak", sql.DateTime);
        ps.input("login", sql.Int);

        await ps.prepare(`
          INSERT INTO METRICS (client_id, cpu_usage, memory_usage, active_sessions, avg_query_time, deadlocks, db_state, free_disk_space, last_backup, failed_logins)
          VALUES (@client_id, @cpu, @mem, @sess, @query, @dead, @state, @disk, @bak, @login)
        `);

        // SQL Server rejects 'null' for DateTimes if not properly handled or if passed empty string
        const last_backup = row.last_backup ? new Date(row.last_backup) : null;
        
        await ps.execute({
          client_id: row.client_id,
          cpu: row.cpu_usage || 0,
          mem: row.memory_usage || 0,
          sess: row.active_sessions || 0,
          query: row.avg_query_time || 0,
          dead: row.deadlocks || 0,
          state: row.db_state || "UNKNOWN",
          disk: row.free_disk_space || 0,
          bak: isNaN(last_backup?.getTime() || 1) ? null : last_backup,
          login: row.failed_logins || 0
        });
        await ps.unprepare();
        
        // Atualiza como processado
        await localDb.run(`UPDATE METRICS SET synced = 1 WHERE id = ?`, [row.id]);
        recordsSynced++;
      }
    }

    // -------------------------------------------------------------
    // Sincronização CHECKS_LOG
    // -------------------------------------------------------------
    const checks = await localDb.all(`SELECT * FROM CHECKS_LOG WHERE synced = 0`);
    if (checks && checks.length > 0) {
      for (const row of checks) {
        const ps = new sql.PreparedStatement(pool);
        ps.input("client_id", sql.Int);
        ps.input("checkName", sql.VarChar);
        ps.input("status", sql.VarChar);
        ps.input("details", sql.VarChar);
        
        await ps.prepare(`
          INSERT INTO CHECKS_LOG (client_id, check_name, status, details)
          VALUES (@client_id, @checkName, @status, @details)
        `);
        
        await ps.execute({
          client_id: row.client_id,
          checkName: row.check_name,
          status: row.status,
          details: row.details
        });
        await ps.unprepare();

        await localDb.run(`UPDATE CHECKS_LOG SET synced = 1 WHERE id = ?`, [row.id]);
        recordsSynced++;
      }
    }

    // -------------------------------------------------------------
    // Sincronização BACKUP_LOG
    // -------------------------------------------------------------
    const backups = await localDb.all(`SELECT * FROM BACKUP_LOG WHERE synced = 0`);
    if (backups && backups.length > 0) {
      for (const row of backups) {
        const ps = new sql.PreparedStatement(pool);
        ps.input("client_id", sql.Int);
        ps.input("dbName", sql.VarChar);
        ps.input("lastBackup", sql.DateTime);
        ps.input("type", sql.VarChar);
        ps.input("status", sql.VarChar);
        
        await ps.prepare(`
          INSERT INTO BACKUP_LOG (client_id, database_name, last_backup, backup_type, status)
          VALUES (@client_id, @dbName, @lastBackup, @type, @status)
        `);
        
        const bdate = row.last_backup ? new Date(row.last_backup) : null;

        await ps.execute({
          client_id: row.client_id,
          dbName: row.database_name,
          lastBackup: isNaN(bdate?.getTime() || 1) ? null : bdate,
          type: row.backup_type,
          status: row.status
        });
        await ps.unprepare();

        await localDb.run(`UPDATE BACKUP_LOG SET synced = 1 WHERE id = ?`, [row.id]);
        recordsSynced++;
      }
    }

    // -------------------------------------------------------------
    // Sincronização ALERTS
    // -------------------------------------------------------------
    const alerts = await localDb.all(`SELECT * FROM ALERTS WHERE synced = 0`);
    if (alerts && alerts.length > 0) {
      for (const row of alerts) {
        const ps = new sql.PreparedStatement(pool);
        ps.input("client_id", sql.Int);
        ps.input("severity", sql.VarChar);
        ps.input("message", sql.VarChar);
        
        await ps.prepare(`
          INSERT INTO ALERTS (client_id, severity, message)
          VALUES (@client_id, @severity, @message)
        `);
        
        await ps.execute({
          client_id: row.client_id || 1, // Fallback p/ 1 se a tabela de alertas locais não estiver gravando client_id
          severity: row.severity,
          message: row.message
        });
        await ps.unprepare();

        await localDb.run(`UPDATE ALERTS SET synced = 1 WHERE id = ?`, [row.id]);
        recordsSynced++;
      }
    }

    if (recordsSynced > 0) {
      console.log(`☁️ [Sincronização] Concluída com sucesso! ${recordsSynced} registros enviados ao Cloud.`);
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error("☁️ [Sincronização] Erro durante push para a nuvem:", error.message);
    }
  }
}
