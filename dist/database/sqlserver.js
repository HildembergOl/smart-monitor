"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = db;
exports.getDatabases = getDatabases;
const mssql_1 = __importDefault(require("mssql"));
const pools = new Map();
function db(name) {
    /**
     * Get or create a pool. If a pool doesn't exist the config must be provided.
     * If the pool does exist the config is ignored (even if it was different to the one provided
     * when creating the pool)
     *
     * @param {string} name
     * @return {Promise.<ConnectionPool>}
     */
    const config = {
        local: {
            user: global.AppConfig?.ambiente.local.user || "",
            password: global.AppConfig?.ambiente.local.password || "",
            server: global.AppConfig?.ambiente.local.server || "",
            port: global.AppConfig?.ambiente.local.port || 1433,
            database: global.AppConfig?.ambiente.local.database || "",
            options: {
                encrypt: global.AppConfig?.ambiente.local.options.encrypt || true,
                trustServerCertificate: global.AppConfig?.ambiente.local.options.trustServerCertificate ||
                    true,
                appName: "SmartMonitor",
            },
            stream: false,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000,
            },
        },
        remote: {
            user: global.AppConfig?.ambiente.producao.user || "",
            password: global.AppConfig?.ambiente.producao.password || "",
            server: global.AppConfig?.ambiente.producao.server || "",
            port: global.AppConfig?.ambiente.producao.port || 1433,
            database: global.AppConfig?.ambiente.producao.database || "",
            options: {
                encrypt: global.AppConfig?.ambiente.producao.options.encrypt || true,
                trustServerCertificate: global.AppConfig?.ambiente.producao.options.trustServerCertificate ||
                    true,
                appName: `${global.AppConfig?.enterprise} - SmartMonitor`,
            },
            stream: false,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000,
            },
        },
    };
    const cfg = config[name];
    // Impede que o driver tente procurar um Hostname vazio (Resolvendo o erro DEP0118)
    if (!cfg.server || cfg.server.trim() === "") {
        return Promise.reject(new Error(`Hostname do servidor ${name} está vazio. Configure-o primeiro.`));
    }
    if (!pools.has(name)) {
        const pool = new mssql_1.default.ConnectionPool(cfg);
        // automatically remove the pool from the cache if `pool.close()` is called
        const close = pool.close.bind(pool);
        pool.close = () => {
            pools.delete(name);
            return close();
        };
        const connectPromise = pool.connect().catch((err) => {
            pools.delete(name);
            throw err;
        });
        pools.set(name, connectPromise);
    }
    return pools.get(name);
}
async function getDatabases() {
    try {
        const pool = await db("local");
        const result = await pool.query("SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')");
        return result.recordset.map((row) => row.name);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("❌ Erro ao buscar bancos de dados:", error.message);
        }
        else {
            console.error("❌ Erro desconhecido ao buscar bancos de dados:", error);
        }
        return undefined;
    }
}
