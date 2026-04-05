-- ==============================================================================
-- 002: DATABASE CREATION
-- Flow: 2/4
-- Target: MASTER Database
-- ==============================================================================

USE [master];
GO

-- COMENTÁRIO: Substitua [SMART_MONITOR] pelo nome do banco desejado (ex: SMART_MONITOR).
-- Este banco servirá como o repositório Cloud central para métricas e logs.

BEGIN TRY
    -- Nota: CREATE DATABASE não pode ser executado dentro de uma transação explícita.
    IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'SMART_MONITOR')
    BEGIN
        CREATE DATABASE [SMART_MONITOR];
        PRINT 'Banco de dados SMART_MONITOR criado com sucesso.';
    END
    ELSE
    BEGIN
        PRINT 'O banco de dados SMART_MONITOR já existe.';
    END
END TRY
BEGIN CATCH
    PRINT 'ERRO: Falha ao criar o banco de dados.';
    PRINT ERROR_MESSAGE();
END CATCH
GO
