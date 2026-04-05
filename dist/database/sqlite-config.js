"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salvarConfig = salvarConfig;
const sqlite_1 = require("./sqlite");
const sqlserver_1 = require("./sqlserver");
async function salvarConfig() {
    const config = global.AppConfig;
    if (!config) {
        console.error("❌ Nenhuma configuração encontrada na tabela Config.");
        return;
    }
    const db = await (0, sqlite_1.dbSqlite)();
    let id = 0;
    // Atualiza ou insere configuração
    const existing = await db.get(`SELECT id FROM CONFIG LIMIT 1`);
    const databases = await (0, sqlserver_1.getDatabases)();
    if (databases) {
        config.ambiente.local.database = databases.join(",");
        console.log(`\n 🚦Bancos de dados encontrados: ${databases.join(",")}`);
    }
    config.enterprise = config.enterprise
        .trim()
        .toUpperCase()
        .replaceAll(" ", "_");
    if (existing) {
        id = existing.id;
        await db.run(`UPDATE CONFIG 
          SET enterprise=?, 
              local_server=?, 
              local_user=?, 
              local_password=?, 
              local_database=?, 
              local_encrypt=?, 
              local_trustServerCertificate=?,
              local_port=?,
              prod_server=?, 
              prod_user=?, 
              prod_password=?, 
              prod_database=?, 
              prod_encrypt=?, 
              prod_trustServerCertificate=?, 
              prod_port=?, 
              email_host=?, 
              email_port=?, 
              email_secure=?, 
              email_auth_user=?, 
              email_auth_pass=?, 
              email_to=?, 
              backup_local_path=?, 
              backup_remote_path=?, 
              backup_compressao=?, 
              backup_full=?, 
              backup_diferencial=?, 
              backup_transacao=?, 
              backup_retencao=? 
          WHERE id=?`, [
            config.enterprise,
            config.ambiente.local.server,
            config.ambiente.local.user,
            config.ambiente.local.password,
            config.ambiente.local.database,
            config.ambiente.local.options.encrypt ? 1 : 0,
            config.ambiente.local.options.trustServerCertificate ? 1 : 0,
            config.ambiente.local.port,
            config.ambiente.producao.server,
            config.ambiente.producao.user,
            config.ambiente.producao.password,
            config.ambiente.producao.database,
            config.ambiente.producao.options.encrypt ? 1 : 0,
            config.ambiente.producao.options.trustServerCertificate ? 1 : 0,
            config.ambiente.producao.port,
            config.email.host,
            config.email.port,
            config.email.secure ? 1 : 0,
            config.email.auth.user,
            config.email.auth.pass,
            config.email.to,
            config.backup.local_path,
            config.backup.remote_path,
            config.backup.compressao ? 1 : 0,
            config.backup.full ? 1 : 0,
            config.backup.diferencial ? 1 : 0,
            config.backup.transacao ? 1 : 0,
            config.backup.retencao,
            existing.id,
        ]);
    }
    else {
        const result = await db.run(`INSERT INTO CONFIG 
         (enterprise, local_server, local_user, local_password, local_database, local_encrypt, local_trustServerCertificate, 
          local_port, prod_server, prod_user, prod_password, prod_database, prod_encrypt, prod_trustServerCertificate, prod_port, 
          email_host, email_port, email_secure, email_auth_user, email_auth_pass, email_to, backup_local_path, backup_remote_path, 
          backup_compressao, backup_full, backup_diferencial, backup_transacao, backup_retencao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            config.enterprise,
            config.ambiente.local.server,
            config.ambiente.local.user,
            config.ambiente.local.password,
            config.ambiente.local.database,
            config.ambiente.local.options.encrypt ? 1 : 0,
            config.ambiente.local.options.trustServerCertificate ? 1 : 0,
            config.ambiente.local.port,
            config.ambiente.producao.server,
            config.ambiente.producao.user,
            config.ambiente.producao.password,
            config.ambiente.producao.database,
            config.ambiente.producao.options.encrypt ? 1 : 0,
            config.ambiente.producao.options.trustServerCertificate ? 1 : 0,
            config.ambiente.producao.port,
            config.email.host,
            config.email.port,
            config.email.secure ? 1 : 0,
            config.email.auth.user,
            config.email.auth.pass,
            config.email.to,
            config.backup.local_path,
            config.backup.remote_path,
            config.backup.compressao ? 1 : 0,
            config.backup.full ? 1 : 0,
            config.backup.diferencial ? 1 : 0,
            config.backup.transacao ? 1 : 0,
            config.backup.retencao,
        ]);
        if (result?.lastID)
            id = result.lastID;
    }
    if (id > 0) {
        if (config.backup.full) {
            await db.run(`DELETE FROM BACKUP_TIME WHERE config_id = ? AND type = 'FULL'`, [id]);
            for (const h of config.backup.time_full) {
                await db.run(`INSERT INTO BACKUP_TIME (config_id, type, cron_expression) VALUES (?, 'FULL', ?)`, [id, h]);
            }
        }
        if (config.backup.diferencial) {
            await db.run(`DELETE FROM BACKUP_TIME WHERE config_id = ? AND type = 'DIFERENCIAL'`, [id]);
            for (const h of config.backup.time_diferencial) {
                await db.run(`INSERT INTO BACKUP_TIME (config_id, type, cron_expression) VALUES (?, 'DIFERENCIAL', ?)`, [id, h]);
            }
        }
        if (config.backup.transacao) {
            await db.run(`DELETE FROM BACKUP_TIME WHERE config_id = ? AND type = 'TRANSACAO'`, [id]);
            for (const h of config.backup.time_transacao) {
                await db.run(`INSERT INTO BACKUP_TIME (config_id, type, cron_expression) VALUES (?, 'TRANSACAO', ?)`, [id, h]);
            }
            for (const h of config.backup.time_diferencial) {
                await db.run(`INSERT INTO BACKUP_TIME (config_id, type, cron_expression) VALUES (?, 'DIFERENCIAL', ?)`, [id, h]);
            }
            for (const h of config.backup.time_transacao) {
                await db.run(`INSERT INTO BACKUP_TIME (config_id, type, cron_expression) VALUES (?, 'TRANSACAO', ?)`, [id, h]);
            }
        }
        console.log("✅ Configuração salva no banco SQLite");
    }
    else {
        console.log("❌ Erro ao salvar configuração");
    }
}
