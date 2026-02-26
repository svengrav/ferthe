interface PanelHeaderProps {
  title: string;
  onClose: () => void;
}

/** Header row with title and close button for editor panels */
export function PanelHeader(props: PanelHeaderProps) {
  const { title, onClose } = props;

  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      <button
        type="button"
        onClick={onClose}
        className="text-gray-400 hover:text-primary"
      >
        ✕
      </button>
    </div>
  );
}
