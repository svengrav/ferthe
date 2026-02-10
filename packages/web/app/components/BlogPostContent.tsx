import { useMarkdown } from "../hooks/useMarkdown";
import type { BlogPost } from "../types/blog";
import Markdown from "./Markdown";
import { Tag } from "./Tag.tsx";

interface BlogPostContentProps {
  post: BlogPost;
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  const processedContent = useMarkdown(post.content || "");

  if (!post.content) {
    return null;
  }
  return (
    <article className="flex-col flex gap-2">
      <div className="flex justify-between" id="meta">
        <div className="flex gap-2 text-sm text-gray-500">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString()}
          </time>
          {post.author && <span>von {post.author}</span>}
        </div>
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {post.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
          </div>
        )}
      </div>

      <Markdown content={processedContent} />
    </article>
  );
}
