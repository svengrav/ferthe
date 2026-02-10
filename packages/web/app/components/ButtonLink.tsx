import { Link } from "react-router-dom";

interface ButtonLinkProps {
  to: string;
  children: React.ReactNode;
}

export function ButtonLink({ to, children }: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className="hover:opacity-90 bg-white text-black font-semibold rounded-md py-1 px-2"
    >
      {children}
    </Link>
  );
}
