export function Footer() {
  return (
    <div className=" bg-gray-100">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 w-full text-center py-2">
          © {new Date().getFullYear()} Ferthe. All rights reserved.
        </p>
      </div>
    </div>
  );
}
