-- ==============================================================================
-- SMART MONITOR CLOUD SCHEMA (SQL Server)
-- Recomendado para integração com GRAFANA e Multi-Clientes
-- ==============================================================================

-- Criação da tabela de Cadastro de Clientes (Opcional para organizar seu Grafana)
CREATE TABLE CLIENTS (
    client_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 1. Métricas Contínuas (A cada 15 min)
CREATE TABLE METRICS (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    client_id INT NOT NULL,              -- Amarração com o cliente
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(10,2),
    active_sessions INT,
    avg_query_time DECIMAL(10,2),
    deadlocks INT,
    db_state VARCHAR(50),
    free_disk_space DECIMAL(15,2),
    last_backup DATETIME,
    failed_logins INT,
    created_at DATETIME DEFAULT GETDATE() -- Timestamp do envio ao Cloud
);
GO
CREATE INDEX IX_METRICS_CLIENT ON METRICS(client_id, created_at);
GO

-- 2. Logs de Checks de Integridade (CHECKDB, CHECKALLOC, etc.) - Rotina Diária
CREATE TABLE CHECKS_LOG (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    client_id INT NOT NULL,
    check_name VARCHAR(50),
    status VARCHAR(20),                 -- 'OK' ou 'FAIL'
    details VARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE()
);
GO
CREATE INDEX IX_CHECKS_CLIENT ON CHECKS_LOG(client_id, created_at);
GO

-- 3. Logs de Backups
CREATE TABLE BACKUP_LOG (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    client_id INT NOT NULL,
    database_name VARCHAR(255),
    last_backup DATETIME,
    backup_type VARCHAR(50),             -- 'FULL', 'DIFF', 'LOG'
    status VARCHAR(20),                  -- 'OK' ou 'FAIL'
    created_at DATETIME DEFAULT GETDATE()
);
GO
CREATE INDEX IX_BACKUP_CLIENT ON BACKUP_LOG(client_id, created_at);
GO

-- 4. Alertas (Erros locais, crash da aplicação, banco ausente)
CREATE TABLE ALERTS (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    client_id INT NOT NULL,
    severity NVARCHAR(50),                -- 'INFO', 'WARNING', 'CRITICAL', 'HIGH'
    message NVARCHAR(MAX),
    resolved BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);
GO
CREATE INDEX IX_ALERTS_CLIENT ON ALERTS(client_id, created_at);
GO

--- Notas:
-- Você pode usar a data local gerada pelo SQLite adicionando uma nova coluna 'local_created_at' futuramente se desejar.
-- Se executar este schema no seu Servidor Cloud SQL Server, o sincronizador `sync.js` fará os INSERTs diretos acima.
