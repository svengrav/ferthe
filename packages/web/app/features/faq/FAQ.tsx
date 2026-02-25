import Page from "../../components/Page";
import { FAQContent } from "./FAQContent";
import { useFAQContent } from "./useFAQContent.ts";

export function FAQ() {
  const {
    loading,
    metadata,
    items,
  } = useFAQContent("de");

  return (
    <Page
      title="FAQ / Häufig gestellte Fragen"
      loading={loading}
      backButton={{ text: "← Back to Home", path: "/" }}
      className="p-4"
    >
      <div className="flex flex-col gap-12 max-w-6xl">
        {/* German FAQ */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {metadata?.title || "Häufig gestellte Fragen"}
          </h2>
          <FAQContent items={items} />
        </div>
      </div>
    </Page>
  );
}
