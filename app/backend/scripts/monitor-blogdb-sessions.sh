#!/bin/bash

# BlogDB Long-Running Sessions Monitor
# Checks for long-running queries every 2 minutes
# Usage: ./monitor-blogdb-sessions.sh
# Press Ctrl+C to stop

SERVER="localhost,1434"
DATABASE="blogdb"
INTERVAL_MINUTES=2
THRESHOLD_SECONDS=30
REPORT_NUM=1

# Set SQL Server password as environment variable
export SQLCMDPASSWORD="P@ssw0rd!"

echo "=== BlogDB Session Monitor Started ==="
echo "Server: $SERVER"
echo "Database: $DATABASE"
echo "Check Interval: $INTERVAL_MINUTES minutes"
echo "Long-running threshold: $THRESHOLD_SECONDS seconds"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Function to check for sqlcmd
check_sqlcmd() {
    if ! command -v sqlcmd &> /dev/null; then
        echo "❌ sqlcmd not found. Please install SQL Server command line tools."
        echo "   For macOS: brew install microsoft/mssql/sqlcmd"
        exit 1
    fi
}

# Function to run the monitoring query
run_monitor_query() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "📊 Report #$REPORT_NUM - $timestamp"
    echo "================================================================================"
    
    # Query for long-running sessions 
    local long_running_query="
    SELECT 
        s.session_id,
        FORMAT(r.start_time, 'HH:mm:ss'),
        DATEDIFF(SECOND, r.start_time, GETDATE()),
        r.status,
        r.command,
        s.login_name,
        s.program_name,
        LEFT(REPLACE(REPLACE(t.text, CHAR(13), ' '), CHAR(10), ' '), 60)
    FROM sys.dm_exec_sessions s
    INNER JOIN sys.dm_exec_requests r ON s.session_id = r.session_id
    CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
    WHERE s.is_user_process = 1
        AND DB_NAME(r.database_id) = '$DATABASE'
        AND r.status IN ('running', 'runnable', 'suspended')
        AND DATEDIFF(SECOND, r.start_time, GETDATE()) >= $THRESHOLD_SECONDS
    ORDER BY r.start_time ASC;
    "
    
    # Query for all sessions with tab-separated output
    local all_sessions_query="
    SELECT 
        s.session_id,
        s.status,
        s.login_name,
        s.program_name,
        FORMAT(s.last_request_start_time, 'MM/dd HH:mm:ss'),
        DATEDIFF(SECOND, s.last_request_start_time, GETDATE())
    FROM sys.dm_exec_sessions s
    WHERE s.database_id = DB_ID('$DATABASE')
        AND s.is_user_process = 1
    ORDER BY s.last_request_start_time DESC;
    "
    
    local exit_code=0
    
    # Check for long-running queries using modern DMVs
    echo "🚨 Long-Running Query Check (>${THRESHOLD_SECONDS}s threshold):"
    echo "══════════════════════════════════════════════════════════════════════════════════════════════════════"
    
    # Check for long-running queries with detailed metrics
    sqlcmd -S "$SERVER" -U sa -Q "
    USE $DATABASE;
    SELECT 
        CAST(s.session_id AS VARCHAR(10)) as SPID,
        CONVERT(VARCHAR(8), r.start_time, 108) as Started,
        CAST(DATEDIFF(SECOND, r.start_time, GETDATE()) AS VARCHAR(10)) + 's' as Duration,
        r.status as Status,
        r.command as Command,
        CAST(r.cpu_time AS VARCHAR(10)) as CPU_ms,
        CAST(r.logical_reads AS VARCHAR(10)) as Reads,
        ISNULL(r.wait_type, 'None') as WaitType,
        LEFT(s.program_name, 15) as Program
    FROM sys.dm_exec_sessions s
    INNER JOIN sys.dm_exec_requests r ON s.session_id = r.session_id
    WHERE s.is_user_process = 1
        AND r.database_id = DB_ID('$DATABASE')
        AND r.status IN ('running', 'runnable', 'suspended')
        AND DATEDIFF(SECOND, r.start_time, GETDATE()) >= $THRESHOLD_SECONDS
    ORDER BY r.start_time ASC;
    " -h -1 -W 2>/dev/null | grep -v "rows affected" | grep -v "^$"
    
    # Check count of long-running queries
    local long_count=$(sqlcmd -S "$SERVER" -U sa -Q "
    USE $DATABASE;
    SELECT COUNT(*)
    FROM sys.dm_exec_sessions s
    INNER JOIN sys.dm_exec_requests r ON s.session_id = r.session_id
    WHERE s.is_user_process = 1
        AND r.database_id = DB_ID('$DATABASE')
        AND r.status IN ('running', 'runnable', 'suspended')
        AND DATEDIFF(SECOND, r.start_time, GETDATE()) >= $THRESHOLD_SECONDS
    " -h -1 -W 2>/dev/null | grep -v "rows affected" | grep -v "^$" | head -1 | tr -d ' ')
    
    if [ "$long_count" = "0" ] || [ -z "$long_count" ]; then
        echo "✅ No long-running queries detected"
    fi
    
    # Show query text for long-running queries
    echo ""
    echo "� Query Text for Long-Running Sessions (if any):"
    echo "══════════════════════════════════════════════════════════════════════════════════════════════════════"
    
    sqlcmd -S "$SERVER" -U sa -Q "
    USE $DATABASE;
    SELECT 
        'SPID ' + CAST(s.session_id AS VARCHAR(10)) + ' (' + CAST(DATEDIFF(SECOND, r.start_time, GETDATE()) AS VARCHAR(10)) + 's): ' + 
        LEFT(REPLACE(REPLACE(t.text, CHAR(13), ' '), CHAR(10), ' '), 80) as QueryText
    FROM sys.dm_exec_sessions s
    INNER JOIN sys.dm_exec_requests r ON s.session_id = r.session_id
    CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
    WHERE s.is_user_process = 1
        AND r.database_id = DB_ID('$DATABASE')
        AND r.status IN ('running', 'runnable', 'suspended')
        AND DATEDIFF(SECOND, r.start_time, GETDATE()) >= $THRESHOLD_SECONDS
    ORDER BY r.start_time ASC;
    " -h -1 -W 2>/dev/null | grep -v "rows affected" | grep -v "^$"
    
    echo "══════════════════════════════════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "📋 All BlogDB Connected Sessions:"
    echo "══════════════════════════════════════════════════════════════════════════════════════════════════════"
    
    # Get all sessions for this database with detailed info
    sqlcmd -S "$SERVER" -U sa -Q "
    USE $DATABASE;
    SELECT 
        CAST(s.session_id AS VARCHAR(10)) as SPID,
        s.status as Status,
        s.login_name as Login,
        LEFT(s.program_name, 20) as Program,
        CONVERT(VARCHAR(8), s.login_time, 108) as Connected,
        CONVERT(VARCHAR(8), s.last_request_start_time, 108) as LastActivity,
        CAST(DATEDIFF(SECOND, s.last_request_start_time, GETDATE()) AS VARCHAR(10)) + 's' as IdleTime
    FROM sys.dm_exec_sessions s
    WHERE s.database_id = DB_ID('$DATABASE')
        AND s.is_user_process = 1
    ORDER BY s.last_request_start_time DESC;
    " -h -1 -W 2>/dev/null | grep -v "rows affected" | grep -v "^$"
    
    echo ""
    echo "📊 BlogDB Session Statistics:"
    echo "══════════════════════════════════════════════════════════════════════════════════════════════════════"
    
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
    
    echo "══════════════════════════════════════════════════════════════════════════════════════════════════════"
        else
            echo "❌ No sessions found"
        fi
    else
        echo "❌ Error connecting to database"
    fi
    
    echo "================================================================================"
    echo "Next check in $INTERVAL_MINUTES minutes..."
    echo ""
}

# Main monitoring loop
main() {
    check_sqlcmd
    
    # Trap Ctrl+C
    trap 'echo ""; echo "Monitor stopped."; exit 0' INT
    
    while true; do
        run_monitor_query
        REPORT_NUM=$((REPORT_NUM + 1))
        sleep $((INTERVAL_MINUTES * 60))
    done
}

# Run the monitor
main