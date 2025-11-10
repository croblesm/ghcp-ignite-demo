# GitHub Copilot Demo Prompts

This file contains prompts to use with GitHub Copilot (Agent mode) to analyze and fix the N+1 performance issue in this demo app.

## Context

This app intentionally includes an N+1 query pattern in the `GET /api/posts` endpoint (`app/backend/src/routes/posts.js`). The endpoint fetches posts and then loops through each post to fetch its author separately, resulting in multiple database round trips.

## Demo Flow

Follow these prompts in order to showcase GitHub Copilot's capabilities:

### 1. Analyze the Slow Endpoint

```
@mssql analyze the Express handler for GET /api/posts in `app/backend/src/routes/posts.js` and explain why the call to SQL Server 2025 is slow.
```

**Expected outcome**: Copilot should identify the loop that makes separate queries for each author.

---

### 2. Detect the N+1 Pattern

```
Is this Prisma code causing an N+1 pattern? Show me the SQL it likely generates.
```

**Expected outcome**: Copilot should explain that:
- First query: `SELECT * FROM Post`
- Then N queries: `SELECT * FROM Author WHERE id = ?` (once per post)

---

### 3. Request the Optimized Solution

```
Refactor the Prisma query in `app/backend/src/routes/posts.js` to load authors in a single query using include.
```

**Expected outcome**: Copilot should suggest:
```javascript
const posts = await prisma.post.findMany({
  include: {
    author: true,
  },
});
```

---

### 4. Generate Optimized Query for SQL Server

```
Generate an optimized Prisma query for SQL Server that returns posts and their authors in one round trip.
```

**Expected outcome**: Similar to above, emphasizing the JOIN behavior.

---

### 5. Index Suggestion

```
Suggest an index for the Post table to improve lookups by authorId.
```

**Expected outcome**: Copilot might suggest that Prisma already creates an index on the foreign key `authorId`, but if needed:
```sql
CREATE INDEX idx_post_authorId ON Post(authorId);
```

---

### 6. Full Stack Trace Analysis

```
Trace the call from the React component to the Express route to the Prisma query and tell me which part is the bottleneck.
```

**Expected outcome**: Copilot should trace:
1. React `App.jsx` → `fetch('/api/posts')`
2. Express `posts.js` → route handler
3. Prisma queries → the loop causing N+1
4. Identify the loop as the bottleneck

---

### 7. Compare Before/After

```
Show me a diff between the N+1 version of GET /api/posts and the optimized version.
```

**Expected outcome**: Copilot should show:
- **Before**: Loop with separate `author.findUnique()` calls
- **After**: Single `post.findMany()` with `include: { author: true }`

---

### 8. Database Reset Instructions

```
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
