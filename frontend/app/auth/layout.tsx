import Footer from "@/components/footer.tsx";
import Header from "@/components/header.tsx";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-grow flex-col bg-[url('/dome.jpg')]">
      <Header isChat={false} />
      <main className="flex flex-grow flex-col items-center justify-center">
        {children}
      </main>
      <Footer isChat={false} />
    </div>
  );
}
