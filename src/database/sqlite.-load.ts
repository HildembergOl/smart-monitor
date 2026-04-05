import { criarConfigCompleto } from "../backup/menu";
import { dbSqlite } from "./sqlite";
import { AppConfiguration } from "../interfaces/appConfiguration";

// Variável global que conterá as configurações carregadas
global["AppConfig"] = {} as AppConfiguration;

export async function loadConfig() {
  const db = await dbSqlite();

  // Lê a configuração principal (assumindo apenas 1 registro)
  const configRow = await db.get(`SELECT * FROM CONFIG LIMIT 1`);

  if (!configRow) {
    console.error("❌ Nenhuma configuração encontrada na tabela CONFIG.");
    console.log("Por favor, crie uma configuração.");
    return await criarConfigCompleto();
  }

  // Lê os horários de backup relacionados
  const backupTimes = await db.all(
    `SELECT type, cron_expression FROM BACKUP_TIME WHERE config_id = ?`,
    [configRow.id],
  );

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

  // 🛡️ REGRAS DE AUTORIDADE (THE BUILD IS THE LAW)
  // Sobrescreve OBRIGATORIAMENTE o que veio do banco SQLite com o que foi definido no Build/Env
  // Isso impede que alterações manuais no arquivo .db alterem o comportamento da nuvem/segurança.
  if (process.env.PROD_SERVER) config.ambiente.producao.server = process.env.PROD_SERVER;
  if (process.env.PROD_USER) config.ambiente.producao.user = process.env.PROD_USER;
  if (process.env.PROD_PASS) config.ambiente.producao.password = process.env.PROD_PASS;
  if (process.env.PROD_DATABASE) config.ambiente.producao.database = process.env.PROD_DATABASE;
  if (process.env.PROD_PORT) config.ambiente.producao.port = Number(process.env.PROD_PORT);
  if (process.env.PROD_ENCRYPT) config.ambiente.producao.options.encrypt = process.env.PROD_ENCRYPT === "1";
  if (process.env.PROD_TRUST_CERT) config.ambiente.producao.options.trustServerCertificate = process.env.PROD_TRUST_CERT === "1";

  if (process.env.EMAIL_HOST) config.email.host = process.env.EMAIL_HOST;
  if (process.env.EMAIL_PORT) config.email.port = Number(process.env.EMAIL_PORT);
  if (process.env.EMAIL_USER) config.email.auth.user = process.env.EMAIL_USER;
  if (process.env.EMAIL_PASS) config.email.auth.pass = process.env.EMAIL_PASS;
  if (process.env.EMAIL_TO) config.email.to = process.env.EMAIL_TO;
  if (process.env.EMAIL_SECURE) config.email.secure = process.env.EMAIL_SECURE === "1";

  // Disponibiliza em variável global
  global.AppConfig = config;

  console.log("✅ Configurações carregadas em AppConfig");
  return config;
}
