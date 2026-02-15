import clsx from "clsx";
import { Link } from "react-router-dom";

interface ButtonLinkProps {
  className?: string;
  to: string;
  children: React.ReactNode;
  target?: React.HTMLAttributeAnchorTarget | undefined;
}

export function ButtonLink(
  { to, children, target, className }: ButtonLinkProps,
) {
  return (
    <Link
      to={to}
      target={target}
      rel="noopener noreferrer"
      className={clsx(
        "flex",
        "justify-center items-center",
        "w-min",
        "hover:opacity-90 bg-white text-black font-semibold rounded-md py-1 px-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}
