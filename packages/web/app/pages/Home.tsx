import { BlogListContent } from "../components/BlogListContent";
import { BlogPostContent } from "../components/BlogPostContent.tsx";
import { ButtonLink } from "../components/ButtonLink";
import { FeedbackButton } from "../components/FeedbackButton.tsx";
import { Heading } from "../components/Heading";
import { Logo } from "../components/Logo.tsx";
import Markdown from "../components/Markdown";
import Page from "../components/Page";
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
    <Page loading={loadingGerman} wide>
      <div className="flex flex-1 bg-surface bg-linear-to-t to-indigo-900/10 text-gray-100 justify-center items-center px-4">
        <div className="flex-row max-w-6xl py-8">
          <TrailCanvas className="h-80 bg-linear-to-tl mb-6 ">
            <Logo
              className="absolute fill-white w-96 hover:animate-pulse cursor-pointer"
              height={200}
            />
          </TrailCanvas>

          <div className="flex gap-8">
            <div className="flex flex-1   flex-col items-start  gap-2">
              <Heading light>Über ferthe...</Heading>
              <div className="line-clamp-2 mb-4">
                <Markdown content={germanHomeStory} />
              </div>
              <ButtonLink to="/about">Mehr</ButtonLink>
            </div>
            <div className="hidden  lg:flex flex-col w-sm align-top   gap-2">
              <Heading light>Links</Heading>
              <FeedbackButton>Feedback</FeedbackButton>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 flex flex-col flex-1 px-4">
        <div className=" mx-auto max-w-6xl flex flex-col flex-1 ">
          <div className="flex justify-center" id="divider">
            <div className="w-10 h-1 bg-surface my-4" />
          </div>
          <div className="flex flex-row gap-8 mx-auto max-w-6xl">
            <div className="mb-8 flex-1">
              <div className="flex justify-between items-start">
                <Heading>Neues</Heading>
              </div>
              {latestPost.post && <BlogPostContent post={latestPost.post} />}
            </div>

            <div className="hidden lg:flex flex-col w-sm align-top gap-2 items-start ">
              <Heading>Blog</Heading>
              <BlogListContent posts={posts} limit={3} startIndex={1} />
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
