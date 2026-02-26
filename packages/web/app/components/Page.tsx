import clsx from "clsx";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Footer } from "./Footer.tsx";
import { Heading } from "./Heading.tsx";
import { PageHeader } from "./PageHeader.tsx";

interface PageProps {
  title?: string;
  children: React.ReactNode;
  showFooter?: boolean;
  wide?: boolean;
  headerWide?: boolean;
  loading?: boolean;
  className?: string;
  backButton?: {
    text: string;
    path: string;
  };
}

function Page({
  headerWide,
  wide,
  title,
  children,
  loading = false,
  backButton,
  className,
}: PageProps) {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setFadeIn(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen">
  //       <Logo className="fill-white" width={100} height={100} />
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-1 justify-center">
      <div className="flex flex-col w-full flex-1">
        <PageHeader wide={headerWide} />
        <div
          className={clsx(
            `w-full mx-auto flex flex-col flex-1 `,
            !wide && "max-w-6xl p-4",
            className,
          )}
        >
          {backButton && (
            <Link
              to={backButton.path}
              className="font-medium py-4 inline-block"
            >
              {backButton.text}
            </Link>
          )}
          {title && <Heading>{title}</Heading>}

          <div
            className={`opacity-0 transition-opacity duration-1000 flex flex-1 flex-col ${
              fadeIn ? "opacity-100" : "opacity-0"
            }`}
          >
            {children}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Page;
