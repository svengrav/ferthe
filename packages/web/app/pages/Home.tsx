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
      <div
        id="head-wide"
        className="flex flex-1  bg-surface bg-linear-to-t to-slate-900/10 text-gray-100 justify-center items-center w-full"
      >
        <div className="flex-col px-8 lg:px-0 lg:flex-row  flex py-30 max-w-7xl w-full">
          <div
            id="col-left"
            className="flex flex-1 justify-center items-center"
          >
            <div className="flex flex-col">
              <Logo
                className=" fill-white hover:animate-pulse cursor-pointer w-full justify-center mb-10"
                height={250}
                width={250}
              />
              <Heading light className="text-4xl">
                {metadata?.title || "Irgendwo in Münster..."}
              </Heading>
              <div className=" mb-4 text-xl line-clamp-3 leading-relaxed">
                {metadata?.summary}
              </div>
              <ButtonLink to="/about">Mehr</ButtonLink>

              <div className="flex flex-row gap-2 mt-10 justify-end">
                <FeedbackButton>Feedback</FeedbackButton>
                <LinkedInButton />
              </div>
            </div>
          </div>

          <div
            id="col-right"
            className=" flex-1 items-center justify-center p-4 rounded-xl  "
          >
            <TrailCanvas className="bg-linear-to-tl  flex flex-1 justify-center  overflow-hidden w-full bg-indigo-900/20 to-indigo-900/50 p-4">
              <div
                id="phone"
                className=" flex-col align-top gap-2 relative max-w-90 w-full aspect-1/2"
              >
                {/* App screenshot */}
                <div className="absolute inset-0 overflow-hidden bg-pink-600 z-1 rounded-3xl shadow-2xl ">
                </div>
                {/* Phone frame overlay */}
                <img
                  src="/phone-transparent.png"
                  className="absolute inset-0 w-full h-full object-contain z-2 pointer-events-none"
                  alt=""
                />
              </div>
            </TrailCanvas>
          </div>
        </div>
      </div>

      {
        /* <div className="bg-white py-4">
        <div className="mx-auto max-w-7xl">
          <FAQCarousel language="de" />
        </div>
      </div> */
      }

      <div className="bg-gray-50 flex flex-col flex-1 px-4">
        <div className=" mx-auto max-w-7xl flex flex-col flex-1 ">
          {/* Divider */}
          <div className="flex justify-center" id="divider">
            <div className="w-10 h-1 bg-surface my-4" />
          </div>

          <div className="flex flex-row gap-8 mx-auto max-w-7xl">
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
