import { Link, useParams } from "react-router-dom";
import Markdown from "../components/Markdown";
import { useBlogPost } from "../hooks/useBlog";
import { useMarkdown } from "../hooks/useMarkdown";

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading, error } = useBlogPost(slug || "");
  const processedContent = useMarkdown(post?.content || "");

  if (loading) {
    return (
      <div className="bg-gray-950 flex flex-grow items-center justify-center p-8 min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-gray-950 flex flex-grow items-center justify-center p-8 min-h-screen">
        <div className="text-red-400">Error: {error || "Post not found"}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-950 rounded-lg p-8 border border-gray-700 shadow-lg text-white">
          <Link
            to="/blog"
            className="text-blue-500 hover:text-blue-300 font-medium mb-4 inline-block"
          >
            ← Back to Blog
          </Link>

          <article>
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                {post.title}
              </h1>
              <div className="flex gap-4 text-sm text-gray-400 mb-4">
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
              <div className="w-16 h-1 bg-blue-500 mt-6"></div>
            </header>

            <div className="prose prose-lg prose-invert max-w-none">
              <Markdown content={processedContent} />
            </div>
          </article>

          <footer className="mt-12 pt-8 border-t border-gray-600">
            <Link
              to="/blog"
              className="text-blue-500 hover:text-blue-300 font-medium"
            >
              ← Back to Blog
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
