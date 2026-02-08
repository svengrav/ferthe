import { useEffect, useState } from "react";
import Markdown from "../components/Markdown";
import Page from "../components/Page";
import { useContent } from "../hooks/useContent";
import { useMarkdown } from "../hooks/useMarkdown";

export function Home() {
  const [fadeIn, setFadeIn] = useState(false);
  const { content: germanContent, loading: loadingGerman } = useContent(
    "home",
    "de",
  );
  const { content: englishContent, loading: loadingEnglish } = useContent(
    "home",
    "en",
  );

  const germanHomeStory = useMarkdown(germanContent);
  const englishHomeStory = useMarkdown(englishContent);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (loadingGerman || loadingEnglish) {
    return (
      <div className="bg-gray-950 flex flex-grow items-center justify-center p-8">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 flex flex-grow items-center justify-center p-8">
      <div
        className={`opacity-0 transition-opacity duration-1000 ${
          fadeIn ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">Ferthe</h1>
        </div>
        <Page>
          <div className="lg:grid-cols-2 grid gap-8">
            <div>
              <Markdown content={germanHomeStory} />
            </div>
            <div className="opacity-60">
              <Markdown content={englishHomeStory} />
            </div>
          </div>
        </Page>
      </div>
    </div>
  );
}
