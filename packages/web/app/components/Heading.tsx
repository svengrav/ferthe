import clsx from "clsx";

interface HeadingProps {
  light?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Heading(
  { children, light = false, className = "" }: HeadingProps,
) {
  return (
    <div
      className={clsx(
        "mb-4 flex flex-col gap-6",
        `text-3xl font-semibold ${light ? "text-white" : "text-gray-900"}`,
        className,
      )}
    >
      <h2>
        {children}
      </h2>
      <div className={`w-10 h-1 ${light ? "bg-white" : "bg-gray-900"}`} />
    </div>
  );
}
