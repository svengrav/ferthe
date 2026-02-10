import { FeedbackForm } from "../components/FeedbackForm";
import {
  closeOverlay,
  setOverlay,
} from "../components/overlay/useOverlayStore";

const FEEDBACK_KEY = "feedback";

export function useFeedback() {
  const showFeedback = () => {
    setOverlay(
      FEEDBACK_KEY,
      <FeedbackForm onClose={() => closeOverlay(FEEDBACK_KEY)} />,
      {
        showBackdrop: true,
        closeOnBackdropPress: true,
      },
    );
  };

  const closeFeedback = () => {
    closeOverlay(FEEDBACK_KEY);
  };

  return {
    showFeedback,
    closeFeedback,
  };
}
