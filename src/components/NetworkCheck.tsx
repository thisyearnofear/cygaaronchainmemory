import { useChainId, useSwitchChain } from "wagmi";
import { config } from "@/app/providers";

const NetworkCheck: React.FC = () => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const ABSTRACT_TESTNET_ID = config.chains[0].id; // Get the first chain from config

  // Only show warning if connected and not on Abstract testnet
  if (chainId && chainId !== ABSTRACT_TESTNET_ID) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
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
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Please connect to Abstract Testnet to play and track scores.
              {switchChain && (
                <button
                  onClick={() => switchChain({ chainId: ABSTRACT_TESTNET_ID })}
                  className="ml-2 underline font-medium hover:text-yellow-800"
                >
                  Switch Network
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default NetworkCheck;
