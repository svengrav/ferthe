import Markdown from "../components/Markdown";
import Page from "../components/Page";
import { useContent } from "../hooks/useContent";
import { useMarkdown } from "../hooks/useMarkdown";

export function About() {
  const { content: germanContent, loading: loadingGerman } = useContent(
    "home",
    "de",
  );

  const germanHomeStory = useMarkdown(germanContent);

  return (
    <Page
      title="About Ferthe"
      loading={loadingGerman}
      backButton={{ text: "← Back to Home", path: "/" }}
    >
      <Markdown content={germanHomeStory} />
    </Page>
  );
}
