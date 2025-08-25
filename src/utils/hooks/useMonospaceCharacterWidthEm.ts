import { useEffect, useState } from "react";

const measureCharacterWidth = (fontFamily: string): number => {
  const fontSize = 100;
  const tempSpan = document.createElement("span");
  tempSpan.style.fontSize = `${fontSize}px`;
  tempSpan.style.fontFamily = fontFamily;
  tempSpan.style.visibility = "hidden";
  tempSpan.style.position = "absolute";
  tempSpan.textContent = "M";
  document.body.appendChild(tempSpan);
  const measuredWidth = tempSpan.getBoundingClientRect().width;
  document.body.removeChild(tempSpan);
  return measuredWidth / fontSize;
};

export function useMonospaceCharacterWidthEm(fontFamily: string): number | null {
  const [charWidth, setCharWidth] = useState<number | null>(() => {
    if (typeof window !== "undefined" && document.fonts.status === "loaded") {
      return measureCharacterWidth(fontFamily);
    }
    return null;
  });

  useEffect(() => {
    let mounted = true;

    const updateWidth = () => {
      if (mounted) {
        setCharWidth(measureCharacterWidth(fontFamily));
      }
    };

    if (document.fonts.status !== "loaded") {
      document.fonts.ready.then(updateWidth);
    }

    document.fonts.addEventListener("loadingdone", updateWidth);

    return () => {
      mounted = false;
      document.fonts.removeEventListener("loadingdone", updateWidth);
    };
  }, [fontFamily]);

  return charWidth;
}
