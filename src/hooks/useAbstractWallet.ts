import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";

export function useAbstractWallet() {
  const { login, logout } = useLoginWithAbstract();
  const { isConnected } = useAccount();

  return {
    login,
    logout,
    isConnected,
  };
}
