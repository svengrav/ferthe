import { Link } from "react-router-dom";

interface PageProps {
  title?: string;
  children: React.ReactNode;
}

function Page({ title, children }: PageProps) {
  return (
    <div>
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-950 rounded-lg p-8 border border-gray-700 shadow-lg text-white">
            {/* Header */}
            {title && (
              <h1 className="text-3xl font-semibold mb-6 text-white">
                {title}
              </h1>
            )}

            {/* Content */}
            <div className="prose prose-lg prose-invert max-w-none">
              {children}
            </div>
          </div>
          <footer className="mt-8 text-sm text-gray-500 text-center space-x-4">
            <Link to="/" className="hover:text-gray-300 transition-colors">
              Home
            </Link>
            <span>·</span>
            <Link to="/blog" className="hover:text-gray-300 transition-colors">
              Blog
            </Link>
            <span>·</span>
            <Link
              to="/privacy"
              className="hover:text-gray-300 transition-colors"
            >
              Privacy
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Page;
