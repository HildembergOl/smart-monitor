"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBackups = checkBackups;
const sqlserver_1 = require("../../database/sqlserver");
async function checkBackups(clientId) {
    try {
        const pool = await (0, sqlserver_1.db)("local");
        const result = await pool.request().query(`
      SELECT 
        d.name AS database_name,
        MAX(b.backup_finish_date) AS last_backup,
        CASE b.type 
          WHEN 'D' THEN 'FULL'
          WHEN 'I' THEN 'DIFF'
          WHEN 'L' THEN 'LOG'
          ELSE 'UNKNOWN'
        END AS backup_type
      FROM sys.databases d
      LEFT JOIN msdb.dbo.backupset b ON d.name = b.database_name
      GROUP BY d.name, b.type
    `);
        return result.recordset.map((row) => ({
            client_id: clientId,
            database_name: row.database_name,
            last_backup: row.last_backup,
            backup_type: row.backup_type,
            status: row.last_backup ? "OK" : "FAIL",
            details: "Dados do backup recuperados com sucesso",
        }));
    }
    catch (err) {
        if (err instanceof Error) {
            return [
                {
                    client_id: clientId,
                    database_name: "UNKNOWN",
                    last_backup: null,
                    backup_type: "UNKNOWN",
                    status: "FAIL",
                    details: err.message,
                },
            ];
        }
        return [
            {
                client_id: clientId,
                database_name: "UNKNOWN",
                last_backup: null,
                backup_type: "UNKNOWN",
                status: "FAIL",
                details: "Erro desconhecido",
            },
        ];
    }
}
