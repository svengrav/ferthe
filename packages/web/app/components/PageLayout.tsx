import { Link } from "react-router-dom";
import { useMarkdown } from "../hooks/useMarkdown";
import Markdown from "./Markdown";

interface PageLayoutProps {
  title: string;
  germanContent: string;
  englishContent: string;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonPath?: string;
}

export function PageLayout({
  title,
  germanContent,
  englishContent,
  showBackButton = true,
  backButtonText = "← Back to Home",
  backButtonPath = "/",
}: PageLayoutProps) {
  const processedGermanContent = useMarkdown(germanContent);
  const processedEnglishContent = useMarkdown(englishContent);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-950 rounded-lg p-8 border border-gray-700 shadow-lg text-white">
          {/* Header */}
          <div className="mb-8">
            {showBackButton && (
              <Link
                to={backButtonPath}
                className="text-blue-500 hover:text-blue-300 font-medium mb-4 inline-block"
              >
                {backButtonText}
              </Link>
            )}
            <h1 className="text-3xl font-semibold mb-2 text-white">{title}</h1>
            <div className="w-16 h-1 bg-blue-500 mb-6 mt-6"></div>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* German Column */}
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <h4 className="text-xl font-semibold text-white">Deutsch</h4>
              </div>
              <div className="prose prose-lg prose-invert max-w-none">
                <Markdown content={processedGermanContent} />
              </div>
            </div>

            {/* English Column */}
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <h4 className="text-xl font-semibold text-white opacity-60">
                  English
                </h4>
              </div>
              <div className="prose prose-lg prose-invert max-w-none opacity-60">
                <Markdown content={processedEnglishContent} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-600">
            <div className="flex justify-between items-center">
              {showBackButton && (
                <Link
                  to={backButtonPath}
                  className="text-blue-500 hover:text-blue-300 font-medium"
                >
                  {backButtonText}
                </Link>
              )}
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} Ferthe. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
