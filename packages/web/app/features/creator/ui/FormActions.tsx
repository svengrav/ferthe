interface FormActionsProps {
  loading?: boolean;
  onCancel: () => void;
}

/** Save/Cancel button pair for creator forms */
export function FormActions(props: FormActionsProps) {
  const { loading, onCancel } = props;

  return (
    <div className="flex gap-2">
      <button
        type="submit"
        disabled={loading}
        className="flex-1 px-4 py-2 bg-primary text-onprimary rounded hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-300"
      >
        Cancel
      </button>
    </div>
  );
}
