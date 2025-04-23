import { useState, useEffect } from "react";
import { ethereumClient } from "@/app/providers";

export function useEnsName(address: string) {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function resolveEns() {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        // Always use Ethereum mainnet client for ENS resolution
        const name = await ethereumClient.getEnsName({
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
