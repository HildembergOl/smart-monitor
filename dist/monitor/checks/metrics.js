"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectMetrics = collectMetrics;
const sqlserver_1 = require("../../database/sqlserver");
async function collectMetrics(clientId) {
    const pool = await (0, sqlserver_1.db)("local");
    const cpu = await pool.request().query("SELECT SUM(cpu_time) AS total_cpu_usage FROM sys.dm_exec_requests");
    const memory = await pool.request().query("SELECT SUM(used_memory_kb)/1024 AS memory_usage FROM sys.dm_exec_sessions");
    const sessions = await pool.request().query("SELECT COUNT(*) AS active_sessions FROM sys.dm_exec_sessions");
    const deadlocks = await pool.request().query("SELECT cntr_value AS deadlocks FROM sys.dm_os_performance_counters WHERE counter_name = 'Number of Deadlocks/sec'");
    const backup = await pool.request().query("SELECT MAX(backup_finish_date) AS last_backup FROM msdb.dbo.backupset");
    return {
        client_id: clientId,
        cpu_usage: cpu.recordset[0]?.total_cpu_usage || 0,
        memory_usage: memory.recordset[0]?.memory_usage || 0,
        active_sessions: sessions.recordset[0]?.active_sessions || 0,
        avg_query_time: 0,
        deadlocks: deadlocks.recordset[0]?.deadlocks || 0,
        db_state: pool.connected ? "ONLINE" : "OFFLINE",
        free_disk_space: 0,
        last_backup: backup.recordset[0]?.last_backup,
        failed_logins: 0,
    };
}
