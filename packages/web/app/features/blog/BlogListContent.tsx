import { Link } from "react-router-dom";
import { Tag } from "../../components/Tag.tsx";
import type { BlogPost } from "../../types/blog";
import { dateToLocaleString } from "../../utils/date.ts";

interface BlogListContentProps {
  className?: string;
  posts: BlogPost[];
  startIndex?: number;
  limit?: number;
}

export function BlogListContent(
  { posts, startIndex, limit, className }: BlogListContentProps,
) {
  const displayPosts = limit
    ? posts.slice(startIndex ?? 0, (startIndex ?? 0) + limit)
    : posts;

  if (displayPosts.length === 0) {
    return <p>Nichts zu sehen.</p>;
  }

  return (
    <div className={`space-y-8 ${className || ""}`}>
      {displayPosts.map((post) => (
        <article
          key={post.slug}
          className="pb-4"
        >
          <Link to={`/blog/${post.slug}`} className="group">
            <h2 className="text-2xl font-semibold group-hover:underline transition-colors mb-2">
              {post.title}
            </h2>
            <div className="flex gap-2 text-sm mb-3 text-gray-500">
              <time dateTime={post.date}>
                {dateToLocaleString(new Date(post.date))}
              </time>
              {post.author && <span>von {post.author}</span>}
            </div>
            {post.preview && <p className="mb-3 line-clamp-2">{post.preview}
            </p>}
            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {post.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
              </div>
            )}
          </Link>
          <div className="border-b-2 border-gray-300 pt-4 0" />
        </article>
      ))}
    </div>
  );
}
