import cron, { ScheduledTask } from "node-cron";
import { executarBackup } from "./backup";

let tasks: ScheduledTask[] = [];

/**
 * Inicia ou reinicia os agendamentos de backup conforme a configuração atual.
 * Cancela tarefas antigas antes de criar novas.
 *
 */
export function iniciarAgendamentos() {
  const config = (global as any)?.AppConfig?.backup;
  if (!config) {
    console.error("❌ Nenhuma configuração encontrada na tabela Config.");
    return;
  }
  // Cancelar tarefas antigas
  tasks.forEach((task) => task.stop());
  tasks = [];

  // Backup FULL
  if (config.full) {
    config.time_full.forEach((cronExp: string) => {
      tasks.push(cron.schedule(cronExp, () => executarBackup("full")));
    });
  }

  // Backup Diferencial
  if (config.diferencial) {
    config.time_diferencial.forEach((cronExp: string) => {
      tasks.push(cron.schedule(cronExp, () => executarBackup("diferencial")));
    });
  }

  // Backup de Log de Transações
  if (config.transacao) {
    config.time_transacao.forEach((cronExp: string) => {
      tasks.push(cron.schedule(cronExp, () => executarBackup("transacao")));
    });
  }

  console.log("🔔 Agendamentos iniciados/reiniciados conforme configuração.");
}
