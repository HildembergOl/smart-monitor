import { db } from "../../database/sqlserver";

export async function checkFileGroup(clientId: number) {
  try {
    const pool = await db("local");
    const result = await pool.request().query("DBCC CHECKFILEGROUP WITH NO_INFOMSGS, ALL_ERRORMSGS;");

    if (!result.recordset || result.recordset.length === 0) {
      return {
        client_id: clientId,
        check: "CHECKFILEGROUP",
        status: "OK",
        details: "Filegroup íntegro.",
      };
    }

    const errorMsgs = result.recordset.map((row: any) => row.MessageText).join(" | ");
    return {
      client_id: clientId,
      check: "CHECKFILEGROUP",
      status: "FAIL",
      details: errorMsgs.substring(0, 8000),
    };
  } catch (err) {
    if (err instanceof Error) {
      return {
        client_id: clientId,
        check: "CHECKFILEGROUP",
        status: "FAIL",
        details: err.message,
      };
    }
    return {
      client_id: clientId,
      check: "CHECKFILEGROUP",
      status: "FAIL",
      details: "Erro desconhecido",
    };
  }
}
