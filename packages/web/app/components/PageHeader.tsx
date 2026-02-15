import { Link } from "react-router-dom";
import { Logo } from "./Logo.tsx";
import { Navigation } from "./Navigation.tsx";

export function PageHeader() {
  return (
    <div className="flex items-center justify-center bg-surface text-center border-b border-b-surface-divider py-2 lg:py-6 px-4 ">
      <div className="flex items-center w-full  max-w-6xl mx-auto">
        <Link
          key="home"
          to="/"
          className="flex gap-2 justify-center items-center"
        >
          <Logo
            className=" fill-white mr-1 cursor-pointer"
            width={35}
            height={35}
          />
          <h1 className="font-semibold text-white text-xl cursor-pointer">
            ferthe
          </h1>
        </Link>

        <div className="flex w-full justify-end">
          <Navigation />
        </div>
      </div>
    </div>
  );
}
