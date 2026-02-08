import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import matter from "gray-matter";
import routeStaticFilesFrom from "./static/static.ts";

export const app = new Application();
const router = new Router();

// Content Routes - Serve markdown files from content directory
router.get("/api/content/:language/:contentType", async (context) => {
  try {
    const { language, contentType } = context.params;

    // Validate language
    if (language !== 'en' && language !== 'de') {
      context.response.status = 400;
      context.response.body = { error: "Invalid language. Use 'en' or 'de'" };
      return;
    }

    // Validate content type
    if (contentType !== 'home' && contentType !== 'privacy') {
      context.response.status = 400;
      context.response.body = { error: "Invalid content type. Use 'home' or 'privacy'" };
      return;
    }

    // Construct file path
    const filePath = `${Deno.cwd()}/content/${language}/${contentType}.md`;

    try {
      const content = await Deno.readTextFile(filePath);
      context.response.headers.set("Content-Type", "text/markdown; charset=utf-8");
      context.response.body = content;
    } catch (error) {
      console.error(`Failed to read file: ${filePath}`, error);
      context.response.status = 404;
      context.response.body = { error: "Content not found" };
    }
  } catch (error) {
    console.error("Content route error:", error);
    context.response.status = 500;
    context.response.body = { error: error instanceof Error ? error.message : "Failed to load content" };
  }
});

// Blog Routes
router.get("/api/blog", async (context) => {
  try {
    const blogDir = `${Deno.cwd()}/content/blog`;
    const posts: any[] = [];

    for await (const entry of Deno.readDir(blogDir)) {
      if (entry.isFile && entry.name.endsWith('.md')) {
        const filePath = `${blogDir}/${entry.name}`;
        const fileContent = await Deno.readTextFile(filePath);
        const { data } = matter(fileContent);

        const slug = entry.name.replace('.md', '');

        posts.push({
          slug,
          title: data.title || 'Untitled',
          date: data.date || '',
          language: data.language || 'en',
          author: data.author,
          tags: data.tags || []
        });
      }
    }

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    context.response.body = { posts };
  } catch (error) {
    console.error("Blog listing error:", error);
    context.response.status = 500;
    context.response.body = { error: error instanceof Error ? error.message : "Failed to load blog posts" };
  }
});

router.get("/api/blog/:slug", async (context) => {
  try {
    const { slug } = context.params;
    const filePath = `${Deno.cwd()}/content/blog/${slug}.md`;

    try {
      const fileContent = await Deno.readTextFile(filePath);
      const { data, content } = matter(fileContent);

      context.response.body = {
        slug,
        title: data.title || 'Untitled',
        date: data.date || '',
        language: data.language || 'en',
        author: data.author,
        tags: data.tags || [],
        content
      };
    } catch (error) {
      console.error(`Failed to read blog post: ${filePath}`, error);
      context.response.status = 404;
      context.response.body = { error: "Blog post not found" };
    }
  } catch (error) {
    console.error("Blog post error:", error);
    context.response.status = 500;
    context.response.body = { error: error instanceof Error ? error.message : "Failed to load blog post" };
  }
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(routeStaticFilesFrom([
  `${Deno.cwd()}/dist`,
  `${Deno.cwd()}/public`,
]));

if (import.meta.main) {
  console.log("Server listening on port http://localhost:8000");
  await app.listen({ port: 8000 });
}