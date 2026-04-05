import cron from "node-cron";
import { checkBackups } from "./checks/checkbackups";
import { collectMetrics } from "./checks/metrics";
import { saveResult, saveMetrics, saveBackups } from "./storage";
import { sendAlert } from "../@lib/notifier";
import { checkDBIntegrity } from "./checks/checkdb";
import { checkAlloc } from "./checks/checkalloc";
import { checkCatalog } from "./checks/checkcatalog";
import { checkConstraints } from "./checks/checkconstraints";
import { checkFileGroup } from "./checks/checkfilegroup";
import { checkLogs } from "./checks/logs";
import { synchronizeData } from "../sync/synchronizer";

let monitorTasks: cron.ScheduledTask[] = [];

export const startScheduler = () => {
  /**
   * Inicia ou reinicia os agendamentos de monitoramento.
   */

  // Cancela agendamentos anteriores caso a função seja chamada novamente (ex: recarregar configurações)
  monitorTasks.forEach((task) => task.stop());
  monitorTasks = [];

  // Diário (Toda madrugada às 06:00)
  const taskDiaria = cron.schedule("0 6 * * *", async () => {
    console.log("Iniciando varredura diária de integridade e logs...");

    // 1. CHECKDB
    const checkdb = await checkDBIntegrity(1);
    await saveResult(checkdb);
    if (checkdb.status === "FAIL")
      await sendAlert("HIGH", `Falha no CHECKDB: ${checkdb.details}`);

    // 2. CHECKALLOC
    const checkalloc = await checkAlloc(1);
    await saveResult(checkalloc);
    if (checkalloc.status === "FAIL")
      await sendAlert("HIGH", `Falha no CHECKALLOC: ${checkalloc.details}`);

    // 3. CHECKCATALOG
    const checkcatalog = await checkCatalog(1);
    await saveResult(checkcatalog);
    if (checkcatalog.status === "FAIL")
      await sendAlert("HIGH", `Falha no CHECKCATALOG: ${checkcatalog.details}`);

    // 4. CHECKCONSTRAINTS
    const checkconstraints = await checkConstraints(1);
    await saveResult(checkconstraints);
    if (checkconstraints.status === "FAIL")
      await sendAlert(
        "HIGH",
        `Falha no CHECKCONSTRAINTS: ${checkconstraints.details}`,
      );

    // 5. CHECKFILEGROUP
    const checkfilegroup = await checkFileGroup(1);
    await saveResult(checkfilegroup);
    if (checkfilegroup.status === "FAIL")
      await sendAlert(
        "HIGH",
        `Falha no CHECKFILEGROUP: ${checkfilegroup.details}`,
      );

    // 6. ERROR LOGS SYSTEM
    const checklogs = await checkLogs(1);
    await saveResult(checklogs);
    if (checklogs.status === "FAIL")
      await sendAlert(
        "HIGH",
        `Erros detectados no ERRORLOG: ${checklogs.details}`,
      );

    // 7. BACKUPS
    const backups = await checkBackups(1);
    for (const b of backups) {
      await saveBackups(b);
      if (b.status === "FAIL") {
        await sendAlert(
          "HIGH",
          `Banco ${b.database_name} sem backup válido tipo ${b.backup_type}`,
        );
      }
    }

    console.log("Varredura diária concluída. 🧹");
  });

  // A cada 15 min
  const task15Min = cron.schedule("*/15 * * * *", async () => {
    const metrics = await collectMetrics(1);
    await saveMetrics(metrics);
    console.log("Métricas coletadas e salvas. 📊");
  });

  // A cada 5 min (Sincronização Cloud)
  const task5Min = cron.schedule("*/5 * * * *", async () => {
    await synchronizeData();
  });

  // Registra as tarefas
  monitorTasks.push(taskDiaria, task15Min, task5Min);
  console.log("Serviços de Monitoramento anexados com sucesso!");
};
