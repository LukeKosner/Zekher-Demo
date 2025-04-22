import React from "react";

export default function Footer({ isChat }: { isChat: boolean }) {
  return (
    <div
      className={`relative w-full border px-4 py-3 text-sm md:text-md bg-white ${isChat ? "rounded-lg" : "rounded-0"}`}
    >
      <p>
        By using Zekher, you agree to our{" "}
        <a
          target="_blank"
          href="/terms"
          rel="noopener noreferrer"
          className="underline"
        >
          Terms of Service
        </a>
        .
        {isChat ? (
          <span>
            {" "}
            Information may be inaccurate or improperly attributed. Your chat
            history is recorded and hateful use is strictly prohibited.{" "}
          </span>
        ) : (
          <span />
        )}
      </p>
      <p>
        &copy; {new Date().getFullYear()} Luke Kosner. Made with ♥ in New York
        City, USA.
      </p>
    </div>
  );
}
