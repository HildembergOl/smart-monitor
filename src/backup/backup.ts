import path from "path";
import archiver from "archiver";
import fs from "fs";
import fse from "fs-extra";
import { db } from "../database/sqlserver";

export async function executarBackup(
  tipo: "full" | "diferencial" | "transacao",
) {
  try {
    const config = global.AppConfig?.backup;
    if (!config) {
      console.error("❌ Nenhuma configuração encontrada na tabela Config.");
      return;
    }
    const pool = await db("local");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(
      config.local_path || "",
      `Backup_${tipo}_${timestamp}.bak`,
    );

    const request = pool.request();
    let query = "";

    switch (tipo) {
      case "full":
        query = `BACKUP DATABASE NomeDoBanco TO DISK = '${backupFile}' WITH INIT, COMPRESSION;`;
        break;
      case "diferencial":
        query = `BACKUP DATABASE NomeDoBanco TO DISK = '${backupFile}' WITH DIFFERENTIAL, INIT, COMPRESSION;`;
        break;
      case "transacao":
        query = `BACKUP LOG NomeDoBanco TO DISK = '${backupFile}' WITH INIT;`;
        break;
    }

    await request.query(query);
    console.log(`Backup ${tipo} concluído: ${backupFile}`);

    let finalFile = backupFile;
    if (config.compressao) {
      const zipFile = backupFile.replace(".bak", ".zip");
      await zipFileCreate(backupFile, zipFile);
      finalFile = zipFile;
      console.log("Arquivo compactado:", zipFile);
    }

    if (config.remote_path.length > 0) {
      await fse.copy(
        finalFile,
        path.join(config.remote_path, path.basename(finalFile)),
      );
      console.log("Arquivo copiado para pasta compartilhada!");
    }

    if (config.retencao > 0) {
      limparAntigos(config.local_path, config.retencao);
    }
  } catch (err) {
    console.error("Erro:", err);
  } finally {
    console.log("Backup concluído!");
  }
}

function zipFileCreate(sourceFile: string, zipFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipFile);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.file(sourceFile, { name: path.basename(sourceFile) });
    archive.finalize();
  });
}

function limparAntigos(dir: string, dias: number) {
  const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.mtime.getTime() < limite) {
      fs.unlinkSync(filePath);
      console.log("Removido por retenção:", filePath);
    }
  });
}
