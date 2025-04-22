import React from "react";
import { useAuth } from "@clerk/nextjs";
import { PlusIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Message } from "ai";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel.tsx";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
} from "./ui/tooltip.tsx";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import Footer from "./footer.tsx";
import { LoadingScreenType } from "./loadingScreen.tsx";

export default function BottomBar({
  input,
  handleInputChange,
  handleSubmit,
  stop,
  isLoading,
  messages,
  isBorder,
  type,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  destroyChat,
}: {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  stop: () => void;
  isLoading: boolean;
  messages: Message[];
  destroyChat: () => void;
  isBorder: boolean;
  type: LoadingScreenType;
}) {
  const showReload = messages.length !== 0 && !isLoading;

  // Define the type for each prompt
  type Prompt = {
    question: string;
    prompt: string;
  };

  // Define the type for the examplePrompts object
  type ExamplePrompts = {
    [key: number]: Prompt;
  };

  // The examplePrompts object with type annotations
  const examplePrompts: ExamplePrompts = {
    0: {
      question: "Tell me about the life of a Holocaust survivor",
      prompt: "Tell me about a Holocaust survivor named Rita Benmayor.",
    },
    1: {
      question: "Tell me about a concentration camp",
      prompt: "Tell me about the concentration camp Auschwitz.",
    },
    2: {
      question: "Tell me about ghettos",
      prompt: "Tell me about the Warsaw Ghetto.",
    },
  };

  const { isSignedIn } = useAuth();

  function refresh() {
    stop();
    destroyChat();
  }

  return (
    <div className="w-screen pt-3 space-y-3 bg-transparent rounded-t-xl flex flex-col">
      {messages.length === 0 && type === LoadingScreenType.New && (
        <Carousel className="self-center flex  flex-grow w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          <CarouselContent className="flex justify-center">
            {Object.values(examplePrompts).map((item, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <CarouselItem key={index} className="flex justify-center">
                <div className="p-1">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center bg-white font-sans font-normal h-8 text-sm p-4"
                    onClick={() =>
                      handleInputChange({
                        target: { value: item.prompt },
                      } as React.ChangeEvent<HTMLInputElement>)
                    }
                  >
                    {item.question}
                  </Button>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="bg-white" />
          <CarouselNext className="bg-white" />
        </Carousel>
      )}
      <div
        className={`pb-3 pt-3 px-3 md:px-5 md:pb-5 space-y-3 bg-white rounded-t-xl flex flex-col ${isBorder ? "border-t border-border" : ""}`}
      >
        {/* Form component */}
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div
            className="cf-turnstile"
            data-sitekey="0x4AAAAAAAhXjQLsdbfwrcHW"
          />
          <div className="flex flex-row space-x-3 flex-grow">
            {/* Left side: Button and Input */}
            <div className="flex flex-row flex-grow space-x-3">
              {/* New Chat Button with Tooltip */}
              <div className="flex flex-col items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipContent className="p-1 rounded-md border m-1 text-xs">
                      <p>New chat</p>
                    </TooltipContent>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className="flex flex-grow"
                        onClick={() => refresh()}
                      >
                        <PlusIcon />
                      </Button>
                    </TooltipTrigger>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {/* Input Field */}
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder={
                  isSignedIn
                    ? "Ask a question..."
                    : "To prevent spam, we ask you to sign in."
                }
                disabled={!isSignedIn}
                className="flex flex-grow h-10 bg-white text-base"
              />
              {/* Reload Button with Tooltip (optional) */}
              {showReload && (
                <div className="flex flex-col items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipContent className="p-1 rounded-md border m-1 text-xs">
                        <p>Reload</p>
                      </TooltipContent>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex flex-grow bg-white"
                        >
                          <ReloadIcon />
                        </Button>
                      </TooltipTrigger>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
            {/* Right side: Submit/Stop Button */}
            {isLoading ? (
              <Button
                variant="destructive"
                className="p-3 md:p-5 h-10 text-base"
                onClick={stop}
              >
                Stop
              </Button>
            ) : (
              <Button
                type="submit"
                className="p-3 md:p-5 h-10 text-base"
                disabled={!isSignedIn}
              >
                Ask
              </Button>
            )}
          </div>
        </form>
        {/* Footer component */}
        <Footer isChat />
      </div>
    </div>
  );
}
