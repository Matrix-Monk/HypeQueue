import { Button } from "@/components/ui/button";
import { Music4, Disc3, Radio, Headphones } from "lucide-react";
import Link from "next/link";

export default function Home() {

  return (
    <main className="min-h-screen relative">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2070&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.3)",
        }}
      />
      <div className="relative z-10 min-h-screen flex flex-col">
        <nav className="p-6 flex justify-between items-center backdrop-blur-sm bg-black/20">
          <div className="flex items-center space-x-2">
            <Disc3 className="h-8 w-8 text-rose-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-purple-500 text-transparent bg-clip-text">
              HypeQueue
            </span>
          </div>
          <Link href={"/signin"}>
            <Button
              variant="outline"
              className="bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 border-rose-500/30"
            >
              Sign in
            </Button>
          </Link>
        </nav>

        <div className="flex-1 grid md:grid-cols-2 gap-12 px-6 py-12">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-rose-500 to-purple-500 text-transparent bg-clip-text">
                Hype your track.
                <br />
                Own the moment.
              </span>
            </h1>
            <p className="text-lg text-zinc-300/90 mb-8 leading-relaxed">
              Experience music like never before with our real-time, interactive
              music queueing platform.
            </p>
            <Link href={"/signin"}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-purple-500 text-white hover:from-rose-600 hover:to-purple-600 transition-all border-0 w-fit"
              >
                Get Started
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 content-center">
            {[
              {
                icon: Music4,
                title: "Live Queue",
                desc: "Real-time music updates",
              },
              {
                icon: Radio,
                title: "Social Features",
                desc: "Connect with friends",
              },
              {
                icon: Headphones,
                title: "Party Mode",
                desc: "Collaborative playlists",
              },
              { icon: Disc3, title: "Track Stats", desc: "Music analytics" },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-white/5 backdrop-blur-sm"
              >
                <feature.icon className="h-6 w-6 text-rose-400 mb-2" />
                <h3 className="font-semibold text-rose-100">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="text-zinc-400 text-sm text-center py-6 backdrop-blur-sm bg-black/20">
          © 2024 HypeQueue. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
