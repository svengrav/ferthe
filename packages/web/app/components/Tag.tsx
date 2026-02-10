export function Tag(
  { children, light = false }: { children: React.ReactNode; light?: boolean },
) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium ${
        light ? "bg-gray-200 text-gray-800" : "bg-gray-800 text-gray-200"
      }`}
    >
      {children}
    </div>
  );
}
