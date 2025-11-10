const express = require('express');
const router = express.Router();

/**
 * GET /api/posts
 *
 * Fetches all posts with their authors, comments, and tags.
 *
 * CURRENT IMPLEMENTATION: INTENTIONAL SEVERE N+1 FOR DEMO PURPOSES
 * This version demonstrates a TERRIBLE N+1 query problem by:
 * 1. Fetching all posts in one query
 * 2. For EACH post, fetching its author separately (N queries)
 * 3. For EACH post, fetching its comments separately (N queries)
 * 4. For EACH comment, fetching its author separately (M queries)
 * 5. For EACH post, fetching its tags separately (N queries)
 *
 * With 1000 posts (default limit) and ~6 comments each, this results in:
 * - 1 query for posts
 * - 1,000 queries for authors
 * - 1,000 queries for comments
 * - ~6,000 queries for comment authors
 * - 1,000 queries for tags
 * = ~9,000+ SEPARATE DATABASE QUERIES!
 *
 * Note: You can fetch more by passing ?limit=10000 for the full 80,000+ queries (extremely slow)
 *
 * Additionally, database indexes are removed from foreign keys to make queries slower.
 */
router.get('/', async (req, res) => {
  const prisma = req.app.locals.prisma;

  try {
    const startTime = Date.now();
    let queryCount = 0;

    // INTENTIONAL N+1 FOR DEMO PURPOSES
    // Step 1: Fetch posts with pagination (1 query) - limited to 1000 for semi-slow demo
    const limit = parseInt(req.query.limit) || 1000;
    console.log(`[N+1 VERSION] Fetching ${limit} posts...`);
    const posts = await prisma.post.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
    queryCount++;

    console.log(`[N+1 VERSION] Fetching data for ${posts.length} posts...`);

    // Step 2: For each post, fetch its author separately (N queries)
    for (let post of posts) {
      post.author = await prisma.author.findUnique({
        where: { id: post.authorId },
      });
      queryCount++;
    }

    // Step 3: For each post, fetch its comments separately (N queries)
    for (let post of posts) {
      post.comments = await prisma.comment.findMany({
        where: { postId: post.id },
      });
      queryCount++;

      // Step 4: For each comment, fetch its author separately (M queries)
      for (let comment of post.comments) {
        comment.author = await prisma.author.findUnique({
          where: { id: comment.authorId },
        });
        queryCount++;
      }
    }

    // Step 5: For each post, fetch its tags separately (N queries)
    for (let post of posts) {
      const postTags = await prisma.postTag.findMany({
        where: { postId: post.id },
        include: { tag: true },
      });
      post.tags = postTags.map(pt => pt.tag);
      queryCount++;
    }

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    const performanceLog = `
========================================
[N+1 VERSION - TERRIBLE PERFORMANCE]
Fetched ${posts.length} posts in ${queryTime}ms
Total database queries: ${queryCount}
Average time per query: ${(queryTime / queryCount).toFixed(2)}ms
========================================`;

    console.log(performanceLog);

    res.json({
      posts,
      meta: {
        count: posts.length,
        queryTimeMs: queryTime,
        queryCount: queryCount,
        version: 'n+1',
        performanceLog: performanceLog.trim(),
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.get('/search', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { q } = req.query;

  try {
    const startTime = Date.now();
    let queryCount = 0;

    console.log(`[SEARCH N+1 VERSION] Searching for: "${q}"`);

    // TERRIBLE: Fetch ALL comments (full table scan, 6000+ rows!)
    console.log('[SEARCH] Fetching ALL comments from database...');
    const allComments = await prisma.comment.findMany();
    queryCount++;

    // TERRIBLE: Filter in JavaScript instead of SQL
    const matchingComments = allComments.filter(c =>
      c.content.toLowerCase().includes((q || '').toLowerCase())
    );
    console.log(`[SEARCH] Found ${matchingComments.length} matching comments out of ${allComments.length}`);

    // TERRIBLE: Get unique post IDs and fetch each post separately
    const uniquePostIds = [...new Set(matchingComments.map(c => c.postId))];
    console.log(`[SEARCH] Fetching ${uniquePostIds.length} posts individually...`);

    const posts = [];
    for (const postId of uniquePostIds) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });
      queryCount++;

      if (post) {
        // For each post, fetch author separately
        post.author = await prisma.author.findUnique({
          where: { id: post.authorId },
        });
        queryCount++;

        // For each post, fetch ALL its comments separately
        post.comments = await prisma.comment.findMany({
          where: { postId: post.id },
        });
        queryCount++;

        // For each comment, fetch its author
        for (const comment of post.comments) {
          comment.author = await prisma.author.findUnique({
            where: { id: comment.authorId },
          });
          queryCount++;
        }

        // For each post, fetch tags
        const postTags = await prisma.postTag.findMany({
          where: { postId: post.id },
          include: { tag: true },
        });
        post.tags = postTags.map(pt => pt.tag);
        queryCount++;

        posts.push(post);
      }
    }

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    const performanceLog = `
========================================
[SEARCH N+1 VERSION - CATASTROPHIC PERFORMANCE]
Search query: "${q}"
Found ${posts.length} posts in ${queryTime}ms
Total database queries: ${queryCount}
Average time per query: ${(queryTime / queryCount).toFixed(2)}ms
========================================`;

    console.log(performanceLog);

    res.json({
      posts,
      meta: {
        count: posts.length,
        queryTimeMs: queryTime,
        queryCount: queryCount,
        searchQuery: q,
        version: 'search-n+1',
        performanceLog: performanceLog.trim(),
      },
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

module.exports = router;
