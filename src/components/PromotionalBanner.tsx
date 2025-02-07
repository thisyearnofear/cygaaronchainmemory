import { useEffect, useState } from "react";

const PromotionalBanner = () => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const endTime = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours from now

    const updateTimer = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Promotion ended");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    const timer = setInterval(updateTimer, 60000);
    updateTimer(); // Initial call

    return () => clearInterval(timer);
  }, []);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg animate-pulse z-50"
      >
        🏆
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
            <h3 className="text-lg font-bold mb-1">🎉 CLAIMABLES</h3>
            <p className="text-sm">
              🏆 Top 3 players win exclusive CryptoTester NFTs
              <br />
              💰 Top 100 players share 1M $CYGAAR tokens
            </p>
          </div>
          <div className="text-center px-6 border-l border-white/20">
            <div className="text-2xl font-bold animate-pulse">{timeLeft}</div>
            <div className="text-xs">remaining</div>
          </div>
          <div className="flex-1 text-right">
            <a
              href="https://twitter.com/intent/tweet?text=Just%20played%20Remenguiny%20-%20the%20coolest%20memory%20game%20on%20@abstractfun!%20Try%20to%20beat%20my%20score%20and%20win%20NFTs%20%2B%20$CYGAAR%20tokens!%20%F0%9F%90%A7%E2%9C%A8%0A%0Aplay%3A%20https%3A%2F%2Fremenguiny.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm transition-colors"
            >
              🐦 Tweet to Qualify
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionalBanner;
