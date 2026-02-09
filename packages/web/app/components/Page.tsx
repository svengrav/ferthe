import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Footer } from "./Footer.tsx";
import { Logo } from "./Logo.tsx";
import { PageHeader } from "./PageHeader.tsx";

interface PageProps {
  title?: string;
  children: React.ReactNode;
  showFooter?: boolean;
  loading?: boolean;
  backButton?: {
    text: string;
    path: string;
  };
}

function Page({
  title,
  children,
  loading = false,
  backButton,
}: PageProps) {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setFadeIn(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Logo className="fill-white" width={100} height={100} />
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className=" w-full max-w-4xl">
        <div className="rounded-lg p-8">
          <PageHeader />

          {backButton && (
            <Link
              to={backButton.path}
              className="font-medium mb-6 inline-block"
            >
              {backButton.text}
            </Link>
          )}

          {title && (
            <div className="mb-8">
              <h1 className="text-3xl font-semibold mb-2">{title}</h1>
              <div className="w-16 h-1 bg-emerald-500 mb-6 mt-6"></div>
            </div>
          )}

          <div
            className={`opacity-0 transition-opacity duration-1000 ${
              fadeIn ? "opacity-100" : "opacity-0"
            }`}
          >
            {children}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Page;
