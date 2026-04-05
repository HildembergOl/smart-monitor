import { dbSqlite } from "./sqlite";

export async function initDB() {
  const db = await dbSqlite();

  // Tabela principal de Configuração
  await db.exec(`
    CREATE TABLE IF NOT EXISTS CONFIG (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise TEXT,

      -- Ambiente Local
      local_user TEXT,
      local_password TEXT,
      local_server TEXT,
      local_database TEXT,
      local_encrypt INTEGER,
      local_trustServerCertificate INTEGER,
      local_port INTEGER,

      -- Ambiente Produção
      prod_user TEXT,
      prod_password TEXT,
      prod_server TEXT,
      prod_database TEXT,
      prod_encrypt INTEGER,
      prod_trustServerCertificate INTEGER,
      prod_port INTEGER,

      -- Configuração de E-mail
      email_host TEXT,
      email_port INTEGER,
      email_secure INTEGER,
      email_auth_user TEXT,
      email_auth_pass TEXT,
      email_to TEXT,

      -- Configuração de Backup
      backup_local_path TEXT,
      backup_remote_path TEXT,
      backup_compressao INTEGER,
      backup_full INTEGER,
      backup_diferencial INTEGER,
      backup_transacao INTEGER,
      backup_retencao INTEGER
    );
  `);

  // Tabela única para horários de backup
  await db.exec(`
    CREATE TABLE IF NOT EXISTS BACKUP_TIME (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_id INTEGER,
      type TEXT,              -- 'FULL', 'DIFERENCIAL', 'TRANSACAO'
      cron_expression TEXT,
      FOREIGN KEY(config_id) REFERENCES CONFIG(id)
    );
  `);

  // Logs de verificações
  await db.exec(`
    CREATE TABLE IF NOT EXISTS CHECKS_LOG (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      check_name TEXT,  
      status TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0,
      offline INTEGER DEFAULT 0
    );
  `);

  // Métricas rápidas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS METRICS (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      cpu_usage REAL,
      memory_usage REAL,
      active_sessions INTEGER,
      avg_query_time REAL,
      deadlocks INTEGER,
      db_state TEXT,
      free_disk_space REAL,
      last_backup DATETIME,
      failed_logins INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0,
      offline INTEGER DEFAULT 0
    );
  `);

  // Backups
  await db.exec(`
    CREATE TABLE IF NOT EXISTS BACKUP_LOG (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      database_name TEXT,
      last_backup DATETIME,
      backup_type TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0,
      offline INTEGER DEFAULT 0
    );
  `);

  // Alertas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ALERTS (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      severity TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0,
      offline INTEGER DEFAULT 0
    );
  `);

  // Migrações dinâmicas (adicionando colunas em bancos já existentes)
  try {
    await db.exec(`ALTER TABLE CONFIG ADD COLUMN email_to TEXT`);
    console.log("🔄 Migração: Coluna 'email_to' adicionada à tabela CONFIG.");
  } catch (error) {
    // A coluna provavelmente já existe, podemos ignorar o erro do SQLite
    console.log("🔄 Migração: Coluna 'email_to' já existe na tabela CONFIG.");
  } finally {
    console.log("🔄 Migração: Alteração concluída.");
  }

  try {
    await db.exec(`ALTER TABLE CONFIG ADD COLUMN local_port INTEGER`);
    console.log("🔄 Migração: Coluna 'local_port' adicionada à tabela CONFIG.");
  } catch (error) {
    // A coluna provavelmente já existe, podemos ignorar o erro do SQLite
    console.log("🔄 Migração: Coluna 'local_port' já existe na tabela CONFIG.");
  } finally {
    console.log("🔄 Migração: Alteração concluída.");
  }

  try {
    await db.exec(`ALTER TABLE CONFIG ADD COLUMN prod_port INTEGER`);
    console.log("🔄 Migração: Coluna 'prod_port' adicionada à tabela CONFIG.");
  } catch (error) {
    // A coluna provavelmente já existe, podemos ignorar o erro do SQLite
    console.log("🔄 Migração: Coluna 'prod_port' já existe na tabela CONFIG.");
  } finally {
    console.log("🔄 Migração: Alteração concluída.");
  }

  console.log("✅ Banco smart-monitor.db inicializado e protegido com senha!");
}
