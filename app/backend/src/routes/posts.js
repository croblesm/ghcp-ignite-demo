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
 * With 10,000 posts and ~6 comments each, this results in:
 * - 1 query for posts
 * - 10,000 queries for authors
 * - 10,000 queries for comments
 * - ~60,000 queries for comment authors
 * - 10,000 queries for tags
 * = ~80,000+ SEPARATE DATABASE QUERIES!
 *
 * Additionally, database indexes are removed from foreign keys to make queries slower.
 */
router.get('/', async (req, res) => {
  const prisma = req.app.locals.prisma;

  try {
    const startTime = Date.now();
    let queryCount = 0;

    // INTENTIONAL N+1 FOR DEMO PURPOSES
    // Step 1: Fetch all posts (1 query)
    console.log('[N+1 VERSION] Fetching posts...');
    const posts = await prisma.post.findMany({
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

    console.log(`\n========================================`);
    console.log(`[N+1 VERSION - TERRIBLE PERFORMANCE]`);
    console.log(`Fetched ${posts.length} posts in ${queryTime}ms`);
    console.log(`Total database queries: ${queryCount}`);
    console.log(`Average time per query: ${(queryTime / queryCount).toFixed(2)}ms`);
    console.log(`========================================\n`);

    res.json({
      posts,
      meta: {
        count: posts.length,
        queryTimeMs: queryTime,
        queryCount: queryCount,
        version: 'n+1',
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * OPTIMIZED VERSION (commented out by default)
 *
 * Uncomment this route and comment out the N+1 version above to see the MASSIVE performance improvement.
 *
 * This version uses Prisma's `include` to fetch posts with all related data using efficient JOINs.
 * This results in just a FEW optimized queries instead of 9000+!
 *
 * GitHub Copilot should suggest:
 * 1. Using `include` to fetch related data (reduces queries from ~80,000 to ~2-3)
 * 2. Adding database indexes on foreign keys (improves JOIN performance)
 * 3. Potentially adding pagination to limit the dataset size (CRITICAL with 10k posts!)
 */

/*
router.get('/', async (req, res) => {
  const prisma = req.app.locals.prisma;

  try {
    const startTime = Date.now();

    // OPTIMIZED: Efficient queries with JOINs
    const posts = await prisma.post.findMany({
      include: {
        author: true,
        comments: {
          include: {
            author: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform tags to simpler structure
    const postsWithTags = posts.map(post => ({
      ...post,
      tags: post.tags.map(pt => pt.tag),
    }));

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    console.log(`\n========================================`);
    console.log(`[OPTIMIZED VERSION - GREAT PERFORMANCE]`);
    console.log(`Fetched ${posts.length} posts in ${queryTime}ms`);
    console.log(`Estimated queries: 2-3 (using JOINs)`);
    console.log(`Performance improvement: ${((15000 / queryTime) * 100).toFixed(0)}% faster!`);
    console.log(`========================================\n`);

    res.json({
      posts: postsWithTags,
      meta: {
        count: posts.length,
        queryTimeMs: queryTime,
        queryCount: 2, // Estimated
        version: 'optimized',
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});
*/

/**
 * GET /api/posts/search
 *
 * Search for posts by comment content
 *
 * CURRENT IMPLEMENTATION: CATASTROPHICALLY BAD N+1 WITH FULL TABLE SCANS
 * This demonstrates the WORST possible way to implement search:
 * 1. Fetch ALL comments (no WHERE clause, full table scan of 60,000+ rows!)
 * 2. Filter comments in JavaScript (not in database)
 * 3. For EACH matching comment, fetch the post (N queries)
 * 4. For EACH post, fetch the author (N queries)
 * 5. For EACH post, fetch ALL its comments (N queries)
 * 6. For EACH comment on each post, fetch the author (M queries)
 * 7. For EACH post, fetch tags (N queries)
 *
 * With no indexes and full table scans of 60K+ comments, this will be EXCRUCIATINGLY SLOW!
 */
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

    console.log(`\n========================================`);
    console.log(`[SEARCH N+1 VERSION - CATASTROPHIC PERFORMANCE]`);
    console.log(`Search query: "${q}"`);
    console.log(`Found ${posts.length} posts in ${queryTime}ms`);
    console.log(`Total database queries: ${queryCount}`);
    console.log(`Average time per query: ${(queryTime / queryCount).toFixed(2)}ms`);
    console.log(`========================================\n`);

    res.json({
      posts,
      meta: {
        count: posts.length,
        queryTimeMs: queryTime,
        queryCount: queryCount,
        searchQuery: q,
        version: 'search-n+1',
      },
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

module.exports = router;
