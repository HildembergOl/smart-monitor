-- ==============================================================================
-- 004: INITIAL SCHEMA CREATION
-- Flow: 4/4
-- Target: SMART_MONITOR Database
-- ==============================================================================

USE [SMART_MONITOR];
GO

BEGIN TRY
    BEGIN TRANSACTION;

    -- 1. Cadastro de Clientes
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CLIENTS]') AND type in (N'U'))
    BEGIN
        CREATE TABLE CLIENTS (
            client_id INT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            active BIT DEFAULT 1,
            created_at DATETIME DEFAULT GETDATE()
        );
    END

    -- 2. Métricas Contínuas (Monitoramento)
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[METRICS]') AND type in (N'U'))
    BEGIN
        CREATE TABLE METRICS (
            id BIGINT IDENTITY(1,1) PRIMARY KEY,
            client_id INT NOT NULL,
            cpu_usage DECIMAL(5,2),
            memory_usage DECIMAL(10,2),
            active_sessions INT,
            avg_query_time DECIMAL(10,2),
            deadlocks INT,
            db_state VARCHAR(50),
            free_disk_space DECIMAL(15,2),
            last_backup DATETIME,
            failed_logins INT,
            created_at DATETIME DEFAULT GETDATE()
        );
        CREATE INDEX IX_METRICS_CLIENT ON METRICS(client_id, created_at);
    END

    -- 3. Logs de Integridade (DBCC)
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CHECKS_LOG]') AND type in (N'U'))
    BEGIN
        CREATE TABLE CHECKS_LOG (
            id BIGINT IDENTITY(1,1) PRIMARY KEY,
            client_id INT NOT NULL,
            check_name VARCHAR(50),
            status VARCHAR(20),
            details VARCHAR(MAX),
            created_at DATETIME DEFAULT GETDATE()
        );
        CREATE INDEX IX_CHECKS_CLIENT ON CHECKS_LOG(client_id, created_at);
    END

    -- 4. Logs de Backups
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BACKUP_LOG]') AND type in (N'U'))
    BEGIN
        CREATE TABLE BACKUP_LOG (
            id BIGINT IDENTITY(1,1) PRIMARY KEY,
            client_id INT NOT NULL,
            database_name VARCHAR(255),
            last_backup DATETIME,
            backup_type VARCHAR(50),
            status VARCHAR(20),
            created_at DATETIME DEFAULT GETDATE()
        );
        CREATE INDEX IX_BACKUP_CLIENT ON BACKUP_LOG(client_id, created_at);
    END

    -- 5. Alertas e Crash Logs
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ALERTS]') AND type in (N'U'))
    BEGIN
        CREATE TABLE ALERTS (
            id BIGINT IDENTITY(1,1) PRIMARY KEY,
            client_id INT NOT NULL,
            severity NVARCHAR(50),
            message NVARCHAR(MAX),
            resolved BIT DEFAULT 0,
            created_at DATETIME DEFAULT GETDATE()
        );
        CREATE INDEX IX_ALERTS_CLIENT ON ALERTS(client_id, created_at);
    END

    COMMIT TRANSACTION;
    PRINT 'Schema inicial (Tabelas e Índices) criado com sucesso.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT 'ERRO: Falha ao criar o schema inicial.';
    PRINT ERROR_MESSAGE();
END CATCH
GO
