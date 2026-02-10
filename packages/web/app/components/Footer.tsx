export function Footer() {
  return (
    <div className="pt-4 bg-gray-300">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 w-full text-center py-4">
          © {new Date().getFullYear()} Ferthe. All rights reserved.
        </p>
      </div>
    </div>
  );
}
