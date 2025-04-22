"use client";

import React, { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Header from "@/components/header.tsx";
import Footer from "@/components/footer.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip.tsx";
import { Share, Eye, LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import Link from "next/link";
import { Toaster, toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { v4 as uuidv4 } from "uuid";
import { DialogClose } from "@radix-ui/react-dialog";
import navigate from "./actions.ts";

interface FormattedData {
  id: string;
  history: string;
}

interface PublicChat {
  public: boolean;
  loading: boolean;
}

export default function History() {
  const [formattedData, setFormattedData] = React.useState<FormattedData[]>([]);
  const [publicChat, setPublicChat] = React.useState<PublicChat>({
    public: false,
    loading: false,
  });
  const { userId, getToken } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        redirect("/sign-in");
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/user_history?user_id=${userId}&return_chats=true`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();

        // Process histories
        const histories = Object.entries(data).map(([key, messages]) => {
          if (!Array.isArray(messages)) return null;

          const conversationKey = key.split("/")[1];
          const reversedMessages = messages.reverse();

          const history = reversedMessages
            .map((msgString: string) => {
              const msg = JSON.parse(msgString);
              if (msg && msg.data && msg.data.content) {
                return `${msg.type.toUpperCase()}: ${msg.data.content}`;
              }
              return "";
            })
            .filter(Boolean)
            .join(" | ");

          return { id: conversationKey, history };
        });

        const validHistories = histories.filter(Boolean) as {
          id: string;
          history: string;
        }[];

        setFormattedData(validHistories);
      } catch (error) {
        toast.error("Failed to load user history", {
          description: "An error occurred while fetching the data.",
        });
      }
    };

    fetchData();
  }, [userId, getToken]);

  async function checkChatHistory(conversationId: string) {
    setPublicChat({ public: false, loading: true });
    try {
      const publicRequest = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/share/get_public?conversation_id=${conversationId}`,
        { headers: { Authorization: `Bearer ${await getToken()}` } },
      );

      if (!publicRequest.ok) {
        throw new Error("Failed to fetch public chat status");
      }

      const publicResponse = await publicRequest.json();

      setPublicChat({ public: publicResponse.public, loading: false });
    } catch (error) {
      toast.error("Failed to load chat history", {
        description: "An error occurred while fetching the data.",
      });
    }
  }

  async function shareChat(conversationId: string, isPublic: boolean) {
    try {
      if (!isPublic) {
        const token = await getToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/share/set_public?user_id=${userId}&conversation_id=${conversationId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to share chat");
        }

        if ("clipboard" in navigator) {
          await navigator.clipboard.writeText(
            `${window.location.origin}/share/${conversationId}`,
          );
        } else {
          document.execCommand(
            "copy",
            true,
            `${window.location.origin}/share/${conversationId}`,
          );
        }

        toast.success("Chat shared successfully", {
          description:
            "Link copied to clipboard. Redirecting to shared chat...",
        });
        setTimeout(() => {
          navigate(`/share/${conversationId}`);
        }, 2000);
      } else {
        const token = await getToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/share/set_private?user_id=${userId}&conversation_id=${conversationId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to unshare chat");
        }

        toast.success("Chat unshared successfully", {
          description: "The chat is no longer shared with the public.",
        });
      }
    } catch (error) {
      toast.error("Failed to share chat", {
        description: "An error occurred while sharing the chat.",
      });
    }
  }

  let shareButtonText = "";
  if (publicChat.loading) {
    shareButtonText = "Loading...";
  } else if (publicChat.public) {
    shareButtonText = "Unshare";
  } else {
    shareButtonText = "Share";
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster richColors />
      <Header isChat={false} />
      <div className="flex-grow p-6">
        <Table className="p-6">
          <TableHeader>
            <TableRow>
              <TableHead>Chat History</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formattedData && formattedData.length === 0 && (
              <>
                {Array.from({ length: 5 }).map(() => (
                  <TableRow key={uuidv4()}>
                    <TableCell className="w-11/12 p-4">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell className="text-right w-1/12 p-4">
                      <div className="flex space-x-2 justify-end">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
            {formattedData.map(({ id, history }) => (
              <TableRow key={id}>
                <TableCell className="w-11/12 p-4">{history}</TableCell>
                <TableCell className="text-right w-1/12 p-4">
                  <div className="flex space-x-2 justify-end">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={`/${id}?restore=true`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>View Conversation</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <Dialog>
                          <DialogTrigger onClick={() => checkChatHistory(id)}>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Share className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                          </DialogTrigger>
                          {!publicChat.loading ? (
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>
                                  {publicChat.loading ? "Unshare" : "Share"}{" "}
                                  Chat
                                </DialogTitle>
                                <DialogDescription>
                                  {publicChat.public
                                    ? "This chat is currently shared with the public. Click the button below to unshare it."
                                    : "This chat is currently private. Click the button below to share it with the public."}
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose>
                                  <Button
                                    onClick={() =>
                                      shareChat(id, publicChat.public)
                                    }
                                    type="submit"
                                    variant={
                                      !publicChat.public
                                        ? "default"
                                        : "destructive"
                                    }
                                    disabled={publicChat.loading}
                                  >
                                    {shareButtonText}
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          ) : (
                            <DialogContent className="sm:max-w-[425px] items-center justify-center">
                              <LoaderCircle className="w-8 h-8 animate-spin" />
                            </DialogContent>
                          )}
                        </Dialog>
                        <TooltipContent>Share Conversation</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Footer isChat={false} />
    </div>
  );
}
