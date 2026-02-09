import { Link } from "react-router-dom";
import { BlogListContent } from "../components/BlogListContent";
import Markdown from "../components/Markdown";
import Page from "../components/Page";
import { TrailAnimation } from "../components/TrailAnimation";
import { useBlogPosts } from "../hooks/useBlog";
import { useContent } from "../hooks/useContent";
import { useMarkdown } from "../hooks/useMarkdown";

export function Home() {
  const { content: germanContent, loading: loadingGerman } = useContent(
    "home",
    "de",
  );
  const { posts } = useBlogPosts();

  const germanHomeStory = useMarkdown(germanContent);

  return (
    <Page loading={loadingGerman}>
      <div>
        <TrailAnimation />

        <div className="mb-16">
          <h2 className="text-3xl font-semibold mb-6">ferthe</h2>
          <div className="line-clamp-4 mb-4">
            <Markdown content={germanHomeStory} />
          </div>
          <Link to="/about" className="hover:underline">
            Read more →
          </Link>
        </div>

        <div className="mt-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-semibold">Latest Blog Posts</h2>
            <Link to="/blog" className="hover:underline">
              View all →
            </Link>
          </div>
          <BlogListContent posts={posts} limit={3} />
        </div>
      </div>
    </Page>
  );
}
