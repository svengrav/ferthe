import { useParams } from "react-router-dom";
import { BlogPostContent } from "../components/BlogPostContent";
import Page from "../components/Page";
import { useBlogPost } from "../hooks/useBlog";

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading, error } = useBlogPost(slug || "");

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
      loading={loading}
      backButton={{ text: "← Back to Blog", path: "/blog" }}
      title={post ? post.title : "Loading..."}
    >
      {post && <BlogPostContent post={post} />}
    </Page>
  );
}
