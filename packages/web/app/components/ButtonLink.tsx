import { Link } from "react-router-dom";

interface ButtonLinkProps {
  to: string;
  children: React.ReactNode;
}

export function ButtonLink({ to, children }: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className="hover:underline bg-white text-black rounded-md py-1 px-2"
    >
      {children}
    </Link>
  );
}
