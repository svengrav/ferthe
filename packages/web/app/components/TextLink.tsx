import { Link } from "react-router-dom";

interface TextLinkProps {
  to: string;
  children: React.ReactNode;
}

export function TextLink({ to, children }: TextLinkProps) {
  return (
    <Link to={to} className="hover:underline">
      {children}
    </Link>
  );
}
