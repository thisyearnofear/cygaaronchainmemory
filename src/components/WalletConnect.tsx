import React, { useEffect, useState } from "react";
import { CHAIN_ID, RPC_URL } from "../lib/tokenConfig";

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to use this feature");
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const address = accounts[0];

      // Check if we're on the correct network
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== `0x${CHAIN_ID.toString(16)}`) {
        // Try to switch to the correct network
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: unknown) {
          // If the network is not added to MetaMask, add it
          if ((switchError as { code?: number })?.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${CHAIN_ID.toString(16)}`,
                  chainName: "Abstract Testnet",
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: [RPC_URL],
                  blockExplorerUrls: ["https://sepolia.abscan.org/"],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      setAccount(address);
      onConnect(address);
      setError(null);
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to connect wallet");
      console.error("Error connecting wallet:", err);
    }
  };

  useEffect(() => {
    // Check if already connected
    if (window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            onConnect(accounts[0]);
          }
        })
        .catch(console.error);

      // Listen for account changes
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          onConnect(accounts[0]);
        } else {
          setAccount(null);
          onConnect("");
        }
      });

      // Listen for chain changes
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, [onConnect]);

  return (
    <div className="flex flex-col items-center gap-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}

      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="text-sm text-gray-600">
          Connected: {account.slice(0, 6)}...{account.slice(-4)}
        </div>
      )}
    </div>
  );
};
