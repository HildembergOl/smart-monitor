"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDBIntegrity = checkDBIntegrity;
const sqlserver_1 = require("../../database/sqlserver");
async function checkDBIntegrity(clientId) {
    try {
        const pool = await (0, sqlserver_1.db)("local");
        const result = await pool
            .request()
            .query("DBCC CHECKDB WITH NO_INFOMSGS, ALL_ERRORMSGS;");
        // O pulo do gato: se usar NO_INFOMSGS e o banco estiver 100% saudável,
        // o SQL Server não retorna NADA (um array vazio).
        if (result.recordset.length === 0) {
            return {
                client_id: clientId,
                check: "CHECKDB",
                status: "OK",
                details: "Banco de dados íntegro e saudável.",
            };
        }
        // Se retornou alguma linha, significa que existem erros de corrupção
        const errorMsgs = result.recordset
            .map((row) => row.MessageText)
            .join(" | ");
        return {
            client_id: clientId,
            check: "CHECKDB",
            status: "FAIL",
            details: errorMsgs.substring(0, 8000), // Limitamos o tamanho do texto para segurança do log
        };
    }
    catch (err) {
        if (err instanceof Error) {
            return {
                client_id: clientId,
                check: "CHECKDB",
                status: "FAIL",
                details: err.message,
            };
        }
        return {
            client_id: clientId,
            check: "CHECKDB",
            status: "FAIL",
            details: "Erro desconhecido",
        };
    }
}
