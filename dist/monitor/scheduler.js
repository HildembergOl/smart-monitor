"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const checkbackups_1 = require("./checks/checkbackups");
const metrics_1 = require("./checks/metrics");
const storage_1 = require("./storage");
const notifier_1 = require("../@lib/notifier");
const checkdb_1 = require("./checks/checkdb");
const checkalloc_1 = require("./checks/checkalloc");
const checkcatalog_1 = require("./checks/checkcatalog");
const checkconstraints_1 = require("./checks/checkconstraints");
const checkfilegroup_1 = require("./checks/checkfilegroup");
const logs_1 = require("./checks/logs");
const synchronizer_1 = require("../sync/synchronizer");
let monitorTasks = [];
const startScheduler = () => {
    /**
     * Inicia ou reinicia os agendamentos de monitoramento.
     */
    // Cancela agendamentos anteriores caso a função seja chamada novamente (ex: recarregar configurações)
    monitorTasks.forEach((task) => task.stop());
    monitorTasks = [];
    // Diário (Toda madrugada às 06:00)
    const taskDiaria = node_cron_1.default.schedule("0 6 * * *", async () => {
        console.log("Iniciando varredura diária de integridade e logs...");
        // 1. CHECKDB
        const checkdb = await (0, checkdb_1.checkDBIntegrity)(1);
        await (0, storage_1.saveResult)(checkdb);
        if (checkdb.status === "FAIL")
            await (0, notifier_1.sendAlert)("HIGH", `Falha no CHECKDB: ${checkdb.details}`);
        // 2. CHECKALLOC
        const checkalloc = await (0, checkalloc_1.checkAlloc)(1);
        await (0, storage_1.saveResult)(checkalloc);
        if (checkalloc.status === "FAIL")
            await (0, notifier_1.sendAlert)("HIGH", `Falha no CHECKALLOC: ${checkalloc.details}`);
        // 3. CHECKCATALOG
        const checkcatalog = await (0, checkcatalog_1.checkCatalog)(1);
        await (0, storage_1.saveResult)(checkcatalog);
        if (checkcatalog.status === "FAIL")
            await (0, notifier_1.sendAlert)("HIGH", `Falha no CHECKCATALOG: ${checkcatalog.details}`);
        // 4. CHECKCONSTRAINTS
        const checkconstraints = await (0, checkconstraints_1.checkConstraints)(1);
        await (0, storage_1.saveResult)(checkconstraints);
        if (checkconstraints.status === "FAIL")
            await (0, notifier_1.sendAlert)("HIGH", `Falha no CHECKCONSTRAINTS: ${checkconstraints.details}`);
        // 5. CHECKFILEGROUP
        const checkfilegroup = await (0, checkfilegroup_1.checkFileGroup)(1);
        await (0, storage_1.saveResult)(checkfilegroup);
        if (checkfilegroup.status === "FAIL")
            await (0, notifier_1.sendAlert)("HIGH", `Falha no CHECKFILEGROUP: ${checkfilegroup.details}`);
        // 6. ERROR LOGS SYSTEM
        const checklogs = await (0, logs_1.checkLogs)(1);
        await (0, storage_1.saveResult)(checklogs);
        if (checklogs.status === "FAIL")
            await (0, notifier_1.sendAlert)("HIGH", `Erros detectados no ERRORLOG: ${checklogs.details}`);
        // 7. BACKUPS
        const backups = await (0, checkbackups_1.checkBackups)(1);
        for (const b of backups) {
            await (0, storage_1.saveBackups)(b);
            if (b.status === "FAIL") {
                await (0, notifier_1.sendAlert)("HIGH", `Banco ${b.database_name} sem backup válido tipo ${b.backup_type}`);
            }
        }
        console.log("Varredura diária concluída. 🧹");
    });
    // A cada 15 min
    const task15Min = node_cron_1.default.schedule("*/15 * * * *", async () => {
        const metrics = await (0, metrics_1.collectMetrics)(1);
        await (0, storage_1.saveMetrics)(metrics);
        console.log("Métricas coletadas e salvas. 📊");
    });
    // A cada 5 min (Sincronização Cloud)
    const task5Min = node_cron_1.default.schedule("*/5 * * * *", async () => {
        await (0, synchronizer_1.synchronizeData)();
    });
    // Registra as tarefas
    monitorTasks.push(taskDiaria, task15Min, task5Min);
    console.log("Serviços de Monitoramento anexados com sucesso!");
};
exports.startScheduler = startScheduler;
