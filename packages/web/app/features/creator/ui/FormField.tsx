import { LABEL_CLASS, LABEL_SM_CLASS } from "./formStyles.ts";

interface FormFieldProps {
  label: string;
  /** Use small/muted label style (e.g. for sub-fields) */
  small?: boolean;
  children: React.ReactNode;
}

/** Wraps a form control with a consistent label */
export function FormField(props: FormFieldProps) {
  const { label, small, children } = props;

  return (
    <div>
      <label className={small ? LABEL_SM_CLASS : LABEL_CLASS}>{label}</label>
      {children}
    </div>
  );
}
