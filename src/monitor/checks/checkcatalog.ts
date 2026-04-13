import { db } from "../../database/sqlserver";

export async function checkCatalog(clientId: number) {
  try {
    const pool = await db("local");
    const result = await pool.request().query("DBCC CHECKCATALOG WITH NO_INFOMSGS;");

    if (!result.recordset || result.recordset.length === 0) {
      return {
        client_id: clientId,
        check: "CHECKCATALOG",
        status: "OK",
        details: "Catálogo do banco íntegro.",
      };
    }

    const errorMsgs = result.recordset.map((row: any) => row.MessageText).join(" | ");
    return {
      client_id: clientId,
      check: "CHECKCATALOG",
      status: "FAIL",
      details: errorMsgs.substring(0, 8000),
    };
  } catch (err) {
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
