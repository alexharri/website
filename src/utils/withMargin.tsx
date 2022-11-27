import React from "react";

type Margin = [number, number];

export function withMargin<T>(margin: Margin, Component: React.ComponentType<T>) {
  return (props: T) => {
    const [topBottom, leftRight] = margin;
    return (
      <div style={{ margin: `${topBottom}px ${leftRight}px` }}>
        <Component {...(props as T & JSX.IntrinsicAttributes)} />
      </div>
    );
  };
}
