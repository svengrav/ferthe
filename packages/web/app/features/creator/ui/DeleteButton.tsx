interface DeleteButtonProps {
  onClick: () => void;
  label?: string;
}

/** Full-width danger button for delete actions */
export function DeleteButton(props: DeleteButtonProps) {
  const { onClick, label = "Delete" } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full mt-4 px-4 py-2 bg-danger rounded hover:bg-danger/90 text-white"
    >
      {label}
    </button>
  );
}
