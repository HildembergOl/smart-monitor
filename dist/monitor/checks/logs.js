"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLogs = checkLogs;
const sqlserver_1 = require("../../database/sqlserver");
async function checkLogs(clientId) {
    try {
        const pool = await (0, sqlserver_1.db)("local");
        const result = await pool.request().query(`EXEC xp_readerrorlog 0, 1, 'error'`);
        return {
            client_id: clientId,
            check: "LOGS",
            status: "OK",
            details: JSON.stringify(result.recordset),
        };
    }
    catch (err) {
        if (err instanceof Error) {
            return {
                client_id: clientId,
                check: "LOGS",
                status: "FAIL",
                details: err.message,
            };
        }
        return {
            client_id: clientId,
            check: "LOGS",
            status: "FAIL",
            details: "Erro desconhecido",
        };
    }
}
