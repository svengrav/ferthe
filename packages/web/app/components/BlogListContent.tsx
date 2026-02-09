import { Link } from "react-router-dom";
import type { BlogPostMetadata } from "../types/blog";

interface BlogListContentProps {
  posts: BlogPostMetadata[];
  limit?: number;
}

export function BlogListContent({ posts, limit }: BlogListContentProps) {
  const displayPosts = limit ? posts.slice(0, limit) : posts;

  if (displayPosts.length === 0) {
    return <p>Nichts zu sehen.</p>;
  }

  return (
    <div className="space-y-8">
      {displayPosts.map((post) => (
        <article key={post.slug} className="border-b border-gray-700 pb-4">
          <Link to={`/blog/${post.slug}`} className="group">
            <h2 className="text-2xl font-semibold group-hover:underline transition-colors mb-2">
              {post.title}
            </h2>
            <div className="flex gap-2 text-sm mb-3 text-gray-400">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString()}
              </time>
              {post.author && <span>von {post.author}</span>}
            </div>
            {post.preview && <p className="mb-3 line-clamp-2">{post.preview}
            </p>}
            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded bg-gray-800"
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
  );
}
