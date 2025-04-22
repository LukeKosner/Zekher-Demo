import React from "react";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center m-6">
      <SignIn />
    </div>
  );
}
