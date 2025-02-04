"use client";

import { useChainId } from "wagmi";
import { abstractTestnet } from "@/app/providers";

export default function NetworkCheck({
  children,
}: {
  children: React.ReactNode;
}) {
  const chainId = useChainId();

  if (chainId !== abstractTestnet.id) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-red-800 font-bold">Wrong Network</h2>
        <p className="text-red-600">
          Please connect to Abstract Testnet to use this app.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
