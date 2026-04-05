"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCatalog = checkCatalog;
const sqlserver_1 = require("../../database/sqlserver");
async function checkCatalog(clientId) {
    try {
        const pool = await (0, sqlserver_1.db)("local");
        const result = await pool.request().query("DBCC CHECKCATALOG WITH NO_INFOMSGS, ALL_ERRORMSGS;");
        if (result.recordset.length === 0) {
            return {
                client_id: clientId,
                check: "CHECKCATALOG",
                status: "OK",
                details: "Catálogo do banco íntegro.",
            };
        }
        const errorMsgs = result.recordset.map((row) => row.MessageText).join(" | ");
        return {
            client_id: clientId,
            check: "CHECKCATALOG",
            status: "FAIL",
            details: errorMsgs.substring(0, 8000),
        };
    }
    catch (err) {
        if (err instanceof Error) {
            return {
                client_id: clientId,
                check: "CHECKCATALOG",
                status: "FAIL",
                details: err.message,
            };
        }
        return {
            client_id: clientId,
            check: "CHECKCATALOG",
            status: "FAIL",
            details: "Erro desconhecido",
        };
    }
}
