import { Button } from "@/components/ui/button";
import { Disc3 } from "lucide-react";
import Link from "next/link";
import React from "react";

const RoomNavbar = () => {
  return (
    <nav className="relative z-10 p-6 flex justify-between items-center backdrop-blur-md bg-black/20">
      <div className="flex items-center space-x-2 cursor-pointer">
        <Disc3 className="h-8 w-8 text-rose-500" />
        <span className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-purple-500 text-transparent bg-clip-text">
          HypeQueue
        </span>
      </div>

     
       

        <Link href={"/dashboard"}>
          <Button
            variant="outline"
            className="bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 border-rose-500/30"
          >
            Leave Room
          </Button>
        </Link>
      
    </nav>
  );
};

export default RoomNavbar;
