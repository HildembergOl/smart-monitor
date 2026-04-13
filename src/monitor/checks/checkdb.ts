import { db } from "../../database/sqlserver";

export async function checkDBIntegrity(clientId: number) {
  try {
    const pool = await db("local");
    const result = await pool
      .request()
      .query("DBCC CHECKDB WITH NO_INFOMSGS, ALL_ERRORMSGS;");

    // Se o banco estiver saudável e usarmos NO_INFOMSGS, o recordset pode vir indefinido ou zerado
    if (!result.recordset || result.recordset.length === 0) {
      return {
        client_id: clientId,
        check: "CHECKDB",
        status: "OK",
        details: "Banco de dados íntegro e saudável.",
      };
    }

    // Se retornou alguma linha, significa que existem erros de corrupção
    const errorMsgs = result.recordset
      .map((row: any) => row.MessageText)
      .join(" | ");
    return {
      client_id: clientId,
      check: "CHECKDB",
      status: "FAIL",
      details: errorMsgs.substring(0, 8000), // Limitamos o tamanho do texto para segurança do log
    };
  } catch (err) {
    if (err instanceof Error) {
      return {
        client_id: clientId,
        check: "CHECKDB",
        status: "FAIL",
        details: err.message,
      };
    }
    return {
      client_id: clientId,
      check: "CHECKDB",
      status: "FAIL",
      details: "Erro desconhecido",
    };
  }
}
