import { iniciarAgendamentos } from "./backup/scheduler";
import { dbSqlite } from "./database/sqlite";
import { initDB } from "./database/sqlite-init";
import { loadConfig } from "./database/sqlite.-load";
import { editarConfig } from "./backup/menu";
import readline from "readline";
import { startScheduler } from "./monitor/scheduler";

// Captura fechamento do CMD (Clicar no X), SIGTERM ou SIGINT do Sistema Operacional
const gracefulShutdown = async (signal: string) => {
  console.log(
    `\n${signal} recebido. Tentando salvar log de encerramento rápido...`,
  );
  try {
    const db = await dbSqlite();
    await db.run("INSERT INTO ALERTS (severity, message) VALUES (?, ?)", [
      "INFO",
      `Smart Monitor encerrado via sistema (${signal})`,
    ]);
  } catch (e) {
    console.error("Erro ao salvar log no encerramento abrupto:", e);
  }
  process.exit(0);
};

let menuActive = false;

// 🎹 Manuseio manual de teclas para evitar conflitos de stream
const handleInput = async (data: Buffer) => {
  if (menuActive) return;

  const hex = data.toString("hex");

  // Captura CTRL+C (\x03)
  if (hex === "03") {
    console.log("\n👋 Encerrando Smart Monitor...");
    try {
      const db = await dbSqlite();
      await db.run("INSERT INTO ALERTS (severity, message) VALUES (?, ?)", [
        "INFO",
        `Smart Monitor encerrado`,
      ]);
    } catch (e) {
      console.error("Falha ao salvar log de encerramento:", e);
    }
    process.exit(0);
  }

  // Captura CTRL+R (\x12)
  if (hex === "12") {
    console.log("\n🔄 Atalho CTRL+R detectado!");

    menuActive = true;

    // Desativa modo bruto e remove listener para o menu
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.removeListener("data", handleInput);

    await editarConfig();
    iniciarAgendamentos();

    // Reativa modo bruto e listener
    if (process.stdin.isTTY) {
      // Limpa o buffer de entrada
      while (process.stdin.read() !== null);
      process.stdin.setRawMode(true);
    }
    process.stdin.on("data", handleInput);
    process.stdin.resume();

    menuActive = false;
    console.log("\n✅ Monitoramento retomado. (CTRL+R: Menu | CTRL+C: Sair)");
  }
};

process.stdin.on("data", handleInput);

// Previne o encerramento da aplicação por erros não tratados
process.on("uncaughtException", async (error) => {
  console.error("🔥 Erro Crítico não Tratado (uncaughtException):", error);
  try {
    const db = await dbSqlite();
    await db.run("INSERT INTO ALERTS (severity, message) VALUES (?, ?)", [
      "CRITICAL",
      `Erro não tratado: ${error.message}\nStack: ${error.stack}`,
    ]);
  } catch (e) {
    console.error("Falha ao salvar erro crítico no SQLite", e);
  }
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error(
    "🔥 Rejeição de Promise não Tratada (unhandledRejection):",
    reason,
  );
  try {
    const message =
      reason instanceof Error
        ? `${reason.message}\nStack: ${reason.stack}`
        : String(reason);
    const db = await dbSqlite();
    await db.run("INSERT INTO ALERTS (severity, message) VALUES (?, ?)", [
      "CRITICAL",
      `Rejeição não tratada: ${message}`,
    ]);
  } catch (e) {
    console.error("Falha ao salvar rejeição de promise no SQLite", e);
  }
});

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGHUP", () => gracefulShutdown("SIGHUP"));

process.on("exit", () => {
  console.log("Encerrando Smart Monitor... 🔴");
});

async function main() {
  try {
    await dbSqlite()
      .then(() => {
        console.log("Conectado ao banco de dados");
      })
      .catch((err) => {
        console.error("Erro ao conectar ao banco de dados:", err);
      });

    // Log de inicialização concluída
    try {
      const dbInit = await dbSqlite();
      await dbInit.run("INSERT INTO ALERTS (severity, message) VALUES (?, ?)", [
        "INFO",
        "Smart Monitor iniciado com sucesso",
      ]);
      console.log("🚀 Aplicação iniciada e log registrada no banco.");
    } catch (e) {
      console.error("Falha ao salvar log de inicialização no SQLite", e);
    }

    await initDB().catch((err) => {
      console.error("Erro ao inicializar banco de dados:", err);
    });

    await loadConfig().catch((err) => {
      console.error("❌ Erro ao carregar configurações:", err);
    });

    iniciarAgendamentos();

    // Ativa a escuta de atalhos (Raw Mode) apenas após toda a inicialização
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
    }

    startScheduler();
  } catch (error) {
    console.error("Erro ao iniciar aplicação:", error);
  }
}

main().catch(async (error) => {
  console.error("Erro ao iniciar aplicação:", error);
  try {
    const db = await dbSqlite();
    await db.run("INSERT INTO ALERTS (severity, message) VALUES (?, ?)", [
      "CRITICAL",
      `Erro fatal ao iniciar: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  } catch (e) {
    console.error("Falha ao salvar erro de inicialização no SQLite:", e);
  }
});
