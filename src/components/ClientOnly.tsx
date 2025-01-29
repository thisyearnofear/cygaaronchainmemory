"use client";

import { useEffect, useState } from "react";

export default function ClientOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="game-container">
        <div className="game-info">
          <h2 className="text-2xl font-bold mb-2">Loading Game...</h2>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
