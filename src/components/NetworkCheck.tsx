import { useChainId, useSwitchChain } from "wagmi";
import { wagmiConfig } from "@/app/providers";

const NetworkCheck: React.FC = () => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const ABSTRACT_TESTNET_ID = wagmiConfig.chains[0].id;

  // Show warning if connected and not on Abstract testnet
  if (chainId && chainId !== ABSTRACT_TESTNET_ID) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Wrong Network Detected
              </h3>
              <p className="text-gray-600 mb-4">
                Please switch to Abstract Testnet to play and track your scores
                on the leaderboard.
              </p>
              {switchChain && (
                <button
                  onClick={() => switchChain({ chainId: ABSTRACT_TESTNET_ID })}
                  className="w-full bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Switch to Abstract Testnet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default NetworkCheck;
