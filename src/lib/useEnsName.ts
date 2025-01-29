import { useState, useEffect } from "react";

interface EnsProfile {
  address: string;
  identity: string;
  displayName: string;
  avatar: string | null;
}

export function useEnsName(address: string | undefined) {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [ensAvatar, setEnsAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchEns() {
      if (!address) return;

      setLoading(true);
      try {
        const response = await fetch(`https://api.web3.bio/ns/ens/${address}`);
        if (response.ok) {
          const data: EnsProfile = await response.json();
          setEnsName(data.displayName || null);
          setEnsAvatar(data.avatar);
        }
      } catch (error) {
        console.error("Error fetching ENS:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEns();
  }, [address]);

  return { ensName, ensAvatar, loading };
}
