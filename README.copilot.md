# GitHub Copilot Demo: Diagnosing Backend Database Performance Issues

## Scenario

**The Problem**: A developer receives a report that one of the most frequently used pages is responding slowly. From the app side, everything looks fine - HTTP requests are fast, network latency is low, and frontend responsiveness is not the issue. The problem appears to be in the database layer.

**The Challenge**: The app uses a code-first approach with Prisma ORM, so SQL is generated automatically. The developer is not a database expert and needs help understanding what's causing the slowdown.

**The Solution**: Using GitHub Copilot Agent mode to analyze the ORM code, connect to the database schema, identify the N+1 query pattern, and provide actionable solutions.

## Demo Context

This app intentionally includes an N+1 query pattern in the `GET /api/posts` endpoint (`app/backend/src/routes/posts.js`). The endpoint fetches posts and then loops through each post to fetch its author separately, resulting in multiple database round trips - a classic ORM performance issue.

## Demo Flow: The Developer's Journey

**Role**: You are a developer who has received a performance complaint. You know there's a problem but need GitHub Copilot's help to diagnose and fix it.

Follow these prompts in order to showcase the authentic developer experience:

### 1. The Initial Problem Report

```text
I'm getting complaints that the main posts page in my app is loading really slowly. The frontend seems fine and the HTTP requests look normal, but something is definitely wrong. Can you help me figure out what's causing this performance issue?
```

**Expected outcome**: Copilot should start investigating the codebase and suggest looking at the database layer.

---

### 2. Deep Dive into the Slow Endpoint

```text
I suspect the issue is with the GET /api/posts endpoint. Can you look at the code in `app/backend/src/routes/posts.js` and connect to my local blogdb database to understand why this might be slow? I'm using Prisma ORM so I'm not writing SQL directly.
```

**Expected outcome**: Copilot should analyze the Prisma code, connect to the database, and identify the N+1 pattern by examining both the ORM queries and the database schema.

---

### 3. Understanding What's Actually Happening

```text
I keep hearing about something called "N+1 queries" but I don't really understand what that means. Is that what's happening here? Can you explain it in simple terms and show me what SQL is actually being generated?
```

**Expected outcome**: Copilot should explain that:
- First query: `SELECT * FROM Post`
- Then N queries: `SELECT * FROM Author WHERE id = ?` (once per post)

---

### 3. Database Performance Analysis

```text
My database queries seem really slow. Can you help me figure out if there are any database issues that might be causing this? I'm not sure what to look for.
```

**Expected outcome**: Copilot should identify missing indexes on foreign keys and suggest optimal index strategy.

---

### 4. Query Execution Plan Analysis

```text
This specific query is taking forever: SELECT * FROM Post p LEFT JOIN Author a ON p.authorId = a.id. Can you help me understand why it's so slow and what I can do to fix it?
```

**Expected outcome**: Copilot should show table scans, missing index recommendations, and cost analysis.

---

### 4. Getting the Fix

```text
Okay, now I understand the problem. How do I fix this? Can you show me how to change my Prisma query to get all the data in one go instead of making all these separate database calls?
```

**Expected outcome**: Copilot should suggest the include solution:

```javascript
const posts = await prisma.post.findMany({
  include: {
    author: true,
  },
});
```

---

### 5. Database-Level Investigation

```text
My database queries seem really slow in general. Can you help me figure out if there are any database issues that might be making things worse? I'm not sure what to look for.
```

**Expected outcome**: Copilot should identify missing indexes on foreign keys and suggest optimal index strategy.

---

### 6. Understanding Database Performance

```text
I keep hearing that indexes can make databases faster, but I don't really understand them. Can you look at my database and tell me if I'm missing any important indexes that would help with performance?
```

**Expected outcome**: Copilot should suggest:

---

**Expected outcome**: Copilot should suggest:

```sql
-- Covering index for posts with author data
CREATE NONCLUSTERED INDEX IX_Post_AuthorId_Covering 
ON Post(authorId) INCLUDE (id, title, content, createdAt);

-- Composite index for comments
CREATE NONCLUSTERED INDEX IX_Comment_PostId_AuthorId 
ON Comment(postId, authorId);
```

---

### 7. Overall Database Health

```text
My database feels sluggish overall. Is there some kind of general maintenance or cleanup I should be doing to keep it running well? I'm not sure what database maintenance even involves.
```

**Expected outcome**: Copilot should check:
- Index fragmentation levels
- Table statistics freshness  
- Missing statistics recommendations
- Suggest UPDATE STATISTICS or REBUILD INDEX operations

---

### 8. Investigating a Specific Slow Query

```text
This specific query is taking forever: SELECT * FROM Post p LEFT JOIN Author a ON p.authorId = a.id. Can you help me understand why it's so slow and what I can do to fix it? I really don't know much about database performance.
```

**Expected outcome**: Copilot should suggest analyzing the execution plan and then identify:
- Table scans that could become index seeks
- Key lookup operations indicating missing covering indexes
- Sort operations that could benefit from clustered indexes
- Join strategies and their performance implications

---

### 9. Setting Up Monitoring

```text
I want to start monitoring my database performance but I don't know where to begin. What should I be tracking to catch performance problems early, and how do I set that up?
```

**Expected outcome**: A comprehensive performance assessment with:

```sql
-- Top consuming queries by duration
SELECT TOP 10
    total_elapsed_time/execution_count as avg_duration_ms,
    execution_count,
    SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(st.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset)/2) + 1) AS statement_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY avg_duration_ms DESC;
```

---

## Summary: Comprehensive Database Performance Analysis with GitHub Copilot

This demo showcases how GitHub Copilot can work synergistically with the MSSQL extension to provide:

1. **Code-Level Analysis**: Detecting N+1 query patterns and suggesting Prisma optimizations
2. **Database Schema Analysis**: Using `@mssql` commands to analyze table structures and relationships
3. **Index Strategy**: Comprehensive indexing recommendations based on query patterns
4. **Performance Monitoring**: Real-time session monitoring with custom bash scripts
5. **Query Plan Analysis**: Deep-dive execution plan optimization suggestions
6. **Baseline Performance**: Establishing monitoring queries for ongoing performance tracking

**Key Takeaway**: By combining GitHub Copilot's code understanding with direct database analysis capabilities, developers can identify performance bottlenecks at both the application and database layers, creating a comprehensive optimization strategy.

---

## Next Steps

After running through this demo:

1. **Apply Index Recommendations**: Implement the suggested composite and covering indexes
2. **Monitor Query Performance**: Use the performance baseline queries to track improvements
3. **Iterate on Code Changes**: Apply Copilot's N+1 optimization suggestions
4. **Automate Monitoring**: Schedule the bash scripts for continuous performance tracking
5. **Document Findings**: Create a performance optimization playbook based on Copilot's suggestions

The combination of GitHub Copilot's AI-powered analysis with direct database tooling creates a powerful workflow for comprehensive performance optimization.

### 6. Full Stack Trace Analysis

```text
Trace the call from the React component to the Express route to the Prisma query and tell me which part is the bottleneck.
```

**Expected outcome**: Copilot should trace:
1. React `App.jsx` → `fetch('/api/posts')`
2. Express `posts.js` → route handler
3. Prisma queries → the loop causing N+1
4. Identify the loop as the bottleneck

---

### 7. Compare Before/After

```text
Show me a diff between the N+1 version of GET /api/posts and the optimized version.
```

**Expected outcome**: Copilot should show:
- **Before**: Loop with separate `author.findUnique()` calls
- **After**: Single `post.findMany()` with `include: { author: true }`

---

### 8. Database Reset Instructions

```text
I dropped and recreated the blogdb in the SQL Server container. Generate the exact Prisma commands I need to reapply the schema and seed the data.
```

**Expected outcome**: Copilot should provide:
```bash
npx prisma migrate dev
npm run seed
```

---

## Tips for Presenting the Demo

1. **Show the slow response time first**: Load the React app and show the Network tab with the slow `/api/posts` call.

2. **Enable Prisma query logging**: In `app/backend/src/index.js`, uncomment the Prisma client logging to show all SQL queries in the console.

3. **Run the prompts one at a time**: Walk through each prompt, showing how Copilot analyzes the code and suggests improvements.

4. **Apply the fix**: After Copilot suggests the optimized code, apply it to `posts.js` and restart the backend.

5. **Show the performance improvement**: Reload the React app and compare the response time (should be much faster).

6. **Bonus**: Use the MSSQL extension to run a query profiler or view the actual SQL queries hitting the database.

## Additional Prompts (Optional)

### Add Pagination

```
Add pagination to the GET /api/posts endpoint with query parameters for page and limit. Update the React component to support pagination.
```

### Add Error Handling

```
Add proper error handling to the Express routes and show user-friendly error messages in the React app.
```

### Generate Tests

```
Generate Jest tests for the GET /api/posts endpoint that verify the N+1 fix works correctly.
```

### Performance Monitoring

```
Add logging middleware to the Express app that tracks the response time for each request and logs slow queries.
```

---

## Expected Performance Results

- **N+1 version**: 40+ database queries, ~300-500ms response time (depending on network latency)
- **Optimized version**: 1 database query, ~20-50ms response time

The improvement should be dramatic and immediately visible in both the Network tab and backend console logs.
