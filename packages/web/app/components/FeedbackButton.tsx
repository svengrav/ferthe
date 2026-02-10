import { ChatBubbleLeftIcon } from "@heroicons/react/24/solid";
import { useFeedback } from "../hooks/useFeedback";

export function FeedbackButton() {
  const { showFeedback } = useFeedback();

  return (
    <button
      type="button"
      onClick={showFeedback}
      className="fixed bottom-6 right-6 bg-primary text-onprimary rounded-4xl p-2"
      aria-label="Feedback senden"
      title="Feedback senden"
    >
      <ChatBubbleLeftIcon className="h-6" />
    </button>
  );
}
