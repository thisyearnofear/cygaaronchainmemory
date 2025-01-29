"use client";

import { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="w-full p-6 bg-white/80 shadow-lg mb-8">
        <div className="container mx-auto flex justify-center items-center">
          <h1 className="text-3xl font-bold text-sky-900">
            🐧 Cygaar Memory Club
          </h1>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-16 p-6 bg-white/80">
        <div className="container mx-auto flex flex-col items-center space-y-4">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-sky-600">
            <a
              href="https://thirdweb.com/abstract-testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-800 transition-colors"
            >
              Get Abstract Testnet ETH
            </a>
            <span>•</span>
            <a
              href="https://www.cygaar.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-800 transition-colors"
            >
              Cygaar
            </a>
            <span>•</span>
            <a
              href="https://t.me/CygaarGroupie"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-800 transition-colors"
            >
              Telegram
            </a>
            <span>•</span>
            <a
              href="https://x.com/CygaarGroupie"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-800 transition-colors"
            >
              Twitter
            </a>
          </div>
          <div className="text-sm text-gray-500">
            Built by{" "}
            <a
              href="https://warpcast.com/papa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-800 transition-colors"
            >
              Papa
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
