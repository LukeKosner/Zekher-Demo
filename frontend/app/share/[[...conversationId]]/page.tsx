"use server";

import React from "react";
import ChatView from "@/components/chatView.tsx";
import { toast, Toaster } from "sonner";
import Header from "@/components/header.tsx";
import { auth } from "@clerk/nextjs/server";
import { ZekherMessage } from "@/lib/types.ts";
import LoadingScreen, {
  LoadingScreenType,
} from "@/components/loadingScreen.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { Hand } from "lucide-react";
import Footer from "@/components/footer.tsx";
import { Button } from "@/components/ui/button.tsx";
import Link from "next/link";

export default async function Chat({
  params,
}: {
  params: { conversationId: string };
}) {
  const { getToken } = auth();
  const { conversationId } = params;

  try {
    const publicRequest = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/share/get_public?conversation_id=${conversationId}`,
      { headers: { Authorization: `Bearer ${await getToken()}` } },
    );

    if (!publicRequest.ok) {
      throw new Error("Failed to fetch public chat status");
    }

    const publicResponse = await publicRequest.json();

    if (publicResponse.public === false) {
      return (
        <div className="flex flex-col h-screen overscroll-none">
          <Toaster richColors />
          <div className="sticky top-0 z-10">
            <Header isChat />
          </div>
          <div className="flex flex-grow flex-col items-center justify-center overscroll-none">
            <Alert className="m-6 flex-none max-w-xl">
              <Hand className="h-4 w-4" />
              <AlertTitle>Chat not found.</AlertTitle>
              <AlertDescription>
                The chat you are looking for does not exist. Please check the
                URL and try again.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    const userId = publicResponse.user_id;

    const rawMessageRequests = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/share/get_history?user_id=${userId}&conversation_id=${conversationId}`,
      { headers: { Authorization: `Bearer ${await getToken()}` } },
    );

    if (!rawMessageRequests.ok) {
      throw new Error("Failed to fetch chat history");
    }

    const rawMessages = await rawMessageRequests.json();

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

    return (
      <div className="flex flex-col h-screen overscroll-none">
        <Toaster richColors />
        <div className="sticky top-0 z-10">
          <Header isChat={formattedMessages.length !== 0} />
        </div>
        <div className="flex flex-grow flex-col items-center justify-center overscroll-none">
          {formattedMessages.length !== 0 ? (
            <div className="flex flex-grow flex-col items-center justify-center overscroll-none">
              <Alert className="m-6 flex-none md:max-w-xl max-w-80 p-3">
                <Hand className="h-4 w-4" />
                <AlertTitle>Welcome to this shared chat.</AlertTitle>
                <AlertDescription>
                  <p>
                    Zekher allows users to ask anything about the Holocaust and
                    receive answers from firsthand testimonies collected by Dr.
                    David P. Boder.
                  </p>
                  <div className="space-x-3 mt-3 flex flex-row">
                    <Link href="/chat">
                      <Button variant="default">Start a new chat</Button>
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
              <ChatView messages={formattedMessages} />
            </div>
          ) : (
            <LoadingScreen type={LoadingScreenType.Shared} />
          )}
          <Footer isChat={formattedMessages.length !== 0} />
        </div>
      </div>
    );
  } catch (error: unknown) {
    toast.error("Something went wrong", {
      description: (error as Error).message || "An unexpected error occurred.",
    });
    return (
      <div className="flex flex-col h-screen overscroll-none">
        <Toaster richColors />
        <div className="sticky top-0 z-10">
          <Header isChat={false} />
        </div>
        <div className="flex flex-grow flex-col items-center justify-center overscroll-none">
          <Alert className="m-6 flex-none max-w-xl">
            <Hand className="h-4 w-4" />
            <AlertTitle>Error loading chat</AlertTitle>
            <AlertDescription>
              An error occurred while loading the chat. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
}
