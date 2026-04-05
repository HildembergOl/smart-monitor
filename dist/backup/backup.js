"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executarBackup = executarBackup;
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
const fs_1 = __importDefault(require("fs"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const sqlserver_1 = require("../database/sqlserver");
async function executarBackup(tipo) {
    try {
        const config = global.AppConfig?.backup;
        if (!config) {
            console.error("❌ Nenhuma configuração encontrada na tabela Config.");
            return;
        }
        const pool = await (0, sqlserver_1.db)("local");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupFile = path_1.default.join(config.local_path || "", `Backup_${tipo}_${timestamp}.bak`);
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
            await fs_extra_1.default.copy(finalFile, path_1.default.join(config.remote_path, path_1.default.basename(finalFile)));
            console.log("Arquivo copiado para pasta compartilhada!");
        }
        if (config.retencao > 0) {
            limparAntigos(config.local_path, config.retencao);
        }
    }
    catch (err) {
        console.error("Erro:", err);
    }
    finally {
        console.log("Backup concluído!");
    }
}
function zipFileCreate(sourceFile, zipFile) {
    return new Promise((resolve, reject) => {
        const output = fs_1.default.createWriteStream(zipFile);
        const archive = (0, archiver_1.default)("zip", { zlib: { level: 9 } });
        output.on("close", () => resolve());
        archive.on("error", (err) => reject(err));
        archive.pipe(output);
        archive.file(sourceFile, { name: path_1.default.basename(sourceFile) });
        archive.finalize();
    });
}
function limparAntigos(dir, dias) {
    const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
    fs_1.default.readdirSync(dir).forEach((file) => {
        const filePath = path_1.default.join(dir, file);
        const stats = fs_1.default.statSync(filePath);
        if (stats.mtime.getTime() < limite) {
            fs_1.default.unlinkSync(filePath);
            console.log("Removido por retenção:", filePath);
        }
    });
}
