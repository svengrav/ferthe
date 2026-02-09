import Markdown from "../components/Markdown";
import Page from "../components/Page";
import { useContent } from "../hooks/useContent";
import { useMarkdown } from "../hooks/useMarkdown";

export function Home() {
  const { content: germanContent, loading: loadingGerman } = useContent(
    "home",
    "de",
  );

  const germanHomeStory = useMarkdown(germanContent);

  return (
    <Page loading={loadingGerman}>
      <div>
        <Markdown content={germanHomeStory} />
      </div>
    </Page>
  );
}
