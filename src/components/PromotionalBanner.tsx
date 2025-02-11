import { useState } from "react";

const PromotionalBanner = () => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg animate-pulse z-50"
      >
        📢
      </button>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-blue-500 text-white p-4 shadow-lg z-50">
      <button
        onClick={() => setIsMinimized(true)}
        className="absolute top-2 right-2 text-white/80 hover:text-white"
      >
        ✕
      </button>
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">🎯 Snapshot Complete!</h3>
            <p className="text-sm">
              Claimables coming soon to{" "}
              <a
                href="https://abstractland-cygaar.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white/90"
              >
                abstractland
              </a>{" "}
              &{" "}
              <a
                href="https://cygaarland.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white/90"
              >
                cygaarland
              </a>
            </p>
          </div>
          <div className="flex-1 text-right">
            <a
              href="https://t.me/CygaarGroupie"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm transition-colors"
            >
              📱 Join Telegram for Updates
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionalBanner;
