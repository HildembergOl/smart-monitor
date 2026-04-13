import { salvarConfig } from "../database/sqlite-config";
import { executarBackup } from "./backup";
import { sendAlert } from "../@lib/notifier";
import readline from "readline";
import { validateClientCloud } from "../database/sqlserver";
import {
  dispararColetaMetricas,
  dispararSincronizacao,
  dispararVarreduraIntegridade,
} from "../monitor/manual_triggers";

const ask = (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
};

const askInt = async (query: string): Promise<number> => {
  const ans = await ask(query);
  return parseInt(ans) || 0;
};

const askYN = async (query: string): Promise<boolean> => {
  const ans = await ask(query + " (y/n): ");
  return ans.toLowerCase() === "y" || ans.toLowerCase() === "s";
};

export async function criarConfigCompleto() {
  console.log("⚙️ Criando configuração completa...");
  
  // Inicializa ambiente de produção para permitir validação via Cloud
  if (!global.AppConfig) global.AppConfig = {} as any;
  if (!global.AppConfig.ambiente) {
    global.AppConfig.ambiente = {
      local: {} as any,
      producao: {
        user: process.env.PROD_USER || "",
        password: process.env.PROD_PASS || "",
        server: process.env.PROD_SERVER || "",
        database: process.env.PROD_DATABASE || "",
        port: Number(process.env.PROD_PORT) || 1433,
        options: {
          encrypt: process.env.PROD_ENCRYPT === "1",
          trustServerCertificate: process.env.PROD_TRUST_CERT === "1",
        },
      },
    };
  }

  let clientId = 0;
  let enterprise = "";
  let validado = false;

  while (!validado) {
    clientId = await askInt("ID do Cliente (OBRIGATÓRIO - Atribuído no Cloud): ");
    if (clientId <= 0) {
      console.log("⚠️ O ID do Cliente é obrigatório e deve ser maior que zero.");
      continue;
    }
    enterprise = await ask("Nome da empresa (Exatamente como no Cloud): ");
    
    console.log("🔍 Validando código do cliente no Cloud...");
    const check = await validateClientCloud(clientId, enterprise);
    
    if (check.success) {
      console.log("✅ Validação concluída com sucesso!");
      validado = true;
    } else {
      console.log(`❌ Falha na validação: ${check.message}`);
      console.log("Por favor, verifique se o ID e o Nome estão corretos e tente novamente.\n");
    }
  }

  const host = await ask("Host do SQL Server: ");
  const usuario = await ask("Usuário do SQL Server: ");
  const password = await ask("Senha do SQL Server: ");
  const port = (await askInt("Porta do SQL Server: ")) || 1433;
  const local_path = await ask("Pasta local para backups: ");
  const remote_path = await ask("Pasta compartilhada: ");
  const compressao = await askYN("Deseja compactar os backups em ZIP? ");
  const full = await askYN("Deseja habilitar backup FULL? ");
  const time_full = full
    ? (await ask("Informe horários cron separados por vírgula: ")).split(",")
    : [];
  const diferencial = await askYN("Deseja habilitar backup diferencial? ");
  const time_diferencial = diferencial
    ? [await ask("Informe horários cron para diferencial: ")]
    : [];
  const transacao = await askYN(
    "Deseja habilitar backup de log de transações? ",
  );
  const time_transacao = transacao
    ? [await ask("Informe horários cron para transação: ")]
    : [];
  const retencao = await askInt("Dias de retenção dos backups: ");

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
      port: Number(process.env.EMAIL_PORT) || 465,
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

  global.AppConfig.client_id = clientId;
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
  console.log("1 - ID do Cliente");
  console.log("2 - Empresa");
  console.log("3 - Host");
  console.log("4 - Usuário");
  console.log("5 - Senha");
  console.log("6 - Porta");
  console.log("7 - Pasta local");
  console.log("8 - Pasta compartilhada");
  console.log("9 - Compressão ZIP");
  console.log("10 - Horários FULL");
  console.log("11 - Horários Diferencial");
  console.log("12 - Horários Transação");
  console.log("13 - Retenção (dias)");
  console.log("14 - Testar Backup FULL");
  console.log("15 - Testar Backup Diferencial");
  console.log("16 - Testar Backup Transação");
  console.log("17 - Testar Envio de Email");
  console.log("18 - Testar Coleta de Métricas");
  console.log("19 - Varredura de Integridade (DBCC)");
  console.log("20 - Testar Sincronização Cloud");
  console.log("0 - Cancelar");

  const input = await ask("\nEscolha uma opção (ou Enter para cancelar): ");
  if (input.trim() === "") return;
  const escolha = parseInt(input);

  switch (escolha) {
    case 1: {
      const oldId = config.client_id;
      const newId = await askInt(` \nNovo ID do Cliente (atual: ${oldId}): \n`);
      if (newId <= 0) {
        console.log("⚠️ ID inválido.");
        break;
      }
      console.log("🔍 Validando novo ID no Cloud...");
      const check = await validateClientCloud(newId, config.enterprise);
      if (check.success) {
        config.client_id = newId;
        console.log("✅ ID alterado e validado com sucesso!");
      } else {
        console.log(`❌ Falha na validação: ${check.message}`);
        console.log("Alteração descartada.");
      }
      break;
    }
    case 2: {
      const oldName = config.enterprise;
      const newName = await ask("\nNovo nome da empresa: \n");
      if (!newName.trim()) {
        console.log("⚠️ Nome inválido.");
        break;
      }
      console.log("🔍 Validando novo nome no Cloud...");
      const check = await validateClientCloud(config.client_id, newName);
      if (check.success) {
        config.enterprise = newName;
        console.log("✅ Empresa alterada e validada com sucesso!");
      } else {
        console.log(`❌ Falha na validação: ${check.message}`);
        console.log("Alteração descartada.");
      }
      break;
    }
    case 3:
      config.ambiente.local.server = await ask("\nNovo host: \n");
      break;
    case 4:
      config.ambiente.local.user = await ask("\nNovo usuário: \n");
      break;
    case 5:
      config.ambiente.local.password = await ask("\nNova senha: \n");
      break;
    case 6:
      config.ambiente.local.port = await askInt(
        ` \nNova porta (atual: ${config.ambiente.local.port}): \n`,
      );
      break;
    case 7:
      config.backup.local_path = await ask(
        ` \nNova pasta local (atual: ${config.backup.local_path}): \n`,
      );
      break;
    case 8:
      config.backup.remote_path = await ask(
        ` \nNova pasta compartilhada (atual: ${config.backup.remote_path}): \n`,
      );
      break;
    case 9:
      config.backup.compressao = await askYN("\nCompactar em ZIP? \n");
      break;
    case 10:
      config.backup.time_full = (
        await ask("\nNovos horários FULL (separados por vírgula): \n")
      ).split(",");
      break;
    case 11:
      config.backup.time_diferencial = (
        await ask("\nNovos horários Diferencial (separados por vírgula): \n")
      ).split(",");
      break;
    case 12:
      config.backup.time_transacao = (
        await ask("\nNovos horários Transação (separados por vírgula): \n")
      ).split(",");
      break;
    case 13:
      config.backup.retencao = await askInt("\nNova retenção em dias: \n");
      break;
    case 14:
      await executarBackup("full");
      break;
    case 15:
      await executarBackup("diferencial");
      break;
    case 16:
      await executarBackup("transacao");
      break;
    case 17:
      await sendAlert("TESTE", "Backup realizado com sucesso!");
      break;
    case 18:
      await dispararColetaMetricas();
      break;
    case 19:
      await dispararVarreduraIntegridade();
      break;
    case 20:
      await dispararSincronizacao();
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
