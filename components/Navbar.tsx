import { Button } from "@/components/ui/button";
import { Disc3 } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import React from "react";

interface NavbarAuthProps {
  type: "signin" | "signup" | "logout";
}

const Navbar = ({ type }: NavbarAuthProps) => {
  return (
    <nav className="relative z-10 p-6 flex justify-between items-center backdrop-blur-md bg-black/20">
      <Link href="/">
        <div className="flex items-center space-x-2 cursor-pointer">
          <Disc3 className="h-8 w-8 text-rose-500" />
          <span className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-purple-500 text-transparent bg-clip-text">
            HypeQueue
          </span>
        </div>
      </Link>

      {type === "signin" ? (
        <Link href={"/signup"}>
          <Button
            variant="outline"
            className="bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 border-rose-500/30"
          >
            Sign Up
          </Button>
        </Link>
      ) : type === "logout" ? (
        <Button
          onClick={() => signOut({ callbackUrl: "/" })}
          variant="outline"
          className="bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 border-rose-500/30"
        >
          LogOut
        </Button>
      ) : (
        <Link href={"/signin"}>
          <Button
            variant="outline"
            className="bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 border-rose-500/30"
          >
            Sign In
          </Button>
        </Link>
      )}
    </nav>
  );
};

export default Navbar;
