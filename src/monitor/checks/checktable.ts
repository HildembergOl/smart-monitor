import { db } from "../../database/sqlserver";

export async function checkTable(clientId: number, tableName: string) {
  try {
    const pool = await db("local");
    const result = await pool.request().query(`DBCC CHECKTABLE('${tableName}') WITH NO_INFOMSGS, ALL_ERRORMSGS;`);

    if (result.recordset.length === 0) {
      return {
        client_id: clientId,
        check: "CHECKTABLE",
        status: "OK",
        details: `Tabela ${tableName} íntegra.`,
      };
    }

    const errorMsgs = result.recordset.map((row: any) => row.MessageText).join(" | ");
    return {
      client_id: clientId,
      check: "CHECKTABLE",
      status: "FAIL",
      details: errorMsgs.substring(0, 8000),
    };
  } catch (err) {
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
