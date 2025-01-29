import { useState, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

// Create a mainnet client specifically for ENS resolution
const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export function useEnsName(address: string) {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function resolveEns() {
      try {
        // Use mainnet client for ENS resolution
        const name = await ensClient.getEnsName({
          address: address as `0x${string}`,
        });
        setEnsName(name);
      } catch (error) {
        console.error("Error resolving ENS:", error);
      } finally {
        setIsLoading(false);
      }
    }

    resolveEns();
  }, [address]);

  return { ensName, isLoading };
}
