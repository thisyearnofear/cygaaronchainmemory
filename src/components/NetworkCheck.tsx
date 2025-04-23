import React, { useEffect, useState, useCallback } from "react";
import { getChainByMode, abstractMainnet } from "@/lib/chains";

interface NetworkCheckProps {
  children: React.ReactNode;
  mode?: "game" | "claim"; // 'game' for mainnet, 'claim' for testnet
}

export const NetworkCheck: React.FC<NetworkCheckProps> = ({
  children,
  mode = "game",
}) => {
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean | null>(
    null
  );
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask to use this feature");
      return;
    }

    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const targetChain = getChainByMode(mode);
      const targetChainId = `0x${targetChain.id.toString(16)}`;

      setIsCorrectNetwork(chainId === targetChainId);
      setError(null);
    } catch (err) {
      setError("Failed to check network");
      console.error(err);
    }
  }, [mode]);

  const switchNetwork = async () => {
    if (!window.ethereum) return;

    try {
      setIsSwitching(true);
      setError(null);

      const targetChain = getChainByMode(mode);
      const targetChainId = `0x${targetChain.id.toString(16)}`;

      // Try to switch to the correct network
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetChainId }],
        });
      } catch (switchError: unknown) {
        // If the network is not added to MetaMask, add it
        if ((switchError as { code?: number })?.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetChainId,
                chainName: targetChain.name,
                nativeCurrency: targetChain.nativeCurrency,
                rpcUrls: targetChain.rpcUrls.default.http,
                blockExplorerUrls: [
                  (targetChain as typeof abstractMainnet).blockExplorers.default
                    .url,
                ],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      await checkNetwork();
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to switch network");
      console.error("Error switching network:", err);
    } finally {
      setIsSwitching(false);
    }
  };

  useEffect(() => {
    checkNetwork();

    // Listen for chain changes
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => {
        checkNetwork();
      });
    }
  }, [mode, checkNetwork]);

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (isCorrectNetwork === false) {
    const targetChain = getChainByMode(mode);
    return (
      <div className="text-center p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 mb-2">
            {mode === "game"
              ? `Please switch to ${targetChain.name} to play the game`
              : `Please switch to ${targetChain.name} to claim your tokens`}
          </p>
          <button
            onClick={switchNetwork}
            disabled={isSwitching}
            className={`
              px-4 py-2 rounded font-bold
              ${
                isSwitching
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white"
              }
            `}
          >
            {isSwitching ? "Switching..." : "Switch Network"}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
