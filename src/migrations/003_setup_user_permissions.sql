-- ==============================================================================
-- 003: DATABASE LEVEL USER & PERMISSIONS
-- Flow: 3/4
-- Target: SMART_MONITOR Database
-- ==============================================================================

USE [SMART_MONITOR]; -- <--- CERTIFIQUE-SE DE QUE ESTE NOME ESTÁ CORRETO
GO

-- COMENTÁRIO: Substitua [] pelo nome do login criado no passo 001.
-- Este comando vincula o login do servidor ao usuário do banco de dados específico.

CREATE USER [] FOR LOGIN [];
GO

-- CONCESSÃO DE PERMISSÕES MÍNIMAS NECESSÁRIAS
-- O Smart Monitor precisa apenas de SELECT, INSERT e UPDATE para as tabelas de métricas e logs.

GRANT SELECT, INSERT, UPDATE TO [];
GO

PRINT 'Usuário vinculado ao banco e permissões SELECT, INSERT, UPDATE concedidas.';
GO
