import { useParams } from "react-router-dom";
import Markdown from "../components/Markdown";
import Page from "../components/Page";
import { useBlogPost } from "../hooks/useBlog";
import { useMarkdown } from "../hooks/useMarkdown";

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading, error } = useBlogPost(slug || "");
  const processedContent = useMarkdown(post?.content || "");

  if (error || (!post && !loading)) {
    return (
      <Page
        title="Post not found"
        backButton={{ text: "← Back to Blog", path: "/blog" }}
      >
        <div className="text-red-400">Error: {error || "Post not found"}</div>
      </Page>
    );
  }

  return (
    <Page
      title={post?.title}
      loading={loading}
      backButton={{ text: "← Back to Blog", path: "/blog" }}
    >
      {post && (
        <article>
          <div className="flex gap-4 text-sm mb-6">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString()}
            </time>
            {post.author && <span>by {post.author}</span>}
            <span className="uppercase text-xs">{post.language}</span>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <Markdown content={processedContent} />
        </article>
      )}
    </Page>
  );
}
