import { Link } from "react-router-dom";

export function Navigation() {
  return (
    <div className="flex justify-center w-full py-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Link
            to="/"
            className="text-emerald-500 hover:text-blue-300 font-medium"
          >
            Home
          </Link>
          <span className="text-gray-600">·</span>
          <Link
            to="/blog"
            className="text-emerald-500 hover:text-blue-300 font-medium"
          >
            Blog
          </Link>
          <span className="text-gray-600">·</span>
          <Link
            to="/privacy"
            className="text-emerald-500 hover:text-blue-300 font-medium"
          >
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
