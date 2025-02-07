import Image from "next/image";

const SideDecorations = () => {
  return (
    <>
      <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 w-48 space-y-4">
        <div className="bg-white/90 rounded-lg p-4 shadow-lg">
          <Image
            src="/images/penguin10.png"
            alt="Luca"
            width={60}
            height={60}
            className="mx-auto mb-2"
          />
          <h4 className="text-center font-bold mb-2">Win NFTs! 🏆</h4>
          <p className="text-sm text-center">
            Top 3 high scorers who complete all levels receive{" "}
            <a href="https://cryptotesters.com/" target="_blank">
              CryptoTester NFTs thanks to{" "}
              <a href="https://x.com/litocoen" target="_blank">
                LITO
              </a>
            </a>
          </p>
        </div>
      </div>
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 w-48 space-y-4">
        <div className="bg-white/90 rounded-lg p-4 shadow-lg">
          <Image
            src="/images/penguin9.png"
            alt="Cygaar"
            width={60}
            height={60}
            className="mx-auto mb-2"
          />
          <h4 className="text-center font-bold mb-2">$CYGAAR 💰</h4>
          <p className="text-sm text-center">
            1M tokens will be claimable in abstractland for whitelisted wallets
          </p>
        </div>
      </div>
    </>
  );
};

export default SideDecorations;
