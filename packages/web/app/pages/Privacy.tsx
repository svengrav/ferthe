import Page from "../components/Page";
import { TwoColumnContent } from "../components/TwoColumnContent";
import { useContent } from "../hooks/useContent";
import { useMarkdown } from "../hooks/useMarkdown";

export function Privacy() {
  const { content: germanContent, loading: loadingGerman } = useContent(
    "privacy",
    "de",
  );
  const { content: englishContent, loading: loadingEnglish } = useContent(
    "privacy",
    "en",
  );

  const processedGermanContent = useMarkdown(germanContent);
  const processedEnglishContent = useMarkdown(englishContent);
  const loading = loadingGerman || loadingEnglish;

  return (
    <Page
      title="Privacy Policy / Datenschutzerklärung"
      loading={loading}
      backButton={{ text: "← Back to Home", path: "/" }}
    >
      <TwoColumnContent
        germanContent={processedGermanContent}
        englishContent={processedEnglishContent}
      />
    </Page>
  );
}
