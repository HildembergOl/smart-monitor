import { db } from "../../database/sqlserver";

export async function checkLogs(clientId: number) {
  try {
    const pool = await db("local");
    const result = await pool
      .request()
      .input("logNum", 0)
      .input("prodType", 1)
      .query(`EXEC xp_readerrorlog @logNum, @prodType`);

    const entries = result.recordset || [];

    // Filtramos para pegar apenas o que é relevante (Erros, Backups, DBCC) ou as últimas entradas
    const relevantLogs = entries
      .filter((entry: any) => {
        const text = (entry.Text || "").toLowerCase();
        return (
          text.includes("error") ||
          text.includes("failed") ||
          text.includes("dbcc") ||
          text.includes("backup") ||
          text.includes("checkdb")
        );
      })
      .slice(-25); // Pegamos as últimas 25 ocorrências relevantes

    const formattedLogs = relevantLogs
      .map((entry: any) => {
        const date = entry.LogDate
          ? new Date(entry.LogDate).toLocaleString("pt-BR")
          : "N/A";
        return `[${date}] [${entry.ProcessInfo || "???"}] ${entry.Text}`;
      })
      .join("\n\n");

    const hasError = relevantLogs.some((l: any) => {
      const t = (l.Text || "").toLowerCase();
      return (
        t.includes("error") ||
        t.includes("failed") ||
        t.includes("severity 16") ||
        t.includes("severity: 16")
      );
    });

    return {
      client_id: clientId,
      check: "LOGS",
      status: hasError ? "WARNING" : "OK",
      details: formattedLogs || "Nenhum log relevante encontrado no momento.",
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
