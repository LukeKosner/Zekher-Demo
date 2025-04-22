"use client";

import React from "react";
import { SignedIn, SignedOut, useAuth, useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import navigate from "@/app/history/actions.ts";
import { Button } from "./ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.tsx";

export default function Header({
  destroyChat = () => {
    navigate("/chat");
  },
  isChat,
}: {
  // eslint-disable-next-line react/require-default-props
  destroyChat?: () => void;
  isChat: boolean;
}) {
  const { openUserProfile } = useClerk();
  const user = useUser();
  const auth = useAuth();

  function getInitials() {
    let initials;

    if (user && user.user?.fullName) {
      initials = user.user?.fullName
        .split(" ")
        .map((n) => n[0])
        .join("");
    }
    return initials;
  }

  return (
    <div
      className={`relative p-3 md:p-5 h-16 flex flex-row items-center justify-between w-screen rounded-b-xl bg-white ${isChat ? "border-b border-border" : ""}`}
    >
      <Button
        variant="link"
        className="absolute font-normal left-1/2 transform -translate-x-1/2 text-2xl md:text-3xl hover:no-underline p-0 flex flex-row justify-center items-center"
        onClick={destroyChat}
      >
        <p className="font-sans p-3 md:p-5">ZEKHER</p>
        <span className="font-hebrew text-2xl md:text-3xl font-normal">
          זכר
        </span>
      </Button>

      <div className="flex items-center space-x-3 ml-auto">
        <SignedIn>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center">
              <Avatar className="w-8 h-8 md:h-10 md:w-10">
                <AvatarFallback>{getInitials()}</AvatarFallback>
                <AvatarImage src={user?.user?.imageUrl} />
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-3">
              <DropdownMenuLabel>
                Welcome, {user.user?.firstName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => openUserProfile()}
              >
                Account
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  navigate("/history");
                }}
              >
                History
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => auth.signOut()}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SignedIn>
        <SignedOut>
          <Link className="hidden md:block" href="/auth/sign-in">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/auth/sign-up" className="hidden md:block">
            <Button variant="default">Sign Up</Button>
          </Link>
          <Link href="/auth/sign-up" className=" md:hidden">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </SignedOut>
      </div>
    </div>
  );
}
