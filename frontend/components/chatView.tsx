import React from "react";
import { ZekherMessage } from "@/lib/types.ts";
import MessageBubble from "./messageBubble.tsx";

export default function ChatView({ messages }: { messages: ZekherMessage[] }) {
  return (
    <div className="flex flex-col flex-grow w-screen space-y-3 overflow-y-auto overscroll-none p-6 z-0">
      {messages
        .filter((m) => m.content !== "")
        .map((m) => MessageBubble({ message: m }))}
    </div>
  );
}
