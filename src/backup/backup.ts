import path from "path";
import archiver from "archiver";
import fs from "fs";
import fse from "fs-extra";
import { db } from "../database/sqlserver";
import { formatDateTime } from "../@lib/date";

export async function executarBackup(
  tipo: "full" | "diferencial" | "transacao",
) {
  try {
    const config = global.AppConfig?.backup;
    const database = global.AppConfig?.ambiente.local.database;
    const enterprise = global.AppConfig?.enterprise;
    if (!config) {
      console.error("❌ Nenhuma configuração encontrada na tabela Config.");
      return;
    }
    console.log("Iniciando o Backup tipo: ", tipo);
    const localPath = config.local_path || "";
    if (localPath) {
      console.log(`📂 Garantindo que a pasta local existe: ${localPath}`);
      await fse.ensureDir(localPath);
    }

    const databases = database.split(",");

    const pool = await db("local");

    for await (const dbName of databases) {
      const timestamp = formatDateTime()
        .replace(/T/, "_")
        .replace(/Z/, "")
        .replace(/:/g, "_")
        .replace(/\./g, "_")
        .replace(/ /g, "_")
        .replace(/\//g, "_")
        .replace(/,/g, "");

      const file =
        `Backup_${enterprise}_${dbName}_${tipo}_${timestamp}`.toUpperCase();
      const backupFile = path.join(localPath, file + ".bak");

      const request = pool.request();
      let query = "";

      switch (tipo) {
        case "full":
          query = `BACKUP DATABASE ${dbName} TO DISK = '${backupFile}' WITH INIT;`;
          break;
        case "diferencial":
          query = `BACKUP DATABASE ${dbName} TO DISK = '${backupFile}' WITH DIFFERENTIAL, INIT;`;
          break;
        case "transacao":
          query = `BACKUP LOG ${dbName} TO DISK = '${backupFile}' WITH INIT;`;
          break;
      }

      await request.query(query);
      console.log(`Backup ${tipo} concluído: ${backupFile}`);

      let finalFile = backupFile;
      if (config.compressao) {
        const zipFile = backupFile.replace(".bak", ".zip");
        console.log(`📦 Iniciando compactação: ${backupFile} -> ${zipFile}`);
        await zipFileCreate(backupFile, zipFile);

        if (fs.existsSync(zipFile)) {
          const stats = fs.statSync(zipFile);
          console.log(
            `✅ Arquivo compactado com sucesso: ${zipFile} (${stats.size} bytes)`,
          );
          finalFile = zipFile;
        } else {
          console.error(
            `🚨 ERRO CRÍTICO: zipFileCreate resolveu mas o arquivo não existe: ${zipFile}`,
          );
        }
      }

      if (config.remote_path && config.remote_path.length > 0) {
        if (fs.existsSync(finalFile)) {
          await fse.ensureDir(config.remote_path);
          await fse.copy(
            finalFile,
            path.join(config.remote_path, path.basename(finalFile)),
          );
          console.log("Arquivo copiado para pasta compartilhada!");
        } else {
          console.error(
            `🚨 Erro: Arquivo para cópia remota não encontrado: ${finalFile}`,
          );
        }
      }

      if (config.retencao && config.retencao > 0) {
        limparAntigos(config.local_path, config.retencao, [
          path.basename(backupFile),
          path.basename(finalFile),
        ]);
      }
    }
  } catch (err) {
    console.error("Erro no processo de backup:", err);
  } finally {
    console.log("Backup finalizado!");
  }
}

function zipFileCreate(sourceFile: string, zipFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`  - Criando stream de escrita para: ${zipFile}`);
    const output = fs.createWriteStream(zipFile);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(
        `  - Stream de escrita fechado. Total bytes: ${archive.pointer()}`,
      );
      resolve();
    });

    output.on("error", (err) => {
      console.error(`  - Erro no stream de escrita: ${err.message}`);
      reject(err);
    });

    archive.on("warning", (err) => {
      if (err.code === "ENOENT") {
        console.warn(`  - Aviso Archiver: ${err.message}`);
      } else {
        console.error(`  - Erro Archiver: ${err.message}`);
        reject(err);
      }
    });

    archive.on("error", (err) => {
      console.error(`  - Erro fatal Archiver: ${err.message}`);
      reject(err);
    });

    archive.pipe(output);

    // Usa append com stream para ser mais resiliente no Windows
    if (!fs.existsSync(sourceFile)) {
      console.error(
        `  - ERRO: Arquivo de origem não encontrado para compressão: ${sourceFile}`,
      );
      reject(new Error(`Source file not found: ${sourceFile}`));
      return;
    }

    console.log(`  - Anexando arquivo: ${path.basename(sourceFile)}`);
    archive.append(fs.createReadStream(sourceFile), {
      name: path.basename(sourceFile),
    });

    archive.finalize();
  });
}

function limparAntigos(
  dir: string,
  dias: number,
  arquivosParaPular: string[] = [],
) {
  if (dias <= 0) return;
  const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (
      stats.mtime.getTime() < limite &&
      file.toUpperCase().startsWith("BACKUP_") &&
      !arquivosParaPular.includes(file)
    ) {
      // Evita deletar o arquivo que acabou de ser criado
      fs.unlinkSync(filePath);
      console.log("Removido por retenção:", filePath);
    }
  });
}
