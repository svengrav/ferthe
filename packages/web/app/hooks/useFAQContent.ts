import { FAQItem } from "../components/FAQContent.tsx";
import { useContent } from "./useContent.ts";

export function parseFAQContent(content: string): FAQItem[] {
  return content
    .split(/\*\*Q:\s*/)
    .slice(1)
    .map((section) => {
      const [question, answer] = section.split(/\*\*\s*\nA:\s*|\*\*\s*A:\s*/);
      return {
        question: question?.trim() || "",
        answer: answer?.trim() || "",
      };
    })
    .filter((item) => item.question && item.answer);
}

export function useFAQContent(language: 'en' | 'de') {
  const data = useContent("faq", language);

  const items = parseFAQContent(data.content);
  return {
    ...data,
    items,
  };
}