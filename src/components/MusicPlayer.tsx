"use client";

import { useEffect, useRef } from "react";

const MusicPlayer: React.FC = () => {
  const playerRef = useRef<HTMLDivElement>(null);
  const baseTrackUrl = "https://futuretape.xyz/embed/search/matthew%20chaim";

  useEffect(() => {
    loadRandomTrack();
  }, []);

  const loadRandomTrack = () => {
    if (!playerRef.current) return;
    const randomTrack = Math.floor(Math.random() * 6) + 1;
    const trackUrl = `${baseTrackUrl}?start=${randomTrack}&autoplay=1`;

    playerRef.current.innerHTML = `
      <iframe
        src="${trackUrl}"
        width="100%"
        height="300"
        frameBorder="0"
        allow="autoplay; clipboard-write;"
        loading="lazy"
        style="position: relative; top: -260px;"
      ></iframe>
    `;
  };

  return (
    <div className="flex flex-col items-center mt-4">
      <div
        ref={playerRef}
        className="w-[350px] h-[40px] bg-black/50 rounded-lg overflow-hidden"
      />
    </div>
  );
};

export default MusicPlayer;
