import React, { useRef, useLayoutEffect, useState } from "react";
import { useStyles } from "../../utils/styles";
import styles from "./SegmentedControl.styles";

interface Option<T> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T> {
  options: Option<T>[];
  value: T;
  setValue: (value: T) => void;
}

export const SegmentedControl = <T extends string>({
  options,
  value,
  setValue,
}: SegmentedControlProps<T>) => {
  const s = useStyles(styles);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const selectedIndex = options.findIndex(option => option.value === value);
    if (selectedIndex === -1) return;

    const buttons = containerRef.current.querySelectorAll('[data-option]');
    const selectedButton = buttons[selectedIndex] as HTMLElement;
    
    if (selectedButton) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = selectedButton.getBoundingClientRect();
      
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [value, options]);

  return (
    <div ref={containerRef} className={s("container")}>
      <div 
        className={s("indicator")} 
        style={{
          transform: `translateX(${indicatorStyle.left}px)`,
          width: indicatorStyle.width,
        }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          data-option
          className={s("option", { active: option.value === value })}
          onClick={() => setValue(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};