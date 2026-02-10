interface HeadingProps {
  children: React.ReactNode;
}

export function Heading({ children }: HeadingProps) {
  return (
    <div className="mb-4 flex flex-col gap-6">
      <h2 className="text-3xl font-bold">{children}</h2>
      <div className="w-10 bg-white h-1" />
    </div>
  );
}
