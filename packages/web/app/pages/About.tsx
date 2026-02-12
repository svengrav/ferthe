import Markdown from "../components/Markdown";
import Page from "../components/Page";
import { useContent } from "../hooks/useContent";
import { useMarkdown } from "../hooks/useMarkdown";

export function About() {
  const { content, loading, metadata } = useContent(
    "home",
    "de",
  );

  const markdownContent = useMarkdown(content);

  return (
    <Page
      title={metadata?.title}
      loading={loading}
      backButton={{ text: "← Back to Home", path: "/" }}
      className="p-4"
    >
      <Markdown content={markdownContent} className="max-w-2xl" />
    </Page>
  );
}
