import { ConfirmDialog } from "../components/ConfirmDialog.tsx";
import {
  closeOverlay,
  setOverlay,
} from "../components/overlay/useOverlayStore.ts";

const REMOVE_DIALOG_KEY = "remove-dialog";

/**
 * Hook to show a remove confirmation dialog via the overlay system.
 */
export function useRemoveDialog() {
  const openDialog = (options: {
    title?: string;
    message?: string;
    onConfirm: () => void;
  }) => {
    setOverlay(
      REMOVE_DIALOG_KEY,
      <ConfirmDialog
        title={options.title ?? "Remove"}
        message={options.message ?? "Are you sure you want to remove this?"}
        confirmLabel="Remove"
        onConfirm={() => {
          closeOverlay(REMOVE_DIALOG_KEY);
          options.onConfirm();
        }}
        onCancel={() => closeOverlay(REMOVE_DIALOG_KEY)}
      />,
      { showBackdrop: true, closeOnBackdropPress: true },
    );
  };

  return { openDialog };
}
