import { ButtonLink } from "../components/ButtonLink";
import { FeedbackButton } from "../components/FeedbackButton.tsx";
import { Heading } from "../components/Heading";
import { LinkedInButton } from "../components/LinkedInButton.tsx";
import { Logo } from "../components/Logo.tsx";
import Page from "../components/Page";
import { TrailCanvas } from "../components/TrailCanvas.tsx";
import { BlogListContent } from "../features/blog/BlogListContent";
import { BlogPostContent } from "../features/blog/BlogPostContent.tsx";
import { useBlogPost, useBlogPosts } from "../features/blog/useBlog";
import { FAQCarousel } from "../features/faq/FAQCarousel";
import { useContent } from "../hooks/useContent";

export function Home() {
  const { loading: loadingGerman, metadata } = useContent(
    "home",
    "de",
  );
  const { posts } = useBlogPosts();
  const latestPost = useBlogPost(posts[0]?.slug || "");

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
            <div className="flex flex-1 flex-col items-start gap-2 lg:max-w-3/5">
              <Heading light>
                {metadata?.title || "Irgendwo in Münster..."}
              </Heading>
              <div className="line-clamp-2 mb-4">
                {metadata?.summary}
              </div>
              <ButtonLink to="/about">Mehr</ButtonLink>
            </div>
            <div className="hidden lg:flex flex-col w-sm align-top gap-2">
              <Heading light>Links</Heading>
              <div className="flex flex-row gap-2">
                <FeedbackButton>Feedback</FeedbackButton>
                <LinkedInButton />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white py-4">
        <div className="mx-auto max-w-6xl">
          <FAQCarousel language="de" />
        </div>
      </div>

      <div className="bg-gray-50 flex flex-col flex-1 px-4">
        <div className=" mx-auto max-w-6xl flex flex-col flex-1 ">
          {/* Divider */}
          <div className="flex justify-center" id="divider">
            <div className="w-10 h-1 bg-surface my-4" />
          </div>

          <div className="flex flex-row gap-8 mx-auto max-w-6xl">
            {/* News */}
            <div className="mb-8 flex-1 lg:max-w-3/5">
              <div className="flex justify-between items-start">
                <Heading>Neues</Heading>
              </div>
              {latestPost.post && <BlogPostContent post={latestPost.post} />}
            </div>

            {/* Blog */}
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
