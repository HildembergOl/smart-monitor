"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const menu_1 = require("../backup/menu");
const sqlite_1 = require("./sqlite");
// Variável global que conterá as configurações carregadas
global["AppConfig"] = {};
async function loadConfig() {
    const db = await (0, sqlite_1.dbSqlite)();
    // Lê a configuração principal (assumindo apenas 1 registro)
    const configRow = await db.get(`SELECT * FROM CONFIG LIMIT 1`);
    if (!configRow) {
        console.error("❌ Nenhuma configuração encontrada na tabela CONFIG.");
        console.log("Por favor, crie uma configuração.");
        return await (0, menu_1.criarConfigCompleto)();
    }
    // Lê os horários de backup relacionados
    const backupTimes = await db.all(`SELECT type, cron_expression FROM BACKUP_TIME WHERE config_id = ?`, [configRow.id]);
    // Monta o objeto no formato JSON esperado
    const config = {
        enterprise: configRow.enterprise,
        ambiente: {
            local: {
                user: configRow.local_user,
                password: configRow.local_password,
                server: configRow.local_server,
                database: configRow.local_database,
                port: configRow.local_port,
                options: {
                    encrypt: !!configRow.local_encrypt,
                    trustServerCertificate: !!configRow.local_trustServerCertificate,
                },
            },
            producao: {
                user: configRow.prod_user,
                password: configRow.prod_password,
                server: configRow.prod_server,
                database: configRow.prod_database,
                port: configRow.prod_port,
                options: {
                    encrypt: !!configRow.prod_encrypt,
                    trustServerCertificate: !!configRow.prod_trustServerCertificate,
                },
            },
        },
        email: {
            host: configRow.email_host,
            port: configRow.email_port,
            secure: !!configRow.email_secure,
            auth: {
                user: configRow.email_auth_user,
                pass: configRow.email_auth_pass,
            },
            to: configRow.email_to || "",
        },
        backup: {
            local_path: configRow.backup_local_path,
            remote_path: configRow.backup_remote_path,
            compressao: !!configRow.backup_compressao,
            full: !!configRow.backup_full,
            diferencial: !!configRow.backup_diferencial,
            transacao: !!configRow.backup_transacao,
            retencao: configRow.backup_retencao,
            time_full: backupTimes
                .filter((b) => b.type === "FULL")
                .map((b) => b.cron_expression),
            time_diferencial: backupTimes
                .filter((b) => b.type === "DIFERENCIAL")
                .map((b) => b.cron_expression),
            time_transacao: backupTimes
                .filter((b) => b.type === "TRANSACAO")
                .map((b) => b.cron_expression),
        },
    };
    // Disponibiliza em variável global
    global.AppConfig = config;
    console.log("✅ Configurações carregadas em AppConfig");
    return config;
}
