export function Footer() {
  return (
    <div className="mt-12 pt-8">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-400 w-full text-center">
          © {new Date().getFullYear()} Ferthe. All rights reserved.
        </p>
      </div>
    </div>
  );
}
