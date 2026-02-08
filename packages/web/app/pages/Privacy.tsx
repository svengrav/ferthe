import { PageLayout } from "../components/PageLayout";
import { useContent } from "../hooks/useContent";

export function Privacy() {
  const { content: germanContent, loading: loadingGerman } = useContent(
    "privacy",
    "de",
  );
  const { content: englishContent, loading: loadingEnglish } = useContent(
    "privacy",
    "en",
  );

  if (loadingGerman || loadingEnglish) {
    return (
      <div className="bg-gray-950 flex flex-grow items-center justify-center p-8">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Privacy Policy / Datenschutzerklärung"
      germanContent={germanContent}
      englishContent={englishContent}
      backButtonText="← Back to Home"
      backButtonPath="/"
    />
  );
}
