import { collectMetrics } from "./checks/metrics";
import { saveMetrics, saveBackups, saveResult } from "./storage";
import { synchronizeData } from "../sync/synchronizer";
import { checkDBIntegrity } from "./checks/checkdb";
import { checkAlloc } from "./checks/checkalloc";
import { checkCatalog } from "./checks/checkcatalog";
import { checkConstraints } from "./checks/checkconstraints";
import { checkFileGroup } from "./checks/checkfilegroup";
import { checkLogs } from "./checks/logs";
import { checkBackups } from "./checks/checkbackups";
import { sendAlert } from "../@lib/notifier";

export async function dispararColetaMetricas() {
  console.log("\n📊 Iniciando coleta manual de métricas...");
  try {
    const metrics = await collectMetrics(global.AppConfig.client_id);
    await saveMetrics(metrics);
    
    const usedMB = metrics.memory_usage / 1024;
    const totalMB = metrics.memory_total / 1024;
    const percent = totalMB > 0 ? (usedMB / totalMB) * 100 : 0;

    console.log("✅ Métricas coletadas e salvas no SQLite:");
    console.log(`  - CPU: ${metrics.cpu_usage.toFixed(2)}%`);
    console.log(`  - Memória SQL: ${usedMB.toFixed(2)} MB / ${totalMB.toFixed(2)} MB (${percent.toFixed(2)}%)`);
    console.log(`  - Sessões Ativas: ${metrics.active_sessions}`);
    console.log(`  - Deadlocks: ${metrics.deadlocks}`);
  } catch (error) {
    console.error("❌ Erro na coleta de métricas:", error);
  }
}

export async function dispararSincronizacao() {
  console.log("\n☁️ Iniciando sincronização manual com o Cloud...");
  await synchronizeData();
  console.log("✅ Processo de sincronização finalizado.");
}

export async function dispararVarreduraIntegridade() {
  console.log("\n🧹 Iniciando varredura completa de integridade (DBCC)...");

  const executarPasso = async (nome: string, fn: () => Promise<any>, saveFn: (res: any) => Promise<void>) => {
    try {
      console.log(`- Executando ${nome}...`);
      const res = await fn();
      if (saveFn) await saveFn(res);
      console.log(`  ✅ ${nome} finalizado.`);
    } catch (e) {
      console.error(`  ❌ Erro no ${nome}:`, e instanceof Error ? e.message : String(e));
    }
  };

  await executarPasso("CHECKDB", () => checkDBIntegrity(global.AppConfig.client_id), saveResult);
  await executarPasso("CHECKALLOC", () => checkAlloc(global.AppConfig.client_id), saveResult);
  await executarPasso("CHECKCATALOG", () => checkCatalog(global.AppConfig.client_id), saveResult);
  await executarPasso("CHECKCONSTRAINTS", () => checkConstraints(global.AppConfig.client_id), saveResult);
  await executarPasso("CHECKFILEGROUP", () => checkFileGroup(global.AppConfig.client_id), saveResult);
  await executarPasso("ERROR LOGS", () => checkLogs(global.AppConfig.client_id), saveResult);
  
  await executarPasso("BACKUP CHECKS", () => checkBackups(global.AppConfig.client_id), async (backups) => {
    for (const b of backups) {
      await saveBackups(b);
    }
  });

  console.log("\n✅ Processo de varredura finalizado!");
}
