import { Application, Router } from "@oak/oak";
import { load } from "@std/dotenv";
import * as path from "@std/path";
import { oakCors } from "@tajpouria/cors";
import { parseMarkdown } from "./services/markdown.ts";
import routeStaticFilesFrom from "./static/static.ts";

// Load environment variables
await load({ export: true });

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FEEDBACK_EMAIL = Deno.env.get("FEEDBACK_EMAIL") || "feedback@ferthe.de";
const CORE_API_URL = Deno.env.get("CORE_API_URL") || "http://localhost:7000";

export const app = new Application();
const router = new Router();

// Unified Language-First API Routes
router.get("/api/:language/content/:page", async (context) => {
  try {
    const { language, page } = context.params;

    if (language !== 'en' && language !== 'de') {
      context.response.status = 400;
      context.response.body = { error: "Invalid language. Use 'en' or 'de'" };
      return;
    }

    const contentDir = path.resolve(`${Deno.cwd()}/content`);
    const filePath = path.resolve(`${contentDir}/${language}/${page}.md`);

    // Security: Prevent path traversal attacks
    if (!filePath.startsWith(contentDir)) {
      context.response.status = 403;
      context.response.body = { error: "Access denied" };
      return;
    }

    try {
      const fileContent = await Deno.readTextFile(filePath);
      const { metadata, content } = parseMarkdown(fileContent);

      // Validate language match
      if (metadata.language && metadata.language !== language) {
        context.response.status = 404;
        context.response.body = { error: "Content not found for this language" };
        return;
      }

      context.response.body = {
        page,
        title: metadata.title || 'Untitled',
        date: metadata.date || '',
        language: metadata.language || language,
        author: metadata.author,
        tags: metadata.tags || [],
        summary: metadata.summary,
        heroImage: metadata.heroImage,
        content,
      };
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

router.get("/api/:language/blog", async (context) => {
  try {
    const { language } = context.params;

    if (language !== 'en' && language !== 'de') {
      context.response.status = 400;
      context.response.body = { error: "Invalid language. Use 'en' or 'de'" };
      return;
    }

    const blogDir = `${Deno.cwd()}/content/blog`;
    const posts: any[] = [];

    for await (const entry of Deno.readDir(blogDir)) {
      if (entry.isFile && entry.name.endsWith('.md')) {
        const filePath = `${blogDir}/${entry.name}`;
        const fileContent = await Deno.readTextFile(filePath);
        const { metadata, content } = parseMarkdown(fileContent);

        // Filter by language
        if (metadata.language === language) {
          const slug = entry.name.replace('.md', '');

          // Create preview - remove markdown syntax
          let preview = content
            .replace(/^#+\s+/gm, '') // Remove headers
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
            .replace(/\*([^*]+)\*/g, '$1') // Remove italic
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
            .replace(/`([^`]+)`/g, '$1') // Remove inline code
            .replace(/^[-*+]\s+/gm, '') // Remove list markers
            .replace(/^\d+\.\s+/gm, '') // Remove numbered list markers
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .trim();

          preview = preview.slice(0, 200).trim() + (preview.length > 200 ? '...' : '');

          posts.push({
            slug,
            url: `/api/${language}/blog/${slug}`,
            title: metadata.title || 'Untitled',
            date: metadata.date || '',
            language: metadata.language,
            author: metadata.author,
            tags: metadata.tags || [],
            heroImage: metadata.heroImage,
            preview
          });
        }
      }
    }

    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    context.response.body = { posts };
  } catch (error) {
    console.error("Blog listing error:", error);
    context.response.status = 500;
    context.response.body = { error: error instanceof Error ? error.message : "Failed to load blog posts" };
  }
});

router.get("/api/:language/blog/:slug", async (context) => {
  try {
    const { language, slug } = context.params;

    if (language !== 'en' && language !== 'de') {
      context.response.status = 400;
      context.response.body = { error: "Invalid language. Use 'en' or 'de'" };
      return;
    }

    const filePath = `${Deno.cwd()}/content/blog/${slug}.md`;

    try {
      const fileContent = await Deno.readTextFile(filePath);
      const { metadata, content } = parseMarkdown(fileContent);

      // Validate language match
      if (metadata.language !== language) {
        context.response.status = 404;
        context.response.body = { error: "Blog post not found for this language" };
        return;
      }

      context.response.body = {
        slug,
        title: metadata.title || 'Untitled',
        date: metadata.date || '',
        language: metadata.language,
        author: metadata.author,
        tags: metadata.tags || [],
        heroImage: metadata.heroImage,
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

router.get("/blog/images/:filename", async (context) => {
  try {
    const { filename } = context.params;
    const filePath = `${Deno.cwd()}/content/blog/images/${filename}`;

    try {
      const file = await Deno.readFile(filePath);
      const ext = filename.split('.').pop()?.toLowerCase();

      const contentTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'webp': 'image/webp',
      };

      context.response.headers.set("Content-Type", contentTypes[ext || ''] || 'application/octet-stream');
      context.response.body = file;
    } catch (error) {
      console.error(`Failed to read image: ${filePath}`, error);
      context.response.status = 404;
      context.response.body = { error: "Image not found" };
    }
  } catch (error) {
    console.error("Blog image error:", error);
    context.response.status = 500;
    context.response.body = { error: error instanceof Error ? error.message : "Failed to load image" };
  }
});

router.post("/api/feedback", async (context) => {
  try {
    const body = await context.request.body.json();
    const { name, email, type, message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      context.response.status = 400;
      context.response.body = { error: "Message is required" };
      return;
    }

    const feedback = {
      timestamp: new Date().toISOString(),
      name: name || "Anonymous",
      email: email || "Not provided",
      type: type || "other",
      message: message.trim(),
    };

    // Log feedback to console
    console.log("\n=== NEW FEEDBACK ===");
    console.log(JSON.stringify(feedback, null, 2));
    console.log("===================\n");

    // Save to file
    try {
      const feedbackLog = `${Deno.cwd()}/feedback.jsonl`;
      await Deno.writeTextFile(feedbackLog, JSON.stringify(feedback) + "\n", { append: true });
    } catch (error) {
      console.error("Failed to save feedback to file:", error);
    }

    // Send email via Resend
    if (RESEND_API_KEY) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "feedback@ferthe.de",
            to: FEEDBACK_EMAIL,
            subject: `Feedback: ${feedback.type}`,
            html: `
              <h2>Neues Feedback erhalten</h2>
              <p><strong>Zeit:</strong> ${new Date(feedback.timestamp).toLocaleString('de-DE')}</p>
              <p><strong>Von:</strong> ${feedback.name}</p>
              <p><strong>E-Mail:</strong> ${feedback.email}</p>
              <p><strong>Typ:</strong> ${feedback.type}</p>
              <hr>
              <p><strong>Nachricht:</strong></p>
              <p>${feedback.message.replace(/\n/g, '<br>')}</p>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error("Failed to send email via Resend:", errorText);
        } else {
          console.log("Feedback email sent successfully");
        }
      } catch (error) {
        console.error("Error sending email:", error);
      }
    } else {
      console.warn("RESEND_API_KEY not configured - email not sent");
    }

    context.response.status = 200;
    context.response.body = { success: true };
  } catch (error) {
    console.error("Feedback submission error:", error);
    context.response.status = 500;
    context.response.body = { error: "Failed to submit feedback" };
  }
});

router.post("/api/admin/dev-login", async (context) => {
  try {
    const body = await context.request.body.json();
    const { accountId } = body;

    if (!accountId) {
      context.response.status = 400;
      context.response.body = { error: "accountId is required" };
      return;
    }

    // Create a session with Core API
    const response = await fetch(`${CORE_API_URL}/core/api/v1/account/dev-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountId }),
    });

    if (!response.ok) {
      context.response.status = response.status;
      context.response.body = await response.json();
      return;
    }

    const sessionData = await response.json();
    context.response.status = 200;
    context.response.body = sessionData;
  } catch (error) {
    console.error("Dev login error:", error);
    context.response.status = 500;
    context.response.body = { error: "Login failed" };
  }
});

// Admin API Routes (proxy to Core API with authentication)
const adminRouter = new Router({ prefix: "/admin/api" });

// NO auth middleware - Core API handles authentication

// Proxy GET requests to Core API
adminRouter.get("/:endpoint(.*)", async (context) => {
  try {
    const endpoint = context.params.endpoint;
    const url = new URL(context.request.url);
    const queryString = url.search;

    const coreUrl = `${CORE_API_URL}/core/api/${endpoint}${queryString}`;

    const response = await fetch(coreUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": context.request.headers.get("Authorization") || "",
      },
    });

    context.response.status = response.status;
    context.response.body = await response.json();
  } catch (error) {
    console.error("Admin API proxy error:", error);
    context.response.status = 500;
    context.response.body = { error: "Failed to proxy request to Core API" };
  }
});

// Proxy POST requests to Core API
adminRouter.post("/:endpoint(.*)", async (context) => {
  try {
    const endpoint = context.params.endpoint;
    const body = await context.request.body.json();

    const coreUrl = `${CORE_API_URL}/core/api/${endpoint}`;

    const response = await fetch(coreUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": context.request.headers.get("Authorization") || "",
      },
      body: JSON.stringify(body),
    });

    context.response.status = response.status;
    context.response.body = await response.json();
  } catch (error) {
    console.error("Admin API proxy error:", error);
    context.response.status = 500;
    context.response.body = { error: "Failed to proxy request to Core API" };
  }
});

// Proxy PUT requests to Core API
adminRouter.put("/:endpoint(.*)", async (context) => {
  try {
    const endpoint = context.params.endpoint;
    const body = await context.request.body.json();

    const coreUrl = `${CORE_API_URL}/core/api/${endpoint}`;

    const response = await fetch(coreUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": context.request.headers.get("Authorization") || "",
      },
      body: JSON.stringify(body),
    });

    context.response.status = response.status;
    context.response.body = await response.json();
  } catch (error) {
    console.error("Admin API proxy error:", error);
    context.response.status = 500;
    context.response.body = { error: "Failed to proxy request to Core API" };
  }
});

// Proxy DELETE requests to Core API
adminRouter.delete("/:endpoint(.*)", async (context) => {
  try {
    const endpoint = context.params.endpoint;

    const coreUrl = `${CORE_API_URL}/core/api/${endpoint}`;

    const response = await fetch(coreUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": context.request.headers.get("Authorization") || "",
      },
    });

    context.response.status = response.status;
    context.response.body = await response.json();
  } catch (error) {
    console.error("Admin API proxy error:", error);
    context.response.status = 500;
    context.response.body = { error: "Failed to proxy request to Core API" };
  }
});

app.use(oakCors());
app.use(adminRouter.routes());
app.use(adminRouter.allowedMethods());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(routeStaticFilesFrom([
  `${Deno.cwd()}/dist`,
  `${Deno.cwd()}/public`,
]));

if (import.meta.main) {
  console.log("Server listening on port http://localhost:7001");
  await app.listen({ port: 7001 });
}