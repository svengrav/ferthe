import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useRef } from "react";
import { useFAQContent } from "../hooks/useFAQContent";

interface FAQCarouselProps {
  language: "en" | "de";
}

export function FAQCarousel({ language }: FAQCarouselProps) {
  const { items } = useFAQContent(language);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!items.length) return null;

  return (
    <div>
      <div className="relative flex">
        <button
          onClick={() => scroll("left")}
          className=" rounded-full p-2  hover:bg-gray-100 z-10 cursor-pointer"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-hidden scroll-smooth"
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-80 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {item.question}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-3">
                {item.answer}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="rounded-full p-2  hover:bg-gray-100 z-10 cursor-pointer"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
