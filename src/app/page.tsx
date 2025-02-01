"use client";

import dynamic from "next/dynamic";
import ClientOnly from "@/components/ClientOnly";
import { Suspense } from "react";

// Dynamically import components with ssr disabled
const MemoryGame = dynamic(() => import("@/components/MemoryGame"), {
  ssr: false,
  loading: () => (
    <div className="game-container">
      <div className="game-info">
        <h2 className="text-2xl font-bold mb-2">Loading Game...</h2>
      </div>
    </div>
  ),
});

const ConnectButton = dynamic(
  () => import("@rainbow-me/rainbowkit").then((mod) => mod.ConnectButton),
  { ssr: false }
);

const MusicPlayer = dynamic(() => import("@/components/MusicPlayer"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-8">
            <ConnectButton />
            <MemoryGame />
            <div className="music-player-container">
              <MusicPlayer />
            </div>
          </div>
        </div>
      </Suspense>
    </ClientOnly>
  );
}
