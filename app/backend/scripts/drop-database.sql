-- ====================================================================
-- Drop Database Script for GitHub Copilot + MSSQL N+1 Demo
-- ====================================================================
-- This script drops the 'blogdb' database after killing all active
-- sessions. Use this for cleanup or to reset the demo environment.
--
-- IMPORTANT: This is intended for LOCAL/DEMO use only with the
-- SQL Server container started by the MSSQL VS Code extension.
-- ====================================================================

DECLARE @db SYSNAME = N'blogdb';
DECLARE @spid INT;

-- Kill all sessions using this database
WHILE EXISTS (
    SELECT 1
    FROM sys.sysprocesses
    WHERE dbid = DB_ID(@db)
      AND spid <> @@SPID
)
BEGIN
    SELECT TOP 1 @spid = spid
    FROM sys.sysprocesses
    WHERE dbid = DB_ID(@db)
      AND spid <> @@SPID;

    EXEC ('KILL ' + @spid);
END;

DROP DATABASE [blogdb];
GO
