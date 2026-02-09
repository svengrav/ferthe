import { Logo } from "./Logo.tsx";
import { Navigation } from "./Navigation.tsx";

export function PageHeader() {
  return (
    <div className="flex-col items-center justify-center align-middle text-center mb-8 rounded-md border-b border-gray-700">
      <Logo
        className="flex justify-center mx-auto fill-white w-3xs"
        height={100}
      />
      <h1 className="font-semibold text-white mb-4 text-lg">ferthe</h1>
      <div className="flex justify-center w-full ">
        <Navigation />
      </div>
    </div>
  );
}
