# Database Scripts

This folder contains SQL scripts for managing the `blogdb` database used in the GitHub Copilot + MSSQL N+1 demo.

## Prerequisites

- SQL Server 2025 running in a local container via the MSSQL VS Code extension
- Connection details:
  - Server: `localhost,1434`
  - User: `sa`
  - Password: `P@ssw0rd!`

## Scripts

### SQL Scripts

#### create-database.sql

Creates the `blogdb` database.

**Usage:**
1. Open the MSSQL extension in VS Code
2. Connect to `localhost,1434` with user `sa`
3. Open `create-database.sql`
4. Execute the script

**After creating the database:**
```bash
cd app/backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run seed
```

#### drop-database.sql

Drops the `blogdb` database after terminating all active connections.

**Usage:**
1. Open the MSSQL extension in VS Code
2. Connect to `localhost,1434` with user `sa`
3. Open `drop-database.sql`
4. Execute the script

**Note:** This script is intended for local/demo use only. It forcefully kills all sessions connected to the database before dropping it.

**After dropping, to recreate:**
1. Run `create-database.sql`
2. Run Prisma migrations and seed as shown above

### Monitoring Scripts

#### check-blogdb-now.sh

Quick one-time check of current BlogDB database activity. Shows currently executing queries, query text, connected sessions, and session statistics.

**Usage:**
```bash
chmod +x app/backend/scripts/check-blogdb-now.sh
./app/backend/scripts/check-blogdb-now.sh
```

**What it shows:**
- Currently executing queries with duration, status, CPU time, and logical reads
- Full query text for active sessions
- All connected sessions with connection time and idle time
- Session statistics (total, active, idle, applications)

**Use cases:**
- Check if the N+1 query endpoint is currently running
- See how long queries have been running
- Verify database connections from your app
- Quick database health check during demos

#### monitor-blogdb-sessions.sh

Continuous monitoring of BlogDB database activity. Runs every 2 minutes and alerts on long-running queries (>30 seconds by default).

**Usage:**
```bash
chmod +x app/backend/scripts/monitor-blogdb-sessions.sh
./app/backend/scripts/monitor-blogdb-sessions.sh
```

**Press Ctrl+C to stop monitoring**

**Configuration:**
- `INTERVAL_MINUTES=2` - How often to check (default: 2 minutes)
- `THRESHOLD_SECONDS=30` - Alert threshold for long-running queries (default: 30 seconds)

**What it monitors:**
- Long-running queries exceeding the threshold
- Full query text for long-running operations
- All connected sessions and their status
- Session statistics and trends over time

**Use cases:**
- Monitor database during long-running operations
- Detect stuck or slow queries during development
- Track database activity during demos
- Troubleshoot performance issues

**Example output:**
```
📊 Report #1 - 2025-11-10 05:15:32
================================================================================
🚨 Long-Running Query Check (>30s threshold):
══════════════════════════════════════════════════════════════════════════════
SPID  Started   Duration  Status   Command    CPU_ms  Reads   WaitType
52    05:14:58  34s       running  SELECT     1250    145000  ASYNC_IO_COMPLETION
```

## Workflow

**Initial Setup:**
```bash
# 1. Run app/backend/scripts/create-database.sql from MSSQL extension
# 2. Then in terminal:
cd app/backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run seed
```

**Reset Database:**
```bash
# 1. Run app/backend/scripts/drop-database.sql from MSSQL extension
# 2. Run app/backend/scripts/create-database.sql from MSSQL extension
# 3. Then in terminal:
cd app/backend
npx prisma migrate dev
npm run seed
```

## Why Separate Scripts?

- **Clarity**: Each script has a single, clear purpose
- **Safety**: Explicit file names prevent accidental execution
- **Documentation**: Each script includes detailed comments
- **Copilot Demo**: Makes it easier to reference specific database operations when using GitHub Copilot
