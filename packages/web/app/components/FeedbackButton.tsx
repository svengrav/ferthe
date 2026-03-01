import { ChatBubbleLeftIcon } from "@heroicons/react/24/solid";
import { useFeedback } from "../hooks/useFeedback";

interface FeedbackButtonProps {
  light?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FeedbackButton({ className, children }: FeedbackButtonProps) {
  const { showFeedback } = useFeedback();

  return (
    <button
      type="button"
      onClick={showFeedback}
      className={`flex w-min whitespace-nowrap gap-2 bg-pink-500 text-light font-semibold cursor-pointer hover:bg-pink-600 rounded-4xl p-2 ${className}`}
      aria-label="Feedback senden"
      title="Feedback senden"
    >
      <ChatBubbleLeftIcon className="h-6" />
      {children}
    </button>
  );
}
