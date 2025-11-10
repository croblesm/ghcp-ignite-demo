# BlogDB Long-Running Sessions Monitor
# Checks for long-running queries every 2 minutes
# Press Ctrl+C to stop

param(
    [string]$ServerInstance = "localhost,1434",
    [string]$Database = "blogdb",
    [int]$IntervalMinutes = 2,
    [int]$LongRunningThresholdSeconds = 30
)

Write-Host "=== BlogDB Session Monitor Started ===" -ForegroundColor Green
Write-Host "Server: $ServerInstance" -ForegroundColor Cyan
Write-Host "Database: $Database" -ForegroundColor Cyan
Write-Host "Check Interval: $IntervalMinutes minutes" -ForegroundColor Cyan
Write-Host "Long-running threshold: $LongRunningThresholdSeconds seconds" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop monitoring`n" -ForegroundColor Yellow

$reportNumber = 1

while ($true) {
    try {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "📊 Report #$reportNumber - $timestamp" -ForegroundColor Magenta
        Write-Host "=" * 80 -ForegroundColor Gray
        
        # SQL Query to check for long-running sessions
        $query = @"
-- Check for long-running queries on blogdb
SELECT 
    s.session_id as SPID,
    r.request_id,
    r.start_time,
    DATEDIFF(SECOND, r.start_time, GETDATE()) as duration_seconds,
    r.status,
    r.command,
    r.percent_complete,
    DB_NAME(r.database_id) as database_name,
    s.login_name,
    s.program_name,
    s.host_name,
    LEFT(t.text, 100) as query_preview,
    r.cpu_time,
    r.total_elapsed_time,
    r.logical_reads,
    r.writes,
    r.wait_type,
    r.blocking_session_id
FROM sys.dm_exec_sessions s
INNER JOIN sys.dm_exec_requests r ON s.session_id = r.session_id
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE s.is_user_process = 1
    AND DB_NAME(r.database_id) = '$Database'
    AND r.status IN ('running', 'runnable', 'suspended')
    AND DATEDIFF(SECOND, r.start_time, GETDATE()) >= $LongRunningThresholdSeconds
ORDER BY r.start_time ASC;

-- Also check all blogdb sessions for context
SELECT 
    s.session_id as SPID,
    s.status as session_status,
    s.login_name,
    s.program_name,
    s.host_name,
    s.last_request_start_time,
    s.last_request_end_time,
    DATEDIFF(SECOND, s.last_request_start_time, GETDATE()) as seconds_since_start,
    s.cpu_time,
    s.logical_reads
FROM sys.dm_exec_sessions s
WHERE s.database_id = DB_ID('$Database')
    AND s.is_user_process = 1
ORDER BY s.last_request_start_time DESC;
"@

        # Execute the query using sqlcmd
        $result = sqlcmd -S $ServerInstance -d $Database -Q $query -h -1 -W
        
        if ($LASTEXITCODE -eq 0) {
            if ($result -and $result.Trim() -ne "") {
                $lines = $result -split "`n" | Where-Object { $_.Trim() -ne "" }
                
                # Check if we have long-running queries
                $longRunningFound = $false
                $sessionContextStart = $false
                
                foreach ($line in $lines) {
                    if ($line -match "SPID.*request_id.*start_time") {
                        Write-Host "🚨 LONG-RUNNING QUERIES DETECTED:" -ForegroundColor Red
                        Write-Host $line -ForegroundColor White
                        $longRunningFound = $true
                    }
                    elseif ($line -match "SPID.*session_status.*login_name") {
                        if ($longRunningFound) {
                            Write-Host "`n📋 All BlogDB Sessions:" -ForegroundColor Blue
                        } else {
                            Write-Host "✅ No long-running queries detected" -ForegroundColor Green
                            Write-Host "`n📋 All BlogDB Sessions:" -ForegroundColor Blue
                        }
                        Write-Host $line -ForegroundColor White
                        $sessionContextStart = $true
                    }
                    elseif ($line.Trim() -ne "" -and ($longRunningFound -or $sessionContextStart)) {
                        Write-Host $line -ForegroundColor Gray
                    }
                }
                
                if (-not $longRunningFound -and -not $sessionContextStart) {
                    Write-Host "✅ No active queries or sessions found on blogdb database" -ForegroundColor Green
                }
            } else {
                Write-Host "✅ No active sessions found on blogdb database" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ Error connecting to database" -ForegroundColor Red
        }
        
        Write-Host "`n" + "=" * 80 -ForegroundColor Gray
        Write-Host "Next check in $IntervalMinutes minutes...`n" -ForegroundColor Yellow
        
        $reportNumber++
        Start-Sleep -Seconds ($IntervalMinutes * 60)
    }
    catch {
        Write-Host "❌ Error occurred: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Retrying in $IntervalMinutes minutes...`n" -ForegroundColor Yellow
        Start-Sleep -Seconds ($IntervalMinutes * 60)
    }
}
"@