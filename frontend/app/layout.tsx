import { ClerkProvider } from "@clerk/nextjs";
import React from "react";
import "./globals.css";
import {
  // eslint-disable-next-line camelcase
  IBM_Plex_Sans,
  // eslint-disable-next-line camelcase
  IBM_Plex_Serif,
  // eslint-disable-next-line camelcase
  IBM_Plex_Mono,
  // eslint-disable-next-line camelcase
  IBM_Plex_Sans_Hebrew,
} from "next/font/google";
// eslint-disable-next-line import/no-extraneous-dependencies
import { auth, currentUser } from "@clerk/nextjs/server";
import posthog from "posthog-js";
import { toast, Toaster } from "sonner";
import PHProvider from "./providers";

export const metadata = {
  title: "Zekher",
  description: "Fighting Holocaust denial with the voices of survivors.",
};

const ibmPlexHebrew = IBM_Plex_Sans_Hebrew({
  variable: "--ibm-plex-hebrew",
  subsets: ["hebrew"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--ibm-plex-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--ibm-plex-mono",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--ibm-plex-serif",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const health = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/health`);
  if (!health.ok) {
    toast.error("Failed to connect to the server.");
  }
  // 👉 Add the hooks into the component
  const { userId } = auth();
  const user = await currentUser();

  // eslint-disable-next-line no-underscore-dangle
  if (user && userId && user && !posthog._isIdentified()) {
    posthog.identify(userId, {
      email: user.primaryEmailAddress?.emailAddress,
      username: user.username,
    });
  }

  return (
    <ClerkProvider
      appearance={{
        elements: {
          formFieldInput:
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm md:text-md shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm md:text-md file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          formFieldLabel:
            "text-sm md:text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          formButtonPrimary:
            "bg-primary text-primary-foreground shadow hover:bg-primary/90",
          socialButtonsBlockButton:
            "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
          headerTitle: "font-sans font-medium",
        },
      }}
    >
      <html lang="en">
        <PHProvider>
          <Toaster richColors />
          <body
            className={`${ibmPlexSans.variable} ${ibmPlexSerif.variable} ${ibmPlexMono.variable} ${ibmPlexHebrew.variable} font-sans flex flex-col min-h-screen overscroll-none`}
          >
            {children}
            <div
              className="cf-turnstile"
              data-sitekey="0x4AAAAAAAhXjQLsdbfwrcHW"
              data-callback="javascriptCallback"
            />
          </body>
        </PHProvider>
      </html>
    </ClerkProvider>
  );
}
