import { db } from "../../database/sqlserver";

export async function checkLogs(clientId: number) {
  try {
    const pool = await db("local");
    const result = await pool.request().query(`EXEC xp_readerrorlog 0, 1, 'error'`);
    return {
      client_id: clientId,
      check: "LOGS",
      status: "OK",
      details: JSON.stringify(result.recordset),
    };
  } catch (err) {
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
