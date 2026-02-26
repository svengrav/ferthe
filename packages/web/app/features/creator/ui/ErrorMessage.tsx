interface ErrorMessageProps {
  error: string;
}

/** Inline error message for forms/panels */
export function ErrorMessage(props: ErrorMessageProps) {
  const { error } = props;
  if (!error) return null;
  return <p className="text-red-400 text-sm mt-2">{error}</p>;
}
