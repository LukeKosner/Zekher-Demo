import { SystemState, ZekherMessage } from "@/lib/types.ts";
import { ListStart, ListCheck, ListRestart } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import React from "react";
import { findSource, InterviewWithType } from "@/lib/sources.ts";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.tsx";

export default function MessageBubble({ message }: { message: ZekherMessage }) {
  function getData(): string {
    if (
      message.role === "tool" &&
      message.toolOutput &&
      message.name === "personal_testimony_retriever"
    ) {
      const { url } = findSource(
        message.toolOutput
          .split(" ")[7]
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ""),
      ) as InterviewWithType;

      return url;
    }
    return "";
  }

  if (message.role === "system" || message.role === "tool") {
    let description;
    let icon;
    let subtitle;
    let name;
    switch (message.name) {
      case "load_history":
        name = "Processing your query";
        subtitle = "Initializing the system.";
        break;
      case "personal_testimony_retriever":
        name = "Searching for personal testimonies";
        subtitle = !message.toolOutput
          ? "Using AI to find one survivor that connects to your question."
          : "Click here to see the primary source document.";
        break;
      case "short_answer_retriever":
        name = "Searching for short answers";
        subtitle = !message.toolOutput
          ? "Using AI to find multiple sources for your question."
          : "Used AI to find multiple sources for your question.";
        break;
      default:
        name = message.content;
        break;
    }
    switch (message.status) {
      case SystemState.running:
        icon = <ListRestart className="h-4 w-4" />;
        description = " is running.";
        break;
      case SystemState.done:
        icon = <ListCheck className="h-4 w-4" />;
        description = " is done.";
        break;
      default:
        icon = <ListStart className="h-4 w-4" />;
        description = " is starting.";
        break;
    }

    return (
      <Link
        href={getData()}
        className={
          !getData().startsWith("https://iit")
            ? "cursor-default"
            : "pointer-cursor"
        }
      >
        <Alert key={uuidv4()} className="justify-start max-w-xl">
          {icon}
          <AlertTitle>{name + description}</AlertTitle>
          <AlertDescription> {subtitle}</AlertDescription>
        </Alert>
      </Link>
    );
  }

  return (
    <div
      key={uuidv4()}
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`py-2 px-3 rounded-lg max-w-4xl ${
          message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200"
        }`}
      >
        <p>{message.content}</p>
      </div>
    </div>
  );
}
