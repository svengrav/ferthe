import { useLocalization } from '../localization'
import { closeOverlay, setOverlay } from '../overlay'
import FeedbackPage from './FeedbackPage'

const FEEDBACK_KEY = 'feedback'

export function useFeedbackPage() {
  const { locales } = useLocalization()

  const showFeedback = () =>
    setOverlay(
      FEEDBACK_KEY,
      <FeedbackPage onClose={() => closeOverlay(FEEDBACK_KEY)} />,
      { showBackdrop: true, closeOnBackdropPress: true },
    )

  const closeFeedback = () => closeOverlay(FEEDBACK_KEY)

  return { showFeedback, closeFeedback, label: locales.feedback.title }
}
