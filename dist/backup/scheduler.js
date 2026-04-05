"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.iniciarAgendamentos = iniciarAgendamentos;
const node_cron_1 = __importDefault(require("node-cron"));
const backup_1 = require("./backup");
let tasks = [];
/**
 * Inicia ou reinicia os agendamentos de backup conforme a configuração atual.
 * Cancela tarefas antigas antes de criar novas.
 *
 */
function iniciarAgendamentos() {
    const config = global?.AppConfig?.backup;
    if (!config) {
        console.error("❌ Nenhuma configuração encontrada na tabela Config.");
        return;
    }
    // Cancelar tarefas antigas
    tasks.forEach((task) => task.stop());
    tasks = [];
    // Backup FULL
    if (config.full) {
        config.time_full.forEach((cronExp) => {
            tasks.push(node_cron_1.default.schedule(cronExp, () => (0, backup_1.executarBackup)("full")));
        });
    }
    // Backup Diferencial
    if (config.diferencial) {
        config.time_diferencial.forEach((cronExp) => {
            tasks.push(node_cron_1.default.schedule(cronExp, () => (0, backup_1.executarBackup)("diferencial")));
        });
    }
    // Backup de Log de Transações
    if (config.transacao) {
        config.time_transacao.forEach((cronExp) => {
            tasks.push(node_cron_1.default.schedule(cronExp, () => (0, backup_1.executarBackup)("transacao")));
        });
    }
    console.log("🔔 Agendamentos iniciados/reiniciados conforme configuração.");
}
