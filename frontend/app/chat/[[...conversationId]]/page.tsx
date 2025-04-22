"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { Toaster, toast } from "sonner"; // Import toast
import { RemoteRunnable } from "@langchain/core/runnables/remote";
import { useAuth } from "@clerk/nextjs";
import { v4 as uuidv4, v4, validate as validateUUID } from "uuid";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { SystemState, ZekherMessage } from "@/lib/types.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import Header from "@/components/header.tsx";
import ChatView from "@/components/chatView.tsx";
import BottomBar from "@/components/bottomBar.tsx";
import LoadingScreen, {
  LoadingScreenType,
} from "@/components/loadingScreen.tsx";

export default function Chat({
  params,
}: {
  params: { conversationId: string };
}) {
  const router = useRouter();
  const { userId, getToken } = useAuth();

  const { conversationId } = params;
  const searchParams = useSearchParams();
  const restore = searchParams.get("restore");

  if (
    params.conversationId === undefined ||
    !validateUUID(conversationId.toString())
  ) {
    router.push(`/chat/${uuidv4()}`);
  }

  const [messages, setMessages] = useState<ZekherMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      try {
        if (restore === "true") {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/chat_history?user_id=${userId}&conversation_id=${conversationId}`,
            { headers: { Authorization: `Bearer ${await getToken()}` } },
          );

          if (!res.ok) {
            throw new Error("Failed to fetch chat history");
          }

          const rawMessages = await res.json();

          const formattedMessages: ZekherMessage[] = rawMessages
            .map((messageString: string, index: number) => {
              const parsedMessage = JSON.parse(messageString);

              let role: ZekherMessage["role"];
              switch (parsedMessage.type) {
                case "ai":
                  role = "assistant";
                  break;
                case "human":
                  role = "user";
                  break;
                default:
                  role = "data";
              }

              return {
                id: `msg_${index}`,
                content: parsedMessage.data.content,
                role,
                createdAt: new Date(),
              };
            })
            .reverse();

          setMessages(formattedMessages);
        }
      } catch (error) {
        toast.error("Failed to fetch chat history", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        });
      }
    }

    fetchHistory();
  }, [conversationId, getToken, restore, userId]);

  const controller = new AbortController();

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const agent = new RemoteRunnable({
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/chat`,
        options: {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        },
      });

      const stream = agent.streamEvents(
        { input },
        {
          version: "v1",
          configurable: {
            conversationId: conversationId.toString(),
            userId,
          },
          signal: controller.signal,
        },
      );

      setMessages((prev) => [
        ...prev,
        {
          content: input,
          role: "user",
        } as ZekherMessage,
      ]);
      setInput("");

      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of stream) {
        const kind = chunk.event;

        if (chunk.data && chunk.tags && chunk.tags.length > 0) {
          if (chunk.name === "load_history") {
            if (kind === "on_chain_start") {
              setMessages((prev) => [
                ...prev,
                {
                  content: chunk.name,
                  role: "system",
                  status: SystemState.starting,
                  name: chunk.name,
                  runId: chunk.run_id,
                  id: v4(),
                },
              ]);
            } else if (kind === "on_chain_end") {
              setMessages((prev) =>
                prev.map((message) =>
                  message.runId === chunk.run_id
                    ? { ...message, status: SystemState.done }
                    : message,
                ),
              );
            } else if (kind === "on_chain_stream") {
              if (chunk.data.chunk) {
                setMessages((prev) =>
                  prev.map((message) =>
                    message.runId === chunk.run_id
                      ? {
                          ...message,
                          status: SystemState.running,
                        }
                      : message,
                  ),
                );
              }
            }
          }

          if (kind === "on_chat_model_stream") {
            if (
              chunk.data.chunk &&
              chunk.data.chunk.content &&
              chunk.data.chunk.content.length > 0
            ) {
              setIsLoading(false);

              setMessages((prev) => {
                const messageExists = prev.some(
                  (message) => message.runId === chunk.run_id,
                );

                if (!messageExists) {
                  return [
                    ...prev,
                    {
                      content: chunk.data.chunk.content,
                      role: "assistant",
                      runId: chunk.run_id,
                    } as ZekherMessage,
                  ];
                }
                return prev.map((message) =>
                  message.runId === chunk.run_id
                    ? {
                        ...message,
                        content: `${message.content}${chunk.data.chunk.content}`,
                      }
                    : message,
                );
              });
            }
          }
        } else if (kind === "on_tool_start") {
          setMessages((prev) => [
            ...prev,
            {
              content: chunk.name,
              name: chunk.name,
              role: "tool",
              runId: chunk.run_id,
            } as ZekherMessage,
          ]);
        } else if (kind === "on_tool_end") {
          setMessages((prev) =>
            prev.map((message) =>
              message.runId === chunk.run_id
                ? {
                    ...message,
                    status: SystemState.done,
                    toolOutput: chunk.data?.output,
                  }
                : message,
            ),
          );
        } else if (kind === "on_retriever_start") {
          setMessages((prev) =>
            prev.map((message) =>
              message.runId === chunk.run_id
                ? {
                    ...message,
                    status: SystemState.running,
                  }
                : message,
            ),
          );
        }
      }
    } catch (error) {
      toast.error("Failed to send message", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
      setIsLoading(false);
    }
  }

  const destroyChat = React.useCallback(() => {
    setMessages([]);
    router.push(`/${uuidv4()}`);
  }, [router]);

  function stop() {
    controller.abort();
    setIsLoading(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
  }

  return (
    <div
      className={`flex flex-col h-screen overscroll-none bg-cover ${messages.length === 0 ? "bg-[url('/emer.jpg')]" : "bg-white text-black"}`}
    >
      <Toaster richColors />
      <div className="sticky top-0 z-10">
        <Header isChat />
      </div>
      <div className="flex flex-grow flex-col items-center justify-center overscroll-none">
        {messages.length !== 0 ? (
          <div className="flex flex-grow flex-col items-center justify-center overscroll-none">
            {restore === "true" && (
              <Alert className="m-6 flex-none md:max-w-xl max-w-80 p-3">
                <CircleAlert className="h-4 w-4" />
                <AlertTitle>Welcome to your restored chat.</AlertTitle>
                <AlertDescription>
                  Feel free to continue the conversation. Please know that
                  sources do not persist across sessions. Use the refresh button
                  to draw from the same sources.
                </AlertDescription>
              </Alert>
            )}
            <ChatView messages={messages} />
          </div>
        ) : (
          <div>
            <LoadingScreen
              type={
                restore === "true"
                  ? LoadingScreenType.Restored
                  : LoadingScreenType.New
              }
            />
          </div>
        )}
      </div>
      <div className="sticky bottom-0 w-full">
        <BottomBar
          input={input}
          handleInputChange={(e) => handleInputChange(e)}
          handleSubmit={(e) => sendMessage(e)}
          isLoading={isLoading}
          isBorder
          messages={messages}
          destroyChat={destroyChat}
          stop={() => stop()}
          type={
            restore === "true"
              ? LoadingScreenType.Restored
              : LoadingScreenType.New
          }
        />
      </div>
    </div>
  );
}
