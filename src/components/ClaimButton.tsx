import React, { useState } from "react";
import { ethers } from "ethers";
import { CYGAAR_ADDRESSES } from "../lib/tokenConfig";
import { CygaarDistributor } from "../contracts/CygaarDistributor";

interface ClaimButtonProps {
  userAddress: string;
  onClaimSuccess?: () => void;
}

export const ClaimButton: React.FC<ClaimButtonProps> = ({
  userAddress,
  onClaimSuccess,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!userAddress) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setIsClaiming(true);
      setError(null);

      // Get the distributor contract
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const distributor = new ethers.Contract(
        CYGAAR_ADDRESSES.DISTRIBUTOR_ADDRESS,
        CygaarDistributor.abi,
        signer
      );

      // Call the claim function
      const tx = await distributor.claimTokens();
      await tx.wait();

      // Refresh stats
      if (onClaimSuccess) {
        onClaimSuccess();
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to claim tokens");
      console.error("Error claiming tokens:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClaim}
        disabled={isClaiming || !userAddress}
        className={`
          px-4 py-2 rounded font-bold
          ${
            isClaiming || !userAddress
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-white"
          }
        `}
      >
        {isClaiming ? "Claiming..." : "Claim Tokens"}
      </button>

      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
};
