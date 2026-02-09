import { Link } from "react-router-dom";

export function Navigation() {
  return (
    <div className="flex  justify-end w-full py-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-emerald-400">
          <Link
            to="/"
            className=" hover:text-blue-300 font-medium"
          >
            Home
          </Link>
          <span className="text-gray-600">·</span>
          <Link
            to="/blog"
            className=" hover:text-blue-300 font-medium"
          >
            Blog
          </Link>
          <span className="text-gray-600">·</span>
          <Link
            to="/privacy"
            className=" hover:text-blue-300 font-medium"
          >
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
