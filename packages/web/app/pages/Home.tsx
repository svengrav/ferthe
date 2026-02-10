import { BlogListContent } from "../components/BlogListContent";
import { BlogPostContent } from "../components/BlogPostContent.tsx";
import { ButtonLink } from "../components/ButtonLink";
import { Heading } from "../components/Heading";
import Markdown from "../components/Markdown";
import Page from "../components/Page";
import { TextLink } from "../components/TextLink.tsx";
import { TrailCanvas } from "../components/TrailCanvas.tsx";
import { useBlogPost, useBlogPosts } from "../hooks/useBlog";
import { useContent } from "../hooks/useContent";
import { useMarkdown } from "../hooks/useMarkdown";

export function Home() {
  const { content: germanContent, loading: loadingGerman } = useContent(
    "home",
    "de",
  );
  const { posts } = useBlogPosts();
  const latestPost = useBlogPost(posts[0]?.slug || "");

  const germanHomeStory = useMarkdown(germanContent);

  return (
    <Page loading={loadingGerman}>
      <div className="flex-col flex gap-8">
        <TrailCanvas className="h-80 bg-emerald-600 to-gray-600 bg-linear-to-tl" />

        <div className="flex">
          <div className="flex flex-col items-start gap-2">
            <Heading>Über...</Heading>
            <div className="line-clamp-2 mb-4">
              <Markdown content={germanHomeStory} />
            </div>
            <ButtonLink to="/about">Mehr</ButtonLink>
          </div>
          <div className="hidden lg:flex lg:w-xl ">
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-10 h-1 bg-primary my-4" />
        </div>
        <div className="flex gap-8">
          <div className=" mb-8">
            <div className="flex justify-between items-start">
              <Heading>Neues</Heading>
            </div>
            {latestPost.post && <BlogPostContent post={latestPost.post} />}
          </div>

          <div className="hidden lg:flex flex-col lg:w-lg align-top gap-4 items-end">
            <TextLink to="/blog">Alle Beiträge →</TextLink>
            <BlogListContent posts={posts} limit={3} startIndex={1} />
          </div>
        </div>
      </div>
    </Page>
  );
}
