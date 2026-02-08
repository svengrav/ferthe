import { Link } from "react-router-dom";
import Page from "../components/Page";
import { useBlogPosts } from "../hooks/useBlog";

export function BlogList() {
  const { posts, loading, error } = useBlogPosts();

  if (loading) {
    return (
      <div className="bg-gray-950 flex flex-grow items-center justify-center p-8">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-950 flex flex-grow items-center justify-center p-8">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 min-h-screen">
      <Page title="Blog">
        <div className="space-y-8">
          {posts.length === 0 && (
            <p className="text-gray-400">No blog posts available yet.</p>
          )}
          {posts.map((post) => (
            <article key={post.slug} className="border-b border-gray-700 pb-6">
              <Link to={`/blog/${post.slug}`} className="group">
                <h2 className="text-2xl font-semibold text-white group-hover:text-blue-400 transition-colors mb-2">
                  {post.title}
                </h2>
                <div className="flex gap-4 text-sm text-gray-400 mb-3">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString()}
                  </time>
                  {post.author && <span>by {post.author}</span>}
                  <span className="uppercase text-xs">{post.language}</span>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </article>
          ))}
        </div>
      </Page>
    </div>
  );
}
