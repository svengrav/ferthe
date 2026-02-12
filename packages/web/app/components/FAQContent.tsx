import { useState } from "react";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQContentProps {
  items: FAQItem[];
}

export function FAQContent({ items }: FAQContentProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3 max-w-2xl">
      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-lg overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="cursor-pointer w-full px-6 py-4 text-left font-medium bg-gray-100 hover:bg-gray-200 transition-colors flex justify-between items-center"
          >
            <span>{item.question}</span>
            <span className="text-lg">{openIndex === index ? "−" : "+"}</span>
          </button>
          {openIndex === index && (
            <div className="px-6 py-4 bg-white text-gray-700">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
