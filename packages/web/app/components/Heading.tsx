interface HeadingProps {
  light?: boolean;
  children: React.ReactNode;
}

export function Heading({ children, light = false }: HeadingProps) {
  return (
    <div className="mb-4 flex flex-col gap-6">
      <h2
        className={`text-3xl font-bold ${
          light ? "text-white" : "text-gray-900"
        }`}
      >
        {children}
      </h2>
      <div className={`w-10 h-1 ${light ? "bg-white" : "bg-gray-900"}`} />
    </div>
  );
}
