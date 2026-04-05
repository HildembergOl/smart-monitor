"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkConstraints = checkConstraints;
const sqlserver_1 = require("../../database/sqlserver");
async function checkConstraints(clientId) {
    try {
        const pool = await (0, sqlserver_1.db)("local");
        const result = await pool.request().query("DBCC CHECKCONSTRAINTS WITH NO_INFOMSGS, ALL_ERRORMSGS;");
        if (result.recordset.length === 0) {
            return {
                client_id: clientId,
                check: "CHECKCONSTRAINTS",
                status: "OK",
                details: "Todas as constraints íntegras.",
            };
        }
        const errorMsgs = result.recordset.map((row) => row.MessageText).join(" | ");
        return {
            client_id: clientId,
            check: "CHECKCONSTRAINTS",
            status: "FAIL",
            details: errorMsgs.substring(0, 8000),
        };
    }
    catch (err) {
        if (err instanceof Error) {
            return {
                client_id: clientId,
                check: "CHECKCONSTRAINTS",
                status: "FAIL",
                details: err.message,
            };
        }
        return {
            client_id: clientId,
            check: "CHECKCONSTRAINTS",
            status: "FAIL",
            details: "Erro desconhecido",
        };
    }
}
