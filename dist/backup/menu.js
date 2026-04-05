"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarConfigCompleto = criarConfigCompleto;
exports.editarConfig = editarConfig;
const readline_sync_1 = __importDefault(require("readline-sync"));
const sqlite_config_1 = require("../database/sqlite-config");
async function criarConfigCompleto() {
    console.log("⚙️ Criando configuração completa...");
    const enterprise = readline_sync_1.default.question("Nome da empresa: ");
    const host = readline_sync_1.default.question("Host do SQL Server: ");
    const usuario = readline_sync_1.default.question("Usuário do SQL Server: ");
    const password = readline_sync_1.default.question("Senha do SQL Server: ", {
        hideEchoBack: true,
    });
    const port = readline_sync_1.default.questionInt("Porta do SQL Server: ") || 1433;
    const local_path = readline_sync_1.default.question("Pasta local para backups: ");
    const remote_path = readline_sync_1.default.question("Pasta compartilhada: ");
    const compressao = readline_sync_1.default.keyInYNStrict("Deseja compactar os backups em ZIP? ");
    const full = readline_sync_1.default.keyInYNStrict("Deseja habilitar backup FULL? ");
    const time_full = full
        ? readline_sync_1.default
            .question("Informe horários cron separados por vírgula: ")
            .split(",")
        : [];
    const diferencial = readline_sync_1.default.keyInYNStrict("Deseja habilitar backup diferencial? ");
    const time_diferencial = diferencial
        ? [readline_sync_1.default.question("Informe horários cron para diferencial: ")]
        : [];
    const transacao = readline_sync_1.default.keyInYNStrict("Deseja habilitar backup de log de transações? ");
    const time_transacao = transacao
        ? [readline_sync_1.default.question("Informe horários cron para transação: ")]
        : [];
    const retencao = readline_sync_1.default.questionInt("Dias de retenção dos backups: ");
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
        };
    }
    if (!global.AppConfig?.email) {
        global.AppConfig.email = {
            host: "smtp.titan.email",
            port: 587,
            secure: true,
            auth: {
                user: "naoresponder@devsmart.com",
                pass: "devSmart@80@",
            },
            to: "projetos@devsmart.com.br;gleison@devsmart.com.br",
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
    await (0, sqlite_config_1.salvarConfig)();
    return global.AppConfig;
}
async function editarConfig() {
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
    const escolha = readline_sync_1.default.questionInt("Escolha uma opção: ");
    switch (escolha) {
        case 1:
            config.enterprise = readline_sync_1.default.question("\nNovo nome da empresa: \n");
            break;
        case 2:
            config.ambiente.local.server = readline_sync_1.default.question("\nNovo host: \n");
            break;
        case 3:
            config.ambiente.local.user = readline_sync_1.default.question("\nNovo usuário: \n");
            break;
        case 4:
            config.ambiente.local.password = readline_sync_1.default.question("\nNova senha: \n", {
                hideEchoBack: true,
            });
            break;
        case 5:
            config.backup.local_path = readline_sync_1.default.question("\nNova pasta local: \n");
            break;
        case 6:
            config.backup.remote_path = readline_sync_1.default.question("\nNova pasta compartilhada: \n");
            break;
        case 6:
            config.backup.compressao = readline_sync_1.default.keyInYNStrict("\nCompactar em ZIP? \n");
            break;
        case 7:
            config.backup.time_full = readline_sync_1.default
                .question("\nNovos horários FULL (separados por vírgula): \n")
                .split(",");
            break;
        case 8:
            config.backup.time_diferencial = readline_sync_1.default
                .question("\nNovos horários Diferencial (separados por vírgula): \n")
                .split(",");
            break;
        case 9:
            config.backup.time_transacao = readline_sync_1.default
                .question("\nNovos horários Transação (separados por vírgula): \n")
                .split(",");
            break;
        case 10:
            config.backup.retencao = readline_sync_1.default.questionInt("\nNova retenção em dias: \n");
            break;
        case 0:
            console.log("\nCancelado.\n");
            return;
        default:
            console.log("\nOpção inválida.\n");
            return;
    }
    await (0, sqlite_config_1.salvarConfig)();
    return config;
}
