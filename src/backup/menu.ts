import readlineSync from "readline-sync";
import { salvarConfig } from "../database/sqlite-config";

export async function criarConfigCompleto() {
  console.log("⚙️ Criando configuração completa...");
  const enterprise = readlineSync.question("Nome da empresa: ");
  const host = readlineSync.question("Host do SQL Server: ");
  const usuario = readlineSync.question("Usuário do SQL Server: ");
  const password = readlineSync.question("Senha do SQL Server: ", {
    hideEchoBack: true,
  });
  const port = readlineSync.questionInt("Porta do SQL Server: ") || 1433;
  const local_path = readlineSync.question("Pasta local para backups: ");
  const remote_path = readlineSync.question("Pasta compartilhada: ");
  const compressao = readlineSync.keyInYNStrict(
    "Deseja compactar os backups em ZIP? ",
  );
  const full = readlineSync.keyInYNStrict("Deseja habilitar backup FULL? ");
  const time_full = full
    ? readlineSync
        .question("Informe horários cron separados por vírgula: ")
        .split(",")
    : [];
  const diferencial = readlineSync.keyInYNStrict(
    "Deseja habilitar backup diferencial? ",
  );
  const time_diferencial = diferencial
    ? [readlineSync.question("Informe horários cron para diferencial: ")]
    : [];
  const transacao = readlineSync.keyInYNStrict(
    "Deseja habilitar backup de log de transações? ",
  );
  const time_transacao = transacao
    ? [readlineSync.question("Informe horários cron para transação: ")]
    : [];
  const retencao = readlineSync.questionInt("Dias de retenção dos backups: ");

  if (!global.AppConfig?.ambiente) {
    global.AppConfig.ambiente = {
      local: {
        user: "",
        password: "",
        server: "",
        database: "",
        port: 1433,
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      },
      producao: {
        user: process.env.PROD_USER || "",
        password: process.env.PROD_PASS || "",
        server: process.env.PROD_SERVER || "",
        database: process.env.PROD_DATABASE || "",
        port: Number(process.env.PROD_PORT) || 1433,
        options: {
          encrypt: process.env.PROD_ENCRYPT === "1" ? true : false,
          trustServerCertificate:
            process.env.PROD_TRUST_CERT === "1" ? true : false,
        },
      },
    };
  }

  if (!global.AppConfig?.email) {
    global.AppConfig.email = {
      host: process.env.EMAIL_HOST || "",
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "1" ? true : false,
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
      },
      to: process.env.EMAIL_TO || "",
    };
  }

  if (!global.AppConfig?.backup) {
    global.AppConfig.backup = {
      local_path: "",
      remote_path: "",
      compressao: false,
      full: false,
      diferencial: false,
      transacao: false,
      retencao: 0,
      time_full: [],
      time_diferencial: [],
      time_transacao: [],
    };
  }

  global.AppConfig.enterprise = enterprise;
  global.AppConfig.ambiente.local.server = host;
  global.AppConfig.ambiente.local.user = usuario;
  global.AppConfig.ambiente.local.password = password;
  global.AppConfig.ambiente.local.port = port;
  global.AppConfig.backup.local_path = local_path;
  global.AppConfig.backup.remote_path = remote_path;
  global.AppConfig.backup.compressao = compressao;
  global.AppConfig.backup.full = full ? true : false;
  global.AppConfig.backup.time_full = time_full;
  global.AppConfig.backup.diferencial = diferencial ? true : false;
  global.AppConfig.backup.time_diferencial = time_diferencial;
  global.AppConfig.backup.transacao = transacao ? true : false;
  global.AppConfig.backup.time_transacao = time_transacao;
  global.AppConfig.backup.retencao = retencao;

  await salvarConfig();

  return global.AppConfig;
}

export async function editarConfig() {
  const config = global.AppConfig;
  if (!config) {
    console.error("❌ Nenhuma configuração encontrada na tabela Config.");
    return;
  }

  console.log("\n🔄 Menu de edição de configuração:");
  console.log("1 - Empresa");
  console.log("2 - Host");
  console.log("3 - Usuário");
  console.log("4 - Senha");
  console.log("5 - Porta");
  console.log("6 - Pasta local");
  console.log("7 - Pasta compartilhada");
  console.log("8 - Compressão ZIP");
  console.log("9 - Horários FULL");
  console.log("10 - Horários Diferencial");
  console.log("11 - Horários Transação");
  console.log("12 - Retenção (dias)");
  console.log("0 - Cancelar");

  const escolha = readlineSync.questionInt("Escolha uma opção: ");

  switch (escolha) {
    case 1:
      config.enterprise = readlineSync.question("\nNovo nome da empresa: \n");
      break;
    case 2:
      config.ambiente.local.server = readlineSync.question("\nNovo host: \n");
      break;
    case 3:
      config.ambiente.local.user = readlineSync.question("\nNovo usuário: \n");
      break;
    case 4:
      config.ambiente.local.password = readlineSync.question(
        "\nNova senha: \n",
        {
          hideEchoBack: true,
        },
      );
      break;
    case 5:
      config.backup.local_path = readlineSync.question(
        "\nNova pasta local: \n",
      );
      break;
    case 6:
      config.backup.remote_path = readlineSync.question(
        "\nNova pasta compartilhada: \n",
      );
      break;
    case 6:
      config.backup.compressao = readlineSync.keyInYNStrict(
        "\nCompactar em ZIP? \n",
      );
      break;
    case 7:
      config.backup.time_full = readlineSync
        .question("\nNovos horários FULL (separados por vírgula): \n")
        .split(",");
      break;
    case 8:
      config.backup.time_diferencial = readlineSync
        .question("\nNovos horários Diferencial (separados por vírgula): \n")
        .split(",");
      break;
    case 9:
      config.backup.time_transacao = readlineSync
        .question("\nNovos horários Transação (separados por vírgula): \n")
        .split(",");
      break;
    case 10:
      config.backup.retencao = readlineSync.questionInt(
        "\nNova retenção em dias: \n",
      );
      break;
    case 0:
      console.log("\nCancelado.\n");
      return;
    default:
      console.log("\nOpção inválida.\n");
      return;
  }
  await salvarConfig();
  return config;
}
