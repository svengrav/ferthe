import clsx from "clsx";

interface TagProps {
  children: React.ReactNode;
  light?: boolean;
}

export function Tag({ children, light = false }: TagProps) {
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium cursor-pointer",
        {
          "bg-gray-200 text-gray-800": light,
          "bg-white text-gray-200": !light,
        },
      )}
    >
      {children}
    </div>
  );
}
