interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal confirmation dialog with confirm/cancel actions.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const {
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
  } = props;

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {message && <p className="text-gray-500 text-sm mb-6">{message}</p>}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 text-sm rounded bg-danger text-white hover:bg-danger/90"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
