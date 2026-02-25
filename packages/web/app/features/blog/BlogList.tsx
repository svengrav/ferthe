import Page from "../../components/Page";
import { BlogListContent } from "./BlogListContent";
import { useBlogPosts } from "./useBlog";

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
      <BlogListContent posts={posts} className="max-w-2xl" />
    </Page>
  );
}
