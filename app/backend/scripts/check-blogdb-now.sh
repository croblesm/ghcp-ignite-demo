#!/bin/bash

# Quick BlogDB Session Check
# Just runs once and shows current activity

SERVER="localhost,1434"
DATABASE="blogdb"
THRESHOLD_SECONDS=10

# Set SQL Server password as environment variable
export SQLCMDPASSWORD="P@ssw0rd!"

# Test connection first
echo "Testing connection to $SERVER..."
if ! sqlcmd -S "$SERVER" -U sa -Q "SELECT 1" -h -1 -W >/dev/null 2>&1; then
    echo "❌ Cannot connect to SQL Server. Please check:"
    echo "   1. SQL Server is running on $SERVER"
    echo "   2. sa account is enabled and password is correct"
    echo "   3. Mixed mode authentication is enabled"
    exit 1
fi

echo "🔍 Checking BlogDB for active sessions..."
echo "========================================"

# Check for currently executing queries on BlogDB using DMVs
echo "🚨 Currently Executing Queries on BlogDB:"
echo "═══════════════════════════════════════════════════════════════════════════════"

query_result=$(sqlcmd -S "$SERVER" -U sa -Q "
USE $DATABASE;
SELECT 
    CAST(s.session_id AS VARCHAR(10)) as SPID,
    CONVERT(VARCHAR(8), r.start_time, 108) as Started,
    CAST(DATEDIFF(SECOND, r.start_time, GETDATE()) AS VARCHAR(10)) + 's' as Duration,
    r.status as Status,
    r.command as Command,
    CAST(r.cpu_time AS VARCHAR(10)) as CPU_ms,
    CAST(r.logical_reads AS VARCHAR(10)) as Reads,
    ISNULL(r.wait_type, 'None') as WaitType
FROM sys.dm_exec_sessions s
INNER JOIN sys.dm_exec_requests r ON s.session_id = r.session_id
WHERE s.is_user_process = 1
    AND r.database_id = DB_ID('$DATABASE')
    AND r.status IN ('running', 'runnable', 'suspended')
ORDER BY r.start_time ASC;
" -h -1 -W 2>/dev/null | grep -v "rows affected" | grep -v "^$" | grep -v "Changed database context" | tail -n +2)

if [ -n "$query_result" ]; then
    echo "SPID  Started   Duration  Status   Command    CPU_ms  Reads   WaitType"
    echo "────  ────────  ────────  ───────  ─────────  ──────  ──────  ────────"
    echo "$query_result"
else
    echo "✅ No currently executing queries"
fi

# Check if no active queries found
active_count=$(sqlcmd -S "$SERVER" -U sa -Q "
USE $DATABASE;
SELECT COUNT(*) FROM sys.dm_exec_sessions s
INNER JOIN sys.dm_exec_requests r ON s.session_id = r.session_id
WHERE s.is_user_process = 1 AND r.database_id = DB_ID('$DATABASE') AND r.status IN ('running', 'runnable', 'suspended')
" -h -1 -W 2>/dev/null | grep -v "rows affected" | grep -v "^$" | head -1 | tr -d ' ')

if [ "$active_count" = "0" ]; then
    echo "✅ No currently executing queries on BlogDB"
fi

echo ""
echo "📋 Query Text for Active Sessions (if any):"
echo "═══════════════════════════════════════════════════════════════════════════════"

sqlcmd -S "$SERVER" -U sa -Q "
USE $DATABASE;
SELECT 
    'SPID ' + CAST(s.session_id AS VARCHAR(10)) + ': ' + 
    LEFT(REPLACE(REPLACE(t.text, CHAR(13), ' '), CHAR(10), ' '), 100) as QueryText
FROM sys.dm_exec_sessions s
INNER JOIN sys.dm_exec_requests r ON s.session_id = r.session_id
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE s.is_user_process = 1
    AND r.database_id = DB_ID('$DATABASE')
    AND r.status IN ('running', 'runnable', 'suspended')
ORDER BY r.start_time ASC;
" -h -1 -W 2>/dev/null | grep -v "rows affected" | grep -v "^$"

echo ""
echo "📋 All BlogDB Connected Sessions:"
echo "═══════════════════════════════════════════════════════════════════════════════"

session_result=$(sqlcmd -S "$SERVER" -U sa -Q "
USE $DATABASE;
SELECT 
    CAST(s.session_id AS VARCHAR(10)) as SPID,
    s.status as Status,
    s.login_name as Login,
    LEFT(s.program_name, 25) as Program,
    CONVERT(VARCHAR(19), s.login_time, 120) as Connected,
    CONVERT(VARCHAR(19), s.last_request_start_time, 120) as LastActivity,
    CAST(DATEDIFF(SECOND, s.last_request_start_time, GETDATE()) AS VARCHAR(10)) + 's' as IdleTime
FROM sys.dm_exec_sessions s
WHERE s.database_id = DB_ID('$DATABASE')
    AND s.is_user_process = 1
ORDER BY s.last_request_start_time DESC;
" -h -1 -W 2>/dev/null | grep -v "rows affected" | grep -v "^$" | grep -v "Changed database context" | tail -n +2)

if [ -n "$session_result" ]; then
    echo "SPID  Status    Login  Program                   Connected            LastActivity         IdleTime"
    echo "────  ────────  ─────  ────────────────────────  ───────────────────  ───────────────────  ────────"
    echo "$session_result"
else
    echo "❌ No sessions found"
fi

echo ""
echo "📊 BlogDB Session Statistics:"
echo "═══════════════════════════════════════════════════════════════════════════════"

sqlcmd -S "$SERVER" -U sa -Q "
USE $DATABASE;
SELECT 
    'Total Sessions: ' + CAST(COUNT(*) AS VARCHAR(10)) +
    ' | Active: ' + CAST(SUM(CASE WHEN r.session_id IS NOT NULL THEN 1 ELSE 0 END) AS VARCHAR(10)) +
    ' | Idle: ' + CAST(SUM(CASE WHEN r.session_id IS NULL THEN 1 ELSE 0 END) AS VARCHAR(10)) +
    ' | Applications: ' + CAST(COUNT(DISTINCT s.program_name) AS VARCHAR(10)) as Stats
FROM sys.dm_exec_sessions s
LEFT JOIN sys.dm_exec_requests r ON s.session_id = r.session_id AND r.database_id = DB_ID('$DATABASE')
WHERE s.database_id = DB_ID('$DATABASE')
    AND s.is_user_process = 1;
" -h -1 -W 2>/dev/null | grep -v "rows affected" | grep -v "^$"

echo "═══════════════════════════════════════════════════════════════════════════════"