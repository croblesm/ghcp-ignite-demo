import { useState, useEffect } from 'react';

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    setIsSearchMode(false);

    try {
      const response = await fetch('/api/posts');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPosts(data.posts);
      setMeta(data.meta);
      setFetchedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchPosts = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchPosts();
      return;
    }

    setLoading(true);
    setError(null);
    setIsSearchMode(true);

    try {
      const response = await fetch(`/api/posts/search?q=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPosts(data.posts);
      setMeta(data.meta);
      setFetchedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
      console.error('Error searching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Blog Posts</h1>
        <p style={styles.subtitle}>N+1 Query Performance Demo</p>
      </header>

      {loading && (
        <div style={styles.loading}>
          <p>Loading posts...</p>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          <p>Error: {error}</p>
          <button onClick={fetchPosts} style={styles.button}>
            Retry
          </button>
        </div>
      )}

      <div style={styles.searchContainer}>
        <form onSubmit={searchPosts} style={styles.searchForm}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in comments (very slow N+1 query)..."
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton}>
            Search
          </button>
          {isSearchMode && (
            <button type="button" onClick={() => { setSearchQuery(''); fetchPosts(); }} style={styles.clearButton}>
              Clear Search
            </button>
          )}
        </form>
      </div>

      {!loading && !error && meta && (
        <div style={styles.meta}>
          <p>
            <strong>Fetched:</strong> {meta.count} posts in {meta.queryTimeMs}ms
          </p>
          {meta.queryCount && (
            <p>
              <strong>Queries:</strong> {meta.queryCount}
            </p>
          )}
          <p>
            <strong>Version:</strong> {meta.version}
          </p>
          {meta.searchQuery && (
            <p>
              <strong>Search:</strong> "{meta.searchQuery}"
            </p>
          )}
          <p>
            <strong>Time:</strong> {fetchedAt}
          </p>
          <button onClick={fetchPosts} style={styles.button}>
            Refresh
          </button>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div style={styles.postsList}>
          {posts.map((post) => (
            <article key={post.id} style={styles.postCard}>
              <h2 style={styles.postTitle}>{post.title}</h2>
              <p style={styles.author}>
                By <strong>{post.author?.name || 'Unknown'}</strong>
                {post.author?.email && (
                  <span style={styles.email}> ({post.author.email})</span>
                )}
              </p>
              <p style={styles.content}>{post.content}</p>
              <p style={styles.date}>
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    borderBottom: '2px solid #333',
    paddingBottom: '20px',
  },
  subtitle: {
    color: '#666',
    fontSize: '16px',
    marginTop: '5px',
  },
  searchContainer: {
    marginBottom: '20px',
  },
  searchForm: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    padding: '10px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '4px',
  },
  searchButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  clearButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    color: '#d32f2f',
  },
  meta: {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginLeft: 'auto',
  },
  postsList: {
    display: 'grid',
    gap: '20px',
  },
  postCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  postTitle: {
    fontSize: '24px',
    marginBottom: '10px',
    color: '#333',
  },
  author: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '15px',
  },
  email: {
    color: '#888',
    fontSize: '13px',
  },
  content: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#444',
    marginBottom: '15px',
  },
  date: {
    fontSize: '13px',
    color: '#999',
    marginTop: '10px',
  },
};

export default App;
