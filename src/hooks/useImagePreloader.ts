import { useEffect } from "react";

export const useImagePreloader = () => {
  useEffect(() => {
    const imageUrls = Array.from(
      { length: 9 },
      (_, i) => `/images/penguin${i}.png`
    );
    imageUrls.push("/images/mound.png", "/images/mound_hover.png");

    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, []);
};
