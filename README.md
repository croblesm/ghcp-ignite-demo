# 🚀 GitHub Copilot + MSSQL Database Performance Demo

## 🎯 What This Demo Shows

This demo showcases how **GitHub Copilot Agent mode** can help developers diagnose and fix database performance issues, specifically the classic **N+1 query problem** in a Node.js application.

**The Story**: You're a developer who gets complaints about a slow blog posts page. The frontend looks fine, but something's wrong with the database layer. GitHub Copilot helps you investigate, understand, and fix the issue - even if you're not a database expert.

## 🎬 Demo Scenario

- **The Problem**: Blog posts page loading very slowly (~18-20 seconds)
- **The Stack**: React frontend + Node.js/Express + Prisma ORM + SQL Server
- **The Culprit**: N+1 query pattern (1 query for posts + N queries for each author)
- **The Solution**: GitHub Copilot analyzes code AND database to suggest the fix

## 📋 Quick Start for Demo

1. **Setup**: Follow the setup instructions below (5 minutes)
2. **Run the Demo**: Use the prompts in [`demo-prompts-v2.html`](demo-prompts-v2.html) - open in VS Code and click "Open Preview"
   - **v2 (Recommended)**: Comprehensive master prompt + optional follow-ups for deep dives
   - **v1**: Alternative prompts for reference
3. **Detailed Context**: See [`README.copilot.md`](README.copilot.md) for additional context and demo flow details
4. **Database Management**: Database scripts and monitoring tools documented below

## Tech Stack

- **Backend**: Node.js + Express + Prisma (JavaScript)
- **Frontend**: React + Vite
- **Database**: SQL Server 2025 (running in local container via MSSQL VS Code extension)
- **Approach**: Code-first (Prisma owns schema/migrations)

## Prerequisites

1. **VS Code** with extensions:
   - [MSSQL extension](https://marketplace.visualstudio.com/items?itemName=ms-mssql.mssql)
   - GitHub Copilot (with Agent mode access)
2. **SQL Server 2025 container** started from the MSSQL extension (Local SQL Server container feature)
3. **Node.js** (v18 or later recommended)

## Setup Instructions

### 1. Create the Database

Open the MSSQL extension in VS Code and connect to your local SQL Server container at `localhost,1434` (user: `sa`, password: `P@ssw0rd!`).

**Option A: Use the provided script**

Open and execute [app/backend/scripts/create-database.sql](app/backend/scripts/create-database.sql) from the MSSQL extension.

**Option B: Run manually**

```sql
CREATE DATABASE blogdb;
GO
```

### 2. Backend Setup

```bash
cd app/backend
npm install
```

Copy the environment template:

```bash
cp .env.example .env
```

The `.env` file should already have the correct connection string for the local SQL Server container.

Apply the Prisma schema and seed the database:

```bash
npx prisma migrate dev --name init
npm run seed
```

**Note:** The seeding process creates 500 authors, 10,000 posts across diverse topics (Technology, Fashion, Sports, Healthcare, Travel, Food, Entertainment, etc.) in multiple languages, and ~60,000 multilingual comments. This will take approximately 3-5 minutes to complete depending on your machine and database performance.

Start the Express backend:

```bash
npm run dev
```

The API will be running at `http://localhost:3000`.

### 3. Frontend Setup

```bash
cd app/frontend
npm install
cp .env.example .env
npm run dev
```

The React app will be running at `http://localhost:3001`.

### 4. Reproduce the N+1 Issue

1. Open the React app in your browser (`http://localhost:3001`)
2. The app will fetch posts from `/api/posts`
3. Open the browser DevTools Network tab and observe the slow response time
4. Check the backend console logs to see the N+1 queries being executed

### 5. Use GitHub Copilot to Analyze and Fix

Follow the prompts in `README.copilot.md` to:
- Ask Copilot to analyze the slow endpoint
- Detect the N+1 pattern
- Generate the optimized query
- Compare before/after performance

## Database Management

### Drop the Database (for cleanup/reset)

If you need to drop the database and start fresh:

**Option A: Use the provided script**

Open and execute [app/backend/scripts/drop-database.sql](app/backend/scripts/drop-database.sql) from the MSSQL extension. This script safely kills all active sessions before dropping the database.

**Option B: Run manually**

```sql
DECLARE @db SYSNAME = N'blogdb';
DECLARE @spid INT;

-- kill all sessions using this database
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
```

**Note**: This is for local/demo use only with the SQL Server container.

**After dropping, recreate the database:**

1. Run [app/backend/scripts/create-database.sql](app/backend/scripts/create-database.sql) or manually create the database
2. Re-run Prisma migrations and seed:

```bash
cd app/backend
npx prisma migrate dev
npm run seed
```

**Note:** The seeding process takes approximately 3-5 minutes as it creates a large diverse dataset with optimized batch inserts.

For more details, see [app/backend/scripts/README.md](app/backend/scripts/README.md).

## Project Structure

```
.
├── README.md                    # This file
├── README.copilot.md            # Copilot prompts for the demo
├── app/
│   ├── backend/                 # Express + Prisma API
│   │   ├── .env.example         # Backend environment variables (PORT, DATABASE_URL)
│   │   ├── package.json
│   │   ├── scripts/             # SQL Server database scripts
│   │   │   ├── README.md        # Database setup documentation
│   │   │   ├── create-database.sql    # Create blogdb database
│   │   │   └── drop-database.sql      # Drop blogdb database (with session cleanup)
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Database models
│   │   │   └── seed.js          # Seed data
│   │   └── src/
│   │       ├── index.js         # Express server
│   │       └── routes/
│   │           └── posts.js     # N+1 endpoint (slow + optimized versions)
│   └── frontend/                # React + Vite
│       ├── .env.example         # Frontend environment variables (VITE_PORT, VITE_API_URL)
│       ├── package.json
│       ├── index.html
│       ├── vite.config.js
│       └── src/
│           ├── main.jsx
│           └── App.jsx          # Posts listing UI
```

## The N+1 Problem

The initial implementation of `GET /api/posts` fetches all posts, then loops through each post to fetch its author separately:

```javascript
// INTENTIONAL N+1 FOR DEMO PURPOSES
const posts = await prisma.post.findMany();
for (let post of posts) {
  post.author = await prisma.author.findUnique({
    where: { id: post.authorId }
  });
}
```

With 10,000 posts, this results in **80,000+ database queries** due to nested N+1 patterns (posts → authors → comments → comment authors → tags). This creates a dramatically slow response time, perfect for demonstrating the performance impact of N+1 queries.

## The Solution

Use Prisma's `include` to load authors in a single query:

```javascript
const posts = await prisma.post.findMany({
  include: {
    author: true,
  },
});
```

This results in **1 optimized query** with a JOIN.

## Database Monitoring Scripts

The project includes database monitoring scripts in `app/backend/scripts/`:

### SQL Scripts

- **`create-database.sql`** - Creates the `blogdb` database
- **`drop-database.sql`** - Safely drops the database (kills active sessions first)

### Monitoring Scripts

#### `check-blogdb-now.sh` - One-time Database Check
Quick snapshot of current database activity:

```bash
chmod +x app/backend/scripts/check-blogdb-now.sh
./app/backend/scripts/check-blogdb-now.sh
```

**Shows:**
- Currently executing queries with duration and status
- Full query text for active sessions  
- Connected sessions with connection/idle times
- Session statistics (total, active, idle)

**Perfect for:** Demo health checks, verifying N+1 queries are running

#### `monitor-blogdb-sessions.sh` - Continuous Monitoring
Real-time monitoring with alerts for long-running queries:

```bash
chmod +x app/backend/scripts/monitor-blogdb-sessions.sh
./app/backend/scripts/monitor-blogdb-sessions.sh
```

**Configuration:**
- `INTERVAL_MINUTES=2` - Check frequency (default: 2 minutes)
- `THRESHOLD_SECONDS=30` - Alert threshold (default: 30 seconds)

**Perfect for:** Tracking demo performance, catching slow queries

**Example output:**
```
📊 Report #1 - 2025-11-10 05:15:32
🚨 Long-Running Query Check (>30s threshold):
SPID  Started   Duration  Status   Command    CPU_ms  Reads
52    05:14:58  34s       running  SELECT     1250    145000
```

## Database Connection Details

- **Server**: `localhost,1434` 
- **User**: `sa`
- **Password**: `P@ssw0rd!`
- **Database**: `blogdb`
- **Environment**: SQL Server 2025 in Docker container (via MSSQL VS Code extension)

## Next Steps

See `README.copilot.md` or use `demo-prompts.html` for the specific GitHub Copilot prompts to run through this demo.
