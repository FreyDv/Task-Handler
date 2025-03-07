IF DB_ID(N'$(DBNAME)') IS NULL
    BEGIN
        PRINT N'Database "$(DBNAME)" not found. Creating...';
        CREATE DATABASE [$(DBNAME)];
        PRINT N'Database "$(DBNAME)" created!';
    END
ELSE
    BEGIN
        PRINT N'Database "$(DBNAME)" already exist. Skip creating.';
    END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'$(DBUSER)')
    BEGIN
        PRINT N'Login [$(DBUSER)] not found. Creating...';
        CREATE LOGIN [$(DBUSER)] WITH PASSWORD = N'$(DBPASSWORD)', CHECK_POLICY = OFF;
        PRINT N'Login [$(DBUSER)] created!';
    END
ELSE
    BEGIN
        PRINT N'Login [$(DBUSER)] already exist. Skip creating.';
    END;
GO

USE [$(DBNAME)];
IF DATABASE_PRINCIPAL_ID('$(DBUSER)') IS NULL
    BEGIN
        PRINT N'Creating user for database [$(DBUSER)]...';
        CREATE USER [$(DBUSER)] FOR LOGIN [$(DBUSER)];
        PRINT N'user for database [$(DBUSER)] created.';
    END
ELSE
    BEGIN
        PRINT N'User [$(DBUSER)] already exist. Skip creating.';
    END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_role_members rm
             JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
             JOIN sys.database_principals u ON rm.member_principal_id = u.principal_id
    WHERE r.name = N'db_owner' AND u.name = N'$(DBUSER)')
    BEGIN
        ALTER ROLE [db_owner] ADD MEMBER [$(DBUSER)];
        PRINT N'User [$(DBUSER)] awarded with permission db_owner for database [$(DBNAME)].';
    END
ELSE
    BEGIN
        PRINT N'USer [$(DBUSER)] already has role db_owner in [$(DBNAME)].';
    END;
GO