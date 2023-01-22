import React, { useEffect, useMemo, useRef, useState } from "react";
import { scriptedEditorConstants } from "../scriptedEditorConstants";

const { SCRIPT_NAVIGATION_BREAKPOINT, SCRIPT_NAVIGATION_DRAWER_HEIGHT } = scriptedEditorConstants;

export const FocusedScriptContext = React.createContext({ focusedScriptId: "" });

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
  const fetchedItemsAtRef = useRef(0);

  useEffect(() => {
    const getItems = () => {
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
    };

    const recalcFocused = () => {
      const timeSinceFetched = Date.now() - fetchedItemsAtRef.current;
      if (timeSinceFetched > 2000) {
        getItems();
        fetchedItemsAtRef.current = Date.now();
      }

      let focusedItem: Item | null = null;

      const y1 = window.scrollY;
      const y2 = window.scrollY + window.innerHeight;

      const desktopBuf = window.innerHeight * 0.15;
      const mobileBuf = SCRIPT_NAVIGATION_DRAWER_HEIGHT;

      const isMobile = window.innerWidth <= SCRIPT_NAVIGATION_BREAKPOINT;
      const buf = isMobile ? mobileBuf : desktopBuf;

      const activationBounds: [number, number] = [y1 + 48, y2 - buf];
      const boundsIfActive: [number, number] = isMobile ? [y1 + 48, y2 - buf] : [y1 + 48, y2 - 24];
      const looseActivationMark = y2 - window.innerHeight * 0.3;

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

    window.addEventListener("scroll", recalcFocused);
    window.addEventListener("resize", recalcFocused);
    recalcFocused();

    return () => {
      window.removeEventListener("scroll", recalcFocused);
      window.removeEventListener("resize", recalcFocused);
    };
  }, []);

  const value = useMemo(() => ({ focusedScriptId: scriptId }), [scriptId]);

  return (
    <FocusedScriptContext.Provider value={value}>{props.children}</FocusedScriptContext.Provider>
  );
};
