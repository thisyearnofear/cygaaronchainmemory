import { useChainId, useSwitchChain } from "wagmi";
import { abstractMainnet } from "@/lib/chains";

export default function NetworkCheck({
  children,
}: {
  children: React.ReactNode;
}) {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  if (chainId !== abstractMainnet.id) {
    return (
      <div className="text-center p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 mb-2">
            For the best experience, we recommend using Abstract
          </p>
          {switchChain && (
            <button
              onClick={() => switchChain({ chainId: abstractMainnet.id })}
              className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
            >
              Switch to Abstract
            </button>
          )}
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
