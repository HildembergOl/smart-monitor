"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_PASSWORD = void 0;
exports.dbSqlite = dbSqlite;
const sqlcipher_1 = __importDefault(require("@journeyapps/sqlcipher"));
const sqlite_1 = require("sqlite");
exports.DB_PASSWORD = "DevSmart@MS9";
async function dbSqlite() {
    const dbPath = "smart-monitor-v2.db";
    const db = await (0, sqlite_1.open)({
        filename: dbPath,
        driver: sqlcipher_1.default.verbose().Database,
    });
    // Aplica a chave de criptografia de forma definitiva
    await db.run(`PRAGMA key = '${exports.DB_PASSWORD}';`);
    await db.get("SELECT count(*) FROM sqlite_master"); // Garante que a senha está OK
    return db;
}
