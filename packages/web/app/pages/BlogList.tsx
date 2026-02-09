import { BlogListContent } from "../components/BlogListContent";
import Page from "../components/Page";
import { useBlogPosts } from "../hooks/useBlog";

export function BlogList() {
  const { posts, loading, error } = useBlogPosts();

  if (error) {
    return (
      <Page title="Error">
        <div>Error: {error}</div>
      </Page>
    );
  }

  return (
    <Page
      title="Blog"
      loading={loading}
      backButton={{ text: "← Back to Home", path: "/" }}
    >
      <BlogListContent posts={posts} />
    </Page>
  );
}
