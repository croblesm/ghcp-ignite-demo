# GitHub Copilot Demo: Diagnosing Backend Database Performance Issues

## 📋 Demo Overview

**The Scenario**: A developer reports that the blog posts page is loading slowly. Everything looks fine on the frontend, but the database layer is the bottleneck. The app uses Prisma ORM with SQL Server, but the developer isn't a database expert.

**The Challenge**: Identify and fix the N+1 query problem - a classic ORM performance issue where the app makes 1 query to fetch posts, then N separate queries to fetch each post's related data.

**The Solution**: Use GitHub Copilot with the MSSQL extension to analyze both the ORM code and database schema, identify the problem, and suggest optimizations.

---

## 🎯 How to Run the Demo

**Use the prompts in [`demo-prompts-v2.html`](demo-prompts-v2.html)** - this is the authoritative source for all GitHub Copilot prompts.

**Options:**
- **Master Prompt**: One comprehensive prompt that guides you through the entire investigation and fix
- **Follow-Up Prompts (1-4)**: Optional deeper dives into specific topics (N+1 problem, indexes, monitoring, migrations)

---

## 📚 Demo Context

### The N+1 Problem in This App

The `GET /api/posts` endpoint (`app/backend/src/routes/posts.js`) intentionally demonstrates the N+1 pattern:

```javascript
// SLOW: N+1 queries
const posts = await prisma.post.findMany();
for (let post of posts) {
  post.author = await prisma.author.findUnique({
    where: { id: post.authorId }
  });
}
```

With 10,000 posts, this results in **80,000+ database queries** (due to nested N+1 patterns with authors, comments, tags, etc.), making the response time extremely slow - perfect for demonstrating the problem!

### The Fix

Using Prisma's `include()` for eager loading:

```javascript
// FAST: Single optimized query
const posts = await prisma.post.findMany({
  include: {
    author: true,
  },
});
```

This results in **1 optimized query** with JOINs.

---

## 🎬 Tips for Presenting

1. **Show the problem first**: Open the React app and check the Network tab. The `/api/posts` call will be very slow (18-20 seconds).

2. **Enable Prisma logging**: Uncomment the Prisma client logging in `app/backend/src/index.js` to see all SQL queries in the console.

3. **Copy the master prompt**: Open `demo-prompts-v2.html`, copy the **Master Prompt**, and paste it into GitHub Copilot.

4. **Let Copilot guide you**: Copilot will:
   - Connect to your database using the MSSQL extension
   - Analyze the Prisma schema and route handler
   - Identify the N+1 pattern
   - Suggest fixes using eager loading
   - Recommend database indexes

5. **Apply the fix**: Implement Copilot's suggestion in `posts.js` and restart the backend.

6. **Show the improvement**: Reload the React app and check the Network tab again. Response time should drop dramatically (from 18+ seconds to under 1 second).

7. **Verify with MSSQL extension**: Use the MSSQL extension to run the optimized query and see the execution plan showing efficient index usage.

---

## ⚙️ Expected Performance Results

| Metric | N+1 Version | Optimized |
|--------|------------|-----------|
| Database Queries | 80,000+ | 1 |
| Response Time | 18-20 seconds | < 1 second |
| Backend Console | Hundreds of query logs | Single query log |

The improvement is dramatic and immediately visible!

---

## 📊 What Copilot Demonstrates

This demo showcases how GitHub Copilot with the MSSQL extension provides:

1. **Code Analysis**: Detects N+1 patterns in ORM code
2. **Database Schema Analysis**: Connects to the database to understand relationships
3. **Problem Explanation**: Explains N+1 in simple terms for developers new to databases
4. **Optimization Suggestions**: Recommends eager loading with Prisma `include()`
5. **Index Recommendations**: Suggests optimal indexes for the schema
6. **Verification Guidance**: Shows how to verify improvements using the MSSQL extension

---

## 🔧 Optional Additional Prompts

After running the master demo, you can use these prompts for deeper exploration:

### Add Pagination

```text
Add pagination to the GET /api/posts endpoint with query parameters for page and limit. Update the React component to support pagination.
```

### Add Error Handling

```text
Add proper error handling to the Express routes and show user-friendly error messages in the React app.
```

### Generate Tests

```text
Generate Jest tests for the GET /api/posts endpoint that verify the N+1 fix works correctly.
```

### Performance Monitoring

```text
Add logging middleware to the Express app that tracks the response time for each request and logs slow queries.
```

---

## 📖 Additional Resources

- **README.md**: Setup and project structure
- **demo-prompts-v2.html**: All GitHub Copilot prompts (master + follow-ups)
- **demo-prompts-v1.html**: Alternative prompts for reference
- **app/backend/scripts/**: Database management and monitoring tools
