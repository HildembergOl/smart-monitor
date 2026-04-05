-- ==============================================================================
-- 001: SERVER LEVEL LOGIN CREATION
-- Flow: 1/4
-- Target: MASTER Database
-- Instructions: To be executed by SA. Replace placeholders below.
-- ==============================================================================

USE [master];
GO

-- COMENTÁRIO: Substitua [NOME_DO_USUARIO] e 'SENHA_FORTE' pelos valores desejados.
-- O login será criado no nível do servidor para permitir a autenticação remota.

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE LOGIN [] -- <--- DEFINIR NOME DO USUÁRIO AQUI
    WITH PASSWORD = '', -- <--- DEFINIR SENHA FORTE AQUI
    CHECK_EXPIRATION = OFF,
    CHECK_POLICY = ON;

    COMMIT TRANSACTION;
    PRINT 'Login criado com sucesso no nível do servidor.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT 'ERRO: Falha ao criar login.';
    PRINT ERROR_MESSAGE();
END CATCH
GO
