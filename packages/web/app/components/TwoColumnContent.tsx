import Markdown from "./Markdown";

interface TwoColumnContentProps {
  germanContent: string;
  englishContent: string;
}

export function TwoColumnContent({
  germanContent,
  englishContent,
}: TwoColumnContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* German Column */}
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <h4 className="text-xl font-semibold">Deutsch</h4>
        </div>
        <div className="prose prose-lg max-w-none">
          <Markdown content={germanContent} />
        </div>
      </div>

      {/* English Column */}
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <h4 className="text-xl font-semibold opacity-60">English</h4>
        </div>
        <div className="prose prose-lg max-w-none opacity-60">
          <Markdown content={englishContent} />
        </div>
      </div>
    </div>
  );
}
