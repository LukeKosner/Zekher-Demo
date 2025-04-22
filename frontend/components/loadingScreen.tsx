import React from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";

// eslint-disable-next-line no-shadow
export enum LoadingScreenType {
  New = "new",
  Restored = "restored",
  Shared = "shared",
}
export default function LoadingScreen({ type }: { type: LoadingScreenType }) {
  if (type === LoadingScreenType.New) {
    return (
      <div className="relative flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl p-8 text-center text-white font-serif z-10 relative">
          Ask anything about the Holocaust and receive answers from firsthand
          testimonies collected by{" "}
          <Link
            className="underline decoration-dotted"
            href="https://voices.library.iit.edu/"
          >
            <span>Dr. David P. Boder</span>
          </Link>
          .
        </h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <LoaderCircle className="w-8 h-8 animate-spin" />
    </div>
  );
}
