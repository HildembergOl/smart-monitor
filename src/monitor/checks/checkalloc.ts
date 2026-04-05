import { db } from "../../database/sqlserver";

export async function checkAlloc(clientId: number) {
  try {
    const pool = await db("local");
    const result = await pool
      .request()
      .query("DBCC CHECKALLOC WITH NO_INFOMSGS, ALL_ERRORMSGS;");

    if (result.recordset.length === 0) {
      return {
        client_id: clientId,
        check: "CHECKALLOC",
        status: "OK",
        details: "Alocação do banco de dados íntegra e saudável.",
      };
    }

    const errorMsgs = result.recordset
      .map((row: any) => row.MessageText)
      .join(" | ");

    return {
      client_id: clientId,
      check: "CHECKALLOC",
      status: "FAIL",
      details: errorMsgs.substring(0, 8000),
    };
  } catch (err) {
    if (err instanceof Error) {
      return {
        client_id: clientId,
        check: "CHECKALLOC",
        status: "FAIL",
        details: err.message,
      };
    }
    return {
      client_id: clientId,
      check: "CHECKALLOC",
      status: "FAIL",
      details: "Erro desconhecido",
    };
  }
}
