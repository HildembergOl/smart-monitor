import { db } from "../../database/sqlserver";

export async function checkIndexes(clientId: number) {
  try {
    const pool = await db("local");
    const result = await pool.request().query(
      `
      SELECT 
        db_name(database_id) AS database_name,
        object_name(object_id) AS table_name,
        index_id,
        avg_fragmentation_in_percent
      FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED')
    `
    );

    return result.recordset.map((row: any) => ({
      client_id: clientId,
      database_name: row.database_name,
      table_name: row.table_name,
      index_id: row.index_id,
      fragmentation: row.avg_fragmentation_in_percent,
    }));
  } catch (err) {
    if (err instanceof Error) {
      return [
        {
          client_id: clientId,
          check: "INDEXES",
          status: "FAIL",
          details: err.message,
        },
      ];
    }
    return [
      {
        client_id: clientId,
        check: "INDEXES",
        status: "FAIL",
        details: "Erro desconhecido",
      },
    ];
  }
}
