// deno-lint-ignore-file
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link } from "react-router-dom";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { to: "/", label: "Home" },
    { to: "/blog", label: "Blog" },
    { to: "/privacy", label: "Privacy" },
  ];

  return (
    <div className="flex justify-end">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-primary hover:text-indigo-500"
        aria-label="Toggle menu"
      >
        {isOpen
          ? <XMarkIcon className="w-6 h-6" />
          : <Bars3Icon className="w-6 h-6" />}
      </button>

      <div className="hidden md:flex gap-4 text-primary items-center">
        {links.map((link, i) => [
          i > 0 && <span key={`sep-${i}`} className="text-gray-400">·</span>,
          <Link
            key={link.to}
            to={link.to}
            className="hover:text-indigo-500 font-medium"
          >
            {link.label}
          </Link>,
        ])}
      </div>

      {isOpen && (
        <div className="md:hidden absolute top-16 right-4 bg-surface border border-gray-700 rounded-lg shadow-lg p-4 flex flex-col gap-3 z-99">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className="text-primary hover:text-blue-300 font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
