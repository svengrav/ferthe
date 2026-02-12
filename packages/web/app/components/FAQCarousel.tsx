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
    const containerWidth = scrollRef.current.offsetWidth;
    const gap = 16; // gap-4 = 16px

    // Calculate how many cards fit based on container width
    let cardsToShow = 1;
    if (containerWidth >= 1024) cardsToShow = 3; // lg breakpoint
    else if (containerWidth >= 768) cardsToShow = 2; // md breakpoint

    const scrollAmount = containerWidth / cardsToShow;
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
              className="shrink-0 w-full md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] min-w-[300px] max-w-[400px] p-4   "
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
