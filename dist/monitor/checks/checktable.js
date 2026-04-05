"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTable = checkTable;
const sqlserver_1 = require("../../database/sqlserver");
async function checkTable(clientId, tableName) {
    try {
        const pool = await (0, sqlserver_1.db)("local");
        const result = await pool.request().query(`DBCC CHECKTABLE('${tableName}') WITH NO_INFOMSGS, ALL_ERRORMSGS;`);
        if (result.recordset.length === 0) {
            return {
                client_id: clientId,
                check: "CHECKTABLE",
                status: "OK",
                details: `Tabela ${tableName} íntegra.`,
            };
        }
        const errorMsgs = result.recordset.map((row) => row.MessageText).join(" | ");
        return {
            client_id: clientId,
            check: "CHECKTABLE",
            status: "FAIL",
            details: errorMsgs.substring(0, 8000),
        };
    }
    catch (err) {
        if (err instanceof Error) {
            return {
                client_id: clientId,
                check: "CHECKTABLE",
                status: "FAIL",
                details: err.message,
            };
        }
        return {
            client_id: clientId,
            check: "CHECKTABLE",
            status: "FAIL",
            details: "Erro desconhecido",
        };
    }
}
