import React, { useEffect, useMemo, useRef, useState } from "react";

export const FocusedScriptContext = React.createContext({ scriptId: "" });

interface Item {
  top: number;
  height: number;
  bottom: number;
  scriptId: string;
}

export const FocusedScriptProvider = (props: { children: React.ReactNode }) => {
  const [scriptId, setScriptId] = useState("");
  const scriptIdRef = useRef(scriptId);
  scriptIdRef.current = scriptId;

  const itemsRef = useRef<Item[]>([]);

  useEffect(() => {
    const getItemsInterval = setInterval(() => {
      const els = document.querySelectorAll("[data-scripted-editor]");

      const items: Item[] = [];
      itemsRef.current = items;

      els.forEach((el) => {
        const { top: _top, height } = el.getBoundingClientRect();
        const scriptId = el.getAttribute("data-scripted-editor")!;
        const top = window.scrollY + _top;
        const bottom = top + height;
        items.push({ top, height, bottom, scriptId });
      });
    }, 500);

    const onScroll = () => {
      let focusedItem: Item | null = null;

      const y1 = window.scrollY;
      const y2 = window.scrollY + window.innerHeight;

      const buf = window.innerHeight * 0.2;

      const activationBounds: [number, number] = [y1 + 48, y2 - buf];
      const boundsIfActive: [number, number] = [y1 + 48, y2 - 24];
      const looseActivationMark = y2 - window.innerHeight * 0.35;

      const heightExceedsBounds = (height: number, bounds: [number, number]) => {
        const [top, bottom] = bounds;
        const diff = bottom - top;
        return height > diff;
      };

      const isInBounds = (item: Item, bounds: [number, number]) => {
        const [top, bottom] = bounds;
        return item.top > top && item.bottom < bottom;
      };

      const isLooselyInBounds = (item: Item) => {
        return item.top < looseActivationMark && item.bottom > looseActivationMark;
      };

      for (const item of itemsRef.current) {
        const active = scriptIdRef.current === item.scriptId;

        const bounds = active ? boundsIfActive : activationBounds;

        if (isInBounds(item, bounds)) {
          focusedItem = item;
        } else if (heightExceedsBounds(item.height, bounds) && isLooselyInBounds(item)) {
          focusedItem = item;
        }

        if (focusedItem) break;
      }

      const scriptId = focusedItem?.scriptId || "";
      if (scriptIdRef.current !== scriptId) setScriptId(scriptId);
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      clearInterval(getItemsInterval);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const value = useMemo(() => ({ scriptId }), [scriptId]);

  useEffect(() => {
    console.log(scriptId);
  }, [scriptId]);

  return (
    <FocusedScriptContext.Provider value={value}>{props.children}</FocusedScriptContext.Provider>
  );
};
