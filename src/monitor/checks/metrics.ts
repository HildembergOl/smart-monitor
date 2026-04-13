import { db } from "../../database/sqlserver";

export async function collectMetrics(clientId: number) {
  const pool = await db("local");

  const runQuery = async (query: string) => {
    try {
      return await pool.request().query(query);
    } catch (e) {
      console.error(`  - Erro na query de métrica: ${query.substring(0, 50)}... -> ${e instanceof Error ? e.message : String(e)}`);
      return { recordset: [] };
    }
  };

  // 1. Coleta CPU (Ring Buffer)
  const cpuRes = await runQuery(`
    SELECT TOP 1 
      Record.value('(./Record/SchedulerMonitorEvent/SystemHealth/ProcessUtilization)[1]', 'int') AS cpu_usage
    FROM (
      SELECT CAST(record AS xml) AS Record
      FROM sys.dm_os_ring_buffers
      WHERE ring_buffer_type = N'RING_BUFFER_SCHEDULER_MONITOR'
      AND record LIKE '%<SystemHealth>%'
    ) AS x
    ORDER BY Record.value('(./Record/@id)[1]', 'int') DESC
  `);

  let cpu_usage = cpuRes.recordset[0]?.cpu_usage || 0;

  // Fallback: Se CPU der 0 (comum em Express ocioso), tentamos ler as sessions
  if (cpu_usage === 0) {
    const cpuFallback = await runQuery("SELECT SUM(cpu_time) as cpu_total FROM sys.dm_exec_requests");
    // Nota: cpu_time aqui é acumulado, não é %, mas serve como indicador de atividade
    if ((cpuFallback.recordset[0]?.cpu_total || 0) > 0) {
        // Apenas um indicativo básico se houver carga real
        cpu_usage = 0.1; 
    }
  }

  // 2. Coleta Memória
  const memoryProcess = await runQuery("SELECT physical_memory_in_use_kb AS memory_used FROM sys.dm_os_process_memory");
  const memorySystem = await runQuery("SELECT physical_memory_kb AS memory_total FROM sys.dm_os_sys_info");
  
  // 3. Outros
  const sessions = await runQuery("SELECT COUNT(*) AS active_sessions FROM sys.dm_exec_sessions");
  const deadlocks = await runQuery("SELECT cntr_value AS deadlocks FROM sys.dm_os_performance_counters WHERE counter_name = 'Number of Deadlocks/sec'");
  const backup = await runQuery("SELECT MAX(backup_finish_date) AS last_backup FROM msdb.dbo.backupset");

  return {
    client_id: clientId,
    cpu_usage: cpu_usage,
    memory_usage: memoryProcess.recordset[0]?.memory_used || 0,
    memory_total: memorySystem.recordset[0]?.memory_total || 0,
    active_sessions: sessions.recordset[0]?.active_sessions || 0,
    avg_query_time: 0,
    deadlocks: deadlocks.recordset[0]?.deadlocks || 0,
    db_state: pool.connected ? "ONLINE" : "OFFLINE",
    free_disk_space: 0,
    last_backup: backup.recordset[0]?.last_backup,
    failed_logins: 0,
  };
}
