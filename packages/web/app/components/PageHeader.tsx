import { Logo } from "./Logo.tsx";
import { Navigation } from "./Navigation.tsx";

export function PageHeader() {
  return (
    <div className="flex items-center justify-center text-center mb-8 border-b border-gray-700 py-2 lg:py-6 px-4">
      <div className="flex items-center">
        <Logo
          className=" fill-white mr-1"
          width={35}
          height={35}
        />
        <h1 className="font-semibold text-white text-xl">ferthe</h1>
      </div>
      <div className="flex w-full justify-end">
        <Navigation />
      </div>
    </div>
  );
}
