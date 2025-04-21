"use client";

import dynamic from "next/dynamic";
import ClientOnly from "@/components/ClientOnly";
import { Suspense } from "react";
import SideDecorations from "../components/SideDecorations";

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

const ClaimCygaarTokens = dynamic(
  () => import("@/components/ClaimCygaarTokens"),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 bg-white rounded-xl shadow-md max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-blue-600">
          Loading CYGAAR Tokens...
        </h2>
      </div>
    ),
  }
);

export default function HomePage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="container mx-auto px-4 pt-20">
          <div className="flex flex-col items-center gap-8">
            <ConnectButton />
            <SideDecorations />
            <MemoryGame />
            <div className="mt-12 w-full max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-6">
                $CYGAAR Token Distribution
              </h2>
              <p className="text-center mb-8 text-gray-600">
                The gameplay period has ended. Players who participated before
                the deadline can now claim their $CYGAAR tokens!
              </p>
              <ClaimCygaarTokens />
            </div>
            <div className="music-player-container">
              <MusicPlayer />
            </div>
          </div>
        </div>
      </Suspense>
    </ClientOnly>
  );
}
